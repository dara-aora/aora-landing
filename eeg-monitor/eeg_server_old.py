"""
EEG Stress Monitor — Ganglion 2-Channel Ear EEG
================================================
Signal processing pipeline:
  1. Bandpass filter 0.5–45 Hz (remove DC drift + alias above Nyquist/2)
  2. Notch filter 50/60 Hz (powerline)
  3. 200 ms sub-window EMG / motion artifact rejection
     • peak-to-peak > 100 µV  → reject sub-window
     • high-freq power (20–40 Hz) > 4 × low-freq power (4–12 Hz) → reject sub-window
  4. Welch PSD on clean sub-windows (far more accurate than bandpass+RMS)
  5. Relative band powers (theta, alpha, beta) — eliminates amplitude drift
  6. Primary stress index: theta / alpha  (avoids beta/EMG contamination)
  7. Secondary check: cross-channel alpha coherence (high = real brain signal)
  8. Z-score normalization against personal calibration baseline
  9. Exponential smoothing on final index before broadcast
"""

import asyncio
import json
import time
import numpy as np
from scipy.signal import welch, coherence as sp_coherence
import websockets

from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes, DetrendOperations, NoiseTypes

# ── SETTINGS ──────────────────────────────────────────────────────────────────
WINDOW_SEC          = 3.0    # analysis window length (seconds)
SUB_WIN_SEC         = 0.2    # EMG rejection sub-window (seconds)
CAL_DURATION        = 30     # calibration duration per state (seconds)
WS_PORT             = 8765
LOOP_INTERVAL       = 0.5    # broadcast interval (seconds)

# Frequency bands (Hz)
DELTA_BAND  = (0.5,  4.0)
THETA_BAND  = (4.0,  7.0)
ALPHA_BAND  = (8.0, 12.0)
BETA_BAND   = (13.0, 30.0)
HF_EMG_BAND = (20.0, 40.0)   # high-freq band used for EMG detection

# Artifact rejection thresholds
# BrainFlow Ganglion delivers data in microvolts (µV), not Volts
EMG_PTP_UV          = 100.0    # peak-to-peak threshold in µV
EMG_HF_RATIO        = 4.0      # HF power / LF power ratio → EMG suspected
MAX_REJECT_FRACTION = 0.7      # if >70 % of sub-windows rejected, mark epoch as bad

# Smoothing
EMA_ALPHA           = 0.25     # exponential moving average weight for stress index

# Status thresholds (z-score of stress index vs. relaxed baseline)
Z_HIGH              = 0.8      # above this z-score → "high"
Z_OVERLOAD          = 1.6      # above this z-score → "overload"

# ── HELPERS ───────────────────────────────────────────────────────────────────

def band_power(psd: np.ndarray, freqs: np.ndarray, low: float, high: float) -> float:
    """Integrate PSD between low and high Hz using the trapezoid rule."""
    mask = (freqs >= low) & (freqs <= high)
    if not np.any(mask):
        return 0.0
    return float(np.trapz(psd[mask], freqs[mask]))


def detect_emg(sub_win: np.ndarray, sr: int) -> bool:
    """
    Return True if the sub-window looks like an EMG / motion artifact.

    Only peak-to-peak amplitude is used. The HF/LF power ratio approach
    requires far more samples than a 200 ms window provides — at 200 Hz
    that is only 40 samples, giving frequency resolution of 5 Hz/bin which
    makes the ratio unreliable and produces constant false positives on
    clean EEG. P2P amplitude is the appropriate metric at this window length.
    """
    return np.ptp(sub_win) > EMG_PTP_UV


def preprocess_channel(raw: np.ndarray, sr: int) -> np.ndarray:
    """
    Detrend, bandpass 0.5-45 Hz, 50 Hz + 60 Hz notch.
    Returns the filtered signal (in-place modifications on a copy).
    """
    sig = raw.copy().astype(np.float64)
    DataFilter.detrend(sig, DetrendOperations.LINEAR.value)
    # Bandpass 0.5–45 Hz
    DataFilter.perform_bandpass(sig, sr, 0.5, 45.0, 4,
                                FilterTypes.BUTTERWORTH.value, 0)
    # Powerline notch
    DataFilter.remove_environmental_noise(sig, sr, NoiseTypes.FIFTY.value)
    DataFilter.remove_environmental_noise(sig, sr, NoiseTypes.SIXTY.value)
    return sig


def reject_artifacts(sig: np.ndarray, sr: int):
    """
    Split signal into 200 ms sub-windows, reject EMG/motion ones.
    Returns (clean_signal, rejection_fraction).
    clean_signal concatenates only the accepted sub-windows.
    """
    sub_n = int(SUB_WIN_SEC * sr)
    n_wins = len(sig) // sub_n
    clean_parts = []
    rejected = 0

    for i in range(n_wins):
        w = sig[i * sub_n: (i + 1) * sub_n]
        if detect_emg(w, sr):
            rejected += 1
        else:
            clean_parts.append(w)

    reject_frac = rejected / max(n_wins, 1)
    if not clean_parts:
        return None, reject_frac

    return np.concatenate(clean_parts), reject_frac


def extract_features(sig: np.ndarray, sr: int) -> dict | None:
    """
    Compute band powers and derived indices using Welch's PSD.
    Returns None if signal is too short or all noise.
    """
    nperseg = min(len(sig), int(sr * 1.0))  # 1-second Welch segments
    if nperseg < 16:
        return None

    freqs, psd = welch(sig, sr, nperseg=nperseg, noverlap=nperseg // 2,
                       scaling='density', average='median')

    theta = band_power(psd, freqs, *THETA_BAND)
    alpha = band_power(psd, freqs, *ALPHA_BAND)
    beta  = band_power(psd, freqs, *BETA_BAND)
    delta = band_power(psd, freqs, *DELTA_BAND)
    total = delta + theta + alpha + beta + 1e-12

    rel_theta = theta / total
    rel_alpha = alpha / total
    rel_beta  = beta  / total

    # Primary index: theta/alpha (most EMG-robust ear-EEG marker)
    ta_ratio = theta / max(alpha, 1e-12)

    # Secondary: classic engagement index (beta-contaminated, used as reference)
    engagement = beta / max(alpha + theta, 1e-12)

    return {
        "theta": theta,
        "alpha": alpha,
        "beta":  beta,
        "rel_theta": rel_theta,
        "rel_alpha": rel_alpha,
        "rel_beta":  rel_beta,
        "ta_ratio":  ta_ratio,
        "engagement": engagement,
    }


def compute_alpha_coherence(sig1: np.ndarray, sig2: np.ndarray, sr: int) -> float:
    """
    Mean coherence between the two channels in the alpha band.
    High coherence (> ~0.5) suggests the signal is genuine brain activity,
    not independent channel-specific noise or EMG.
    """
    n = min(len(sig1), len(sig2))
    if n < sr:          # need at least 1 second
        return 0.0
    sig1, sig2 = sig1[:n], sig2[:n]
    nperseg = min(n, int(sr * 1.0))
    freqs, coh = sp_coherence(sig1, sig2, sr, nperseg=nperseg,
                               noverlap=nperseg // 2)
    mask = (freqs >= ALPHA_BAND[0]) & (freqs <= ALPHA_BAND[1])
    if not np.any(mask):
        return 0.0
    return float(np.mean(coh[mask]))


# ── CALIBRATION ───────────────────────────────────────────────────────────────

def calibrate_state(board, sr, active_channels, duration=CAL_DURATION):
    """
    Collect clean epochs for `duration` seconds.
    Returns (mean_ta_ratio, std_ta_ratio, mean_engagement, n_good_epochs).
    Each epoch is WINDOW_SEC long; only artifact-free epochs are included.
    """
    win_n       = int(WINDOW_SEC * sr)
    ta_samples  = []
    eng_samples = []
    start_time  = time.time()
    last_sample = time.time()

    while time.time() - start_time < duration:
        # Wait until a fresh window is ready
        if time.time() - last_sample < LOOP_INTERVAL:
            time.sleep(0.05)
            continue
        last_sample = time.time()

        raw = board.get_current_board_data(win_n)
        if raw.shape[1] < win_n:
            time.sleep(0.1)
            continue

        ch_ta, ch_eng = [], []
        epoch_ok = True

        for ch in active_channels:
            sig = preprocess_channel(raw[ch, :], sr)
            clean, rej_frac = reject_artifacts(sig, sr)

            if clean is None or rej_frac > MAX_REJECT_FRACTION:
                epoch_ok = False
                break

            feats = extract_features(clean, sr)
            if feats is None:
                epoch_ok = False
                break

            ch_ta.append(feats["ta_ratio"])
            ch_eng.append(feats["engagement"])

        if epoch_ok and ch_ta:
            ta_samples.append(float(np.mean(ch_ta)))
            eng_samples.append(float(np.mean(ch_eng)))

    n_good = len(ta_samples)
    if n_good == 0:
        # Fallback: return neutral values so the system can still run
        return 1.0, 0.5, 1.0, 0

    return (float(np.mean(ta_samples)),
            float(np.std(ta_samples)) or 0.3,
            float(np.mean(eng_samples)),
            n_good)


# ── WEBSOCKET ─────────────────────────────────────────────────────────────────
connected_clients: set = set()

async def broadcast(msg: dict):
    if not connected_clients:
        return
    payload = json.dumps(msg)
    await asyncio.gather(
        *[c.send(payload) for c in connected_clients],
        return_exceptions=True
    )

async def ws_handler(websocket):
    connected_clients.add(websocket)
    print(f"[WS] Client connected  ({len(connected_clients)} total)")
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)
        print("[WS] Client disconnected")


# ── MAIN EEG LOOP ─────────────────────────────────────────────────────────────

async def eeg_loop():
    params   = BrainFlowInputParams()
    board_id = BoardIds.GANGLION_NATIVE_BOARD.value
    board    = BoardShim(board_id, params)

    print("Connecting to Ganglion via Native Bluetooth…")
    board.prepare_session()
    board.start_stream()

    sr      = BoardShim.get_sampling_rate(board_id)
    eeg_chs = BoardShim.get_eeg_channels(board_id)
    ACTIVE  = [eeg_chs[0], eeg_chs[1]]   # CH1 + CH2 (ear electrodes)

    print(f"[INFO] Sampling rate: {sr} Hz  |  Channels: {ACTIVE}")

    # ── RELAXED CALIBRATION ─────────────────────────────────────────────────
    await broadcast({"type": "status", "phase": "cal_relaxed"})
    print(f"\n>>> RELAXED calibration ({CAL_DURATION}s) — close eyes, breathe slowly…")
    await asyncio.sleep(2)   # brief settle time

    (relaxed_ta_mean, relaxed_ta_std,
     relaxed_eng_mean, n_relaxed) = await asyncio.get_event_loop().run_in_executor(
        None, calibrate_state, board, sr, ACTIVE
    )
    print(f"  Relaxed  TA={relaxed_ta_mean:.4f} ±{relaxed_ta_std:.4f}  "
          f"(n={n_relaxed} good epochs)")
    await broadcast({
        "type": "calibration", "state": "relaxed",
        "ta_mean": relaxed_ta_mean, "ta_std": relaxed_ta_std,
        "n_epochs": n_relaxed,
    })

    # ── STRESSED CALIBRATION ─────────────────────────────────────────────────
    await broadcast({"type": "status", "phase": "cal_stressed"})
    print(f"\n>>> STRESSED calibration ({CAL_DURATION}s) — mental math, stressful thoughts…")
    await asyncio.sleep(2)

    (stressed_ta_mean, stressed_ta_std,
     stressed_eng_mean, n_stressed) = await asyncio.get_event_loop().run_in_executor(
        None, calibrate_state, board, sr, ACTIVE
    )
    print(f"  Stressed TA={stressed_ta_mean:.4f} ±{stressed_ta_std:.4f}  "
          f"(n={n_stressed} good epochs)")
    await broadcast({
        "type": "calibration", "state": "stressed",
        "ta_mean": stressed_ta_mean, "ta_std": stressed_ta_std,
        "n_epochs": n_stressed,
    })

    # ── DERIVE NORMALIZATION PARAMETERS ──────────────────────────────────────
    # We z-score the live TA ratio against the relaxed baseline.
    # Positive z-score = more stressed than baseline.
    # We also stretch by the inter-state distance so the full range relaxed→stressed ≈ 0→1.
    baseline_mean = relaxed_ta_mean
    baseline_std  = max(relaxed_ta_std, 0.05)   # floor to avoid division by near-zero

    # Expected z-score at stressed state
    z_stressed    = (stressed_ta_mean - baseline_mean) / baseline_std

    await broadcast({
        "type": "threshold",
        "relaxed":      relaxed_ta_mean,
        "stressed":     stressed_ta_mean,
        "baseline_std": baseline_std,
        "z_stressed":   z_stressed,
    })
    await broadcast({"type": "status", "phase": "live"})
    print(f"\n>>> LIVE monitoring  "
          f"baseline={baseline_mean:.4f} ±{baseline_std:.4f}  "
          f"z_stressed={z_stressed:.2f}")

    # ── LIVE LOOP ─────────────────────────────────────────────────────────────
    win_n        = int(WINDOW_SEC * sr)
    smooth_index = 0.5   # start at mid-range
    loop_errors  = 0

    try:
        while True:
            await asyncio.sleep(LOOP_INTERVAL)

            try:
                raw = board.get_current_board_data(win_n)
            except Exception as e:
                loop_errors += 1
                print(f"[WARN] Board read error #{loop_errors}: {e}")
                if loop_errors > 10:
                    break
                continue

            if raw.shape[1] < win_n:
                continue

            loop_errors = 0  # reset on successful read

            ch_ta        = []
            ch_eng       = []
            ch_rel_alpha = []
            ch_rel_theta = []
            ch_rel_beta  = []
            ch_clean     = []   # for coherence
            total_reject = []

            epoch_ok = True

            for ch in ACTIVE:
                sig = preprocess_channel(raw[ch, :], sr)
                clean, rej_frac = reject_artifacts(sig, sr)
                total_reject.append(rej_frac)

                if clean is None or rej_frac > MAX_REJECT_FRACTION:
                    epoch_ok = False
                    break

                feats = extract_features(clean, sr)
                if feats is None:
                    epoch_ok = False
                    break

                ch_ta.append(feats["ta_ratio"])
                ch_eng.append(feats["engagement"])
                ch_rel_alpha.append(feats["rel_alpha"])
                ch_rel_theta.append(feats["rel_theta"])
                ch_rel_beta.append(feats["rel_beta"])
                ch_clean.append(clean)

            avg_reject = float(np.mean(total_reject)) if total_reject else 1.0

            if not epoch_ok or not ch_ta:
                # Broadcast artifact warning but keep last smooth_index
                await broadcast({
                    "type":        "data",
                    "index":       round(smooth_index, 4),
                    "status":      "artifact",
                    "artifact_pct": round(avg_reject * 100, 1),
                    "coherence":   0.0,
                    "bands": {
                        "rel_theta": 0, "rel_alpha": 0, "rel_beta": 0,
                    },
                    "relaxed":     relaxed_ta_mean,
                    "stressed":    stressed_ta_mean,
                })
                # Print per-channel peak-to-peak so threshold can be tuned
                ptps = [f"ch{i}={np.ptp(preprocess_channel(raw[ch,:],sr)):.1f}µV"
                        for i, ch in enumerate(ACTIVE)]
                print(f"[ARTIFACT ] reject={avg_reject:.0%}  ptp=({', '.join(ptps)})")
                continue

            # Mean across channels
            ta_now    = float(np.mean(ch_ta))
            eng_now   = float(np.mean(ch_eng))

            # Z-score normalization: 0 = relaxed baseline, z_stressed ≈ stressed baseline
            z_raw     = (ta_now - baseline_mean) / baseline_std

            # Map z_raw to 0–1:  0 at relaxed baseline, 1 at stressed baseline
            # Handle inverted case (stressed_ta < relaxed_ta is unusual but possible)
            if abs(z_stressed) < 0.2:
                # Baselines too close — fall back to simple ratio
                norm = np.clip((ta_now - relaxed_ta_mean) /
                               max(abs(stressed_ta_mean - relaxed_ta_mean), 0.1),
                               0.0, 1.0)
            else:
                norm = np.clip(z_raw / z_stressed, 0.0, 1.0)

            norm = float(norm)

            # Cross-channel alpha coherence (signal quality proxy)
            if len(ch_clean) == 2:
                coherence = compute_alpha_coherence(ch_clean[0], ch_clean[1], sr)
            else:
                coherence = 1.0  # single channel — assume ok

            # Exponential smoothing
            smooth_index = EMA_ALPHA * norm + (1.0 - EMA_ALPHA) * smooth_index

            # Status from z-score
            if z_raw >= Z_OVERLOAD * abs(z_stressed) / max(abs(z_stressed), 0.1):
                status = "overload"
            elif z_raw >= Z_HIGH * abs(z_stressed) / max(abs(z_stressed), 0.1):
                status = "high"
            else:
                status = "normal"

            await broadcast({
                "type":        "data",
                "index":       round(smooth_index, 4),
                "status":      status,
                "artifact_pct": round(avg_reject * 100, 1),
                "coherence":   round(coherence, 3),
                "bands": {
                    "rel_theta": round(float(np.mean(ch_rel_theta)), 4),
                    "rel_alpha": round(float(np.mean(ch_rel_alpha)), 4),
                    "rel_beta":  round(float(np.mean(ch_rel_beta)),  4),
                    "ta_ratio":  round(ta_now, 4),
                    "engagement": round(eng_now, 4),
                },
                "relaxed":     relaxed_ta_mean,
                "stressed":    stressed_ta_mean,
            })

            signal_quality = "GOOD" if coherence > 0.5 and avg_reject < 0.3 else \
                             "FAIR" if coherence > 0.3 or avg_reject < 0.5 else "POOR"
            print(f"[{status.upper(): <8}] "
                  f"idx={smooth_index:.3f}  "
                  f"z={z_raw:+.2f}  "
                  f"TA={ta_now:.3f}  "
                  f"coh={coherence:.2f}  "
                  f"rej={avg_reject:.0%}  "
                  f"sig={signal_quality}")

    except asyncio.CancelledError:
        pass
    finally:
        board.stop_stream()
        board.release_session()
        print("Board released.")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

async def main():
    server = await websockets.serve(ws_handler, "localhost", WS_PORT)
    print(f"[WS] Server listening on ws://localhost:{WS_PORT}")
    # Give the browser a moment to connect before the EEG loop starts
    # broadcasting calibration status messages
    print("[WS] Waiting 3s for clients to connect...")
    await asyncio.sleep(3)
    await asyncio.gather(server.serve_forever(), eeg_loop())

if __name__ == "__main__":
    asyncio.run(main())
