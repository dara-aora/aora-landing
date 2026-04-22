"""
eeg_server.py — Optimised for right-side temporal montage
CH1 = behind ear (mastoid)
CH2 = above/behind ear (T8 area)  ← primary EEG signal
GND = earlobe

Key changes vs previous:
- CH2 is the PRIMARY channel (T8 = best EEG site in this montage)
- CH1 used as secondary / differential reference
- Differential signal (CH2 - CH1) computed as 3rd virtual channel
- Longer calibration (40s per state)
- More features including asymmetry + spectral edge
- No artifact rejection — filtering handles noise
"""

import asyncio
import json
import collections
import numpy as np
import websockets
from scipy.signal import welch, iirnotch, sosfilt, butter, lfilter

from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

WINDOW_SEC   = 4.0
WS_PORT      = 8765
EWMA_ALPHA   = 0.2
CAL_DURATION = 40     # 40s per state — more data = better centroid
NOTCH_FREQ   = 50.0   # change to 60.0 if in North America

BANDS = {
    'delta': (1.0,  4.0),
    'theta': (4.0,  7.5),
    'alpha': (8.0,  13.0),
    'beta':  (13.0, 30.0),
    'high_beta': (20.0, 30.0),  # stress-specific sub-band
}

# ── Signal cleaning ───────────────────────────────────────────────────────────
def clean(sig, sr):
    x = sig.copy().astype(np.float64)
    # DC + drift removal
    x -= np.mean(x)
    t  = np.arange(len(x))
    x -= np.polyval(np.polyfit(t, x, 1), t)
    # Notch 50Hz
    nyq = sr / 2.0
    f0  = NOTCH_FREQ / nyq
    if f0 < 1.0:
        b_n, a_n = iirnotch(f0, Q=35.0)
        x = lfilter(b_n, a_n, x)
    # Bandpass 1–40Hz
    sos = butter(4, [1.0/nyq, min(40.0, nyq-1)/nyq], btype='band', output='sos')
    x   = sosfilt(sos, x)
    return x

# ── Welch PSD ─────────────────────────────────────────────────────────────────
def psd_bands(sig, sr):
    nperseg = min(len(sig), int(sr * 2))
    f, p    = welch(sig, fs=sr, nperseg=nperseg, noverlap=nperseg//2,
                    window='hann', detrend='linear')
    out = {}
    for name, (lo, hi) in BANDS.items():
        idx = (f >= lo) & (f <= hi)
        out[name] = float(np.trapz(p[idx], f[idx])) if idx.any() else 1e-9
    # Spectral edge frequency (95%) — rises under cognitive load
    total_p = np.trapz(p, f) + 1e-9
    cum     = np.cumsum(p * np.gradient(f))
    sef_idx = np.searchsorted(cum / cum[-1], 0.95)
    out['sef95'] = float(f[min(sef_idx, len(f)-1)])
    return out

# ── Rich feature vector ───────────────────────────────────────────────────────
def feature_vec(ch2, ch1, diff):
    """
    ch2  = T8 area (primary, above/behind ear)
    ch1  = mastoid (secondary, behind ear)
    diff = ch2 - ch1 (differential — removes common noise)
    """
    def _feats(p):
        a  = max(p['alpha'],     1e-9)
        t  = max(p['theta'],     1e-9)
        b  = max(p['beta'],      1e-9)
        hb = max(p['high_beta'], 1e-9)
        d  = max(p['delta'],     1e-9)
        total = a + t + b + d + 1e-9
        return [
            a / total,           # alpha relative
            t / total,           # theta relative
            b / total,           # beta relative
            hb / total,          # high-beta relative
            b / a,               # beta/alpha  (stress)
            t / a,               # theta/alpha (concentration)
            a / (t + b + 1e-9),  # alpha dominance (relaxation)
            np.log1p(b / a),     # log beta/alpha
            p.get('sef95', 20),  # spectral edge
        ]

    f2   = _feats(ch2)
    f1   = _feats(ch1)
    fdif = _feats(diff)

    # Differential features (CH2 - CH1 power ratios as extra discriminant)
    alpha_asym = (ch2['alpha'] - ch1['alpha']) / (ch2['alpha'] + ch1['alpha'] + 1e-9)
    beta_asym  = (ch2['beta']  - ch1['beta'])  / (ch2['beta']  + ch1['beta']  + 1e-9)

    return np.array(f2 + f1 + fdif + [alpha_asym, beta_asym], dtype=np.float64)

# ── Smoothers ─────────────────────────────────────────────────────────────────
class EWMA:
    def __init__(self, a=EWMA_ALPHA):
        self.a = a; self.v = None
    def update(self, x):
        self.v = x if self.v is None else self.a*x + (1-self.a)*self.v
        return self.v

class MedianBuf:
    def __init__(self, n=7):
        self.buf = collections.deque(maxlen=n)
    def update(self, x):
        self.buf.append(x); return float(np.median(self.buf))

# ── Calibration ───────────────────────────────────────────────────────────────
class Calibration:
    def __init__(self):
        self.data = {}

    def add(self, state, vec):
        self.data.setdefault(state, []).append(vec)

    def finalize(self):
        self.centroids = {}
        for state, vecs in self.data.items():
            arr = np.stack(vecs)
            self.centroids[state] = {
                'mean': arr.mean(0),
                'std':  arr.std(0) + 1e-6,
            }
            print(f"[CAL] {state}: {len(vecs)} samples  "
                  f"feature_mean={np.round(arr.mean(0)[:4], 3)}")

    def classify(self, vec):
        if not hasattr(self, 'centroids'): return None
        dists = {}
        for state, c in self.centroids.items():
            z = (vec - c['mean']) / c['std']
            dists[state] = float(np.sqrt(np.mean(z**2)))
        keys = list(dists)
        d    = np.array([dists[k] for k in keys])
        inv  = np.exp(-d * 1.5)   # sharpen separation
        prob = inv / (inv.sum() + 1e-9)
        return {k: float(p) for k, p in zip(keys, prob)}

    @property
    def ready(self):
        return hasattr(self, 'centroids') and len(self.centroids) == 3

# ── WebSocket ─────────────────────────────────────────────────────────────────
clients = set()
recalibrate_event = asyncio.Event()

async def broadcast(msg):
    if clients:
        d = json.dumps(msg)
        await asyncio.gather(*[c.send(d) for c in clients], return_exceptions=True)

async def ws_handler(ws):
    clients.add(ws)
    print(f"[WS] Connected ({len(clients)})")
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
                if msg.get("type") == "recalibrate":
                    print("[WS] Recalibration requested by client")
                    recalibrate_event.set()
            except Exception as e:
                print(f"[WS] Bad message: {e}")
    finally:
        clients.discard(ws)
        print(f"[WS] Disconnected ({len(clients)})")

# ── Calibration flow ──────────────────────────────────────────────────────────
CAL_SEQUENCE = [
    ("relaxation",
     "RELAXED",
     "Close eyes · breathe slowly (4 counts in, 6 out) · completely empty your mind"),
    ("concentration",
     "FOCUSED",
     "Eyes open · solve this: 300 − 7 − 7 − 7... keep going · stay locked in"),
    ("stress",
     "STRESSED",
     "Eyes open · imagine a tense deadline · your heart is racing · feel it"),
]

async def calibrate(board, sr, ch1_idx, ch2_idx, win_samples):
    cal = Calibration()

    for state_key, label, instruction in CAL_SEQUENCE:
        print(f"\n[CAL] ── {label} ── preparing 4s")
        await broadcast({
            "type": "cal_phase", "state": state_key,
            "label": label, "instruction": instruction, "countdown": 4,
        })
        await asyncio.sleep(4)

        start = asyncio.get_event_loop().time()
        n     = 0

        while True:
            elapsed  = asyncio.get_event_loop().time() - start
            progress = min(elapsed / CAL_DURATION, 1.0)

            data = board.get_current_board_data(win_samples)
            if data.shape[1] >= win_samples:
                sig1   = clean(data[ch1_idx, :], sr)
                sig2   = clean(data[ch2_idx, :], sr)
                sig_df = sig2 - sig1          # differential

                p1   = psd_bands(sig1,   sr)
                p2   = psd_bands(sig2,   sr)
                p_df = psd_bands(sig_df, sr)

                vec = feature_vec(p2, p1, p_df)
                cal.add(state_key, vec)
                n += 1

            await broadcast({
                "type": "cal_progress", "state": state_key,
                "progress": round(progress, 3), "samples": n, "skipped": 0,
            })
            print(f"[CAL] {label} {int(progress*100):3d}%  samples={n}")

            if elapsed >= CAL_DURATION:
                break
            await asyncio.sleep(0.5)

        await broadcast({"type": "cal_done", "state": state_key, "samples": n})
        print(f"[CAL] {label} done — {n} samples")

    cal.finalize()
    await broadcast({"type": "cal_complete"})
    return cal

# ── EEG loop ──────────────────────────────────────────────────────────────────
async def eeg_loop():
    params   = BrainFlowInputParams()
    board_id = BoardIds.GANGLION_NATIVE_BOARD.value
    board    = BoardShim(board_id, params)

    print("Connecting to Ganglion...")
    board.prepare_session()
    board.start_stream()

    sr          = BoardShim.get_sampling_rate(board_id)
    eeg_chs     = BoardShim.get_eeg_channels(board_id)

    # CH1 = eeg_chs[0] (mastoid/behind ear)
    # CH2 = eeg_chs[1] (T8/above-behind ear) ← primary
    ch1_idx     = eeg_chs[0]
    ch2_idx     = eeg_chs[1]
    win_samples = int(WINDOW_SEC * sr)

    print(f"[INFO] SR={sr}Hz  window={WINDOW_SEC}s")
    print(f"[INFO] CH1=mastoid(behind ear)  CH2=T8(above-behind ear)")
    print(f"[INFO] Montage: differential CH2-CH1 + individual channels")
    await asyncio.sleep(2)

    try:
        while True:
            # ── Calibration phase (runs at startup, and again whenever recalibrate is requested) ──
            recalibrate_event.clear()
            await broadcast({"type": "status", "phase": "calibrating"})
            cal = await calibrate(board, sr, ch1_idx, ch2_idx, win_samples)

            smoothers = {k: EWMA()      for k in ('relaxation','concentration','stress')}
            medians   = {k: MedianBuf() for k in ('relaxation','concentration','stress')}

            await broadcast({"type": "status", "phase": "live"})
            print("[LIVE] Running")

            # ── Live loop (breaks out when recalibration is requested) ──
            while not recalibrate_event.is_set():
                data = board.get_current_board_data(win_samples)
                if data.shape[1] < win_samples:
                    await asyncio.sleep(0.1)
                    continue

                sig1   = clean(data[ch1_idx, :], sr)
                sig2   = clean(data[ch2_idx, :], sr)
                sig_df = sig2 - sig1

                p1   = psd_bands(sig1,   sr)
                p2   = psd_bands(sig2,   sr)
                p_df = psd_bands(sig_df, sr)

                vec    = feature_vec(p2, p1, p_df)
                raw    = cal.classify(vec)
                if raw is None:
                    await asyncio.sleep(0.5)
                    continue

                med    = {k: medians[k].update(raw[k])    for k in raw}
                smooth = {k: smoothers[k].update(med[k])  for k in med}
                state  = max(smooth, key=smooth.get)

                print(
                    f"[{state.upper():<13}] "
                    f"relax={smooth['relaxation']:.2f}  "
                    f"conc={smooth['concentration']:.2f}  "
                    f"stress={smooth['stress']:.2f}  "
                    f"α={p2['alpha']:.3f} θ={p2['theta']:.3f} β={p2['beta']:.3f}"
                )

                await broadcast({
                    "type":       "data",
                    "state":      state,
                    "scores":     {k: round(v,3) for k,v in smooth.items()},
                    "bands":      {k: round(p2.get(k,0),4)
                                   for k in ('theta','alpha','beta')},
                    "calibrated": True,
                })

                await asyncio.sleep(0.5)

            print("[LOOP] Recalibration requested — restarting calibration...")

    except asyncio.CancelledError:
        pass
    finally:
        board.stop_stream()
        board.release_session()
        print("Board released.")

async def main():
    server = await websockets.serve(ws_handler, "localhost", WS_PORT)
    print(f"[WS] ws://localhost:{WS_PORT}")
    await asyncio.gather(server.serve_forever(), eeg_loop())

if __name__ == "__main__":
    asyncio.run(main())