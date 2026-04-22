// ── DSP / classifier Web Worker ──────────────────────────────────────────────
// Runs outside the main thread so 60fps canvas rendering stays smooth.
// Receives per-channel Float32Array samples; emits score updates ~2Hz.

/// <reference lib="webworker" />

import { clean, psdBands, featureVec, differential, rms } from "./dsp";
import { Classifier } from "./classifier";
import { EWMA, MedianBuf } from "./smoothing";
import type {
  WorkerIn,
  WorkerOut,
  StateKey,
  Scores,
  BandPowers,
} from "./types";

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

let sampleRate = 256;
let channelCount = 4;
let notchFreq: 50 | 60 = 60;
let windowSec = 4.0;

// Ring buffers per channel
let ringBuffers: Float32Array[] = [];
let writePos: number[] = [];
let samplesSeen: number[] = [];

const classifier = new Classifier();
let smoothers: Record<StateKey, EWMA>;
let medians: Record<StateKey, MedianBuf>;

// Calibration state
let calibrating: StateKey | null = null;
let calSamplesCollected = 0;
let calVectors = 0;
let lastComputeTs = 0;
let lastCalProgressTs = 0;
let calStartTs = 0;
let calDurationMs = 40000;

function post(msg: WorkerOut) {
  self.postMessage(msg);
}

function initBuffers() {
  const len = Math.max(1, Math.floor(windowSec * sampleRate));
  ringBuffers = [];
  writePos = [];
  samplesSeen = [];
  for (let i = 0; i < channelCount; i++) {
    ringBuffers.push(new Float32Array(len));
    writePos.push(0);
    samplesSeen.push(0);
  }
  smoothers = {
    relaxation:    new EWMA(0.2),
    concentration: new EWMA(0.2),
    stress:        new EWMA(0.2),
  };
  medians = {
    relaxation:    new MedianBuf(7),
    concentration: new MedianBuf(7),
    stress:        new MedianBuf(7),
  };
}

function appendSamples(channelIdx: number, samples: Float32Array) {
  const buf = ringBuffers[channelIdx];
  const n = buf.length;
  let pos = writePos[channelIdx];
  for (let i = 0; i < samples.length; i++) {
    buf[pos] = samples[i];
    pos++;
    if (pos >= n) pos = 0;
  }
  writePos[channelIdx] = pos;
  samplesSeen[channelIdx] += samples.length;
}

function getWindow(channelIdx: number): Float32Array {
  const buf = ringBuffers[channelIdx];
  const n = buf.length;
  const pos = writePos[channelIdx];
  const out = new Float32Array(n);
  if (pos === 0) {
    out.set(buf);
  } else {
    out.set(buf.subarray(pos));
    out.set(buf.subarray(0, pos), n - pos);
  }
  return out;
}

function haveFullWindow(): boolean {
  const need = ringBuffers[0]?.length ?? 0;
  return samplesSeen.every(s => s >= need);
}

function computeFeatures(): {
  vec: Float64Array;
  bp2: BandPowers & { sef95: number };
  perChanRms: number[];
} {
  // Uses channel 0 as CH1 and channel 1 as CH2 (matches Python layout)
  // For 4-channel devices (Muse, Ganglion), we still emphasize first two.
  const sig1Raw = getWindow(0);
  const sig2Raw = channelCount >= 2 ? getWindow(1) : sig1Raw;
  const sig1 = clean(sig1Raw, sampleRate, notchFreq);
  const sig2 = clean(sig2Raw, sampleRate, notchFreq);
  const sigDiff = differential(sig2, sig1);

  const p1 = psdBands(sig1, sampleRate);
  const p2 = psdBands(sig2, sampleRate);
  const pDiff = psdBands(sigDiff, sampleRate);

  const vec = featureVec(p2, p1, pDiff);

  const perChanRms: number[] = [];
  for (let ch = 0; ch < channelCount; ch++) {
    perChanRms.push(rms(getWindow(ch)));
  }

  return { vec, bp2: p2, perChanRms };
}

function tryCompute(now: number) {
  if (!haveFullWindow()) return;
  if (now - lastComputeTs < 500) return;
  lastComputeTs = now;

  try {
    const { vec, bp2, perChanRms } = computeFeatures();

    if (calibrating) {
      classifier.addSample(calibrating, vec);
      calVectors++;
      const progress = Math.min(1, (now - calStartTs) / calDurationMs);
      if (now - lastCalProgressTs > 250) {
        lastCalProgressTs = now;
        post({ type: "calProgress", state: calibrating, progress, samples: calVectors });
      }
      if (progress >= 1) {
        const doneState = calibrating;
        calibrating = null;
        post({ type: "calStateDone", state: doneState, samples: calVectors });
      }
      return;
    }

    // Live scoring
    let scores: Scores;
    let confidence = 0;
    let calibrated = false;
    if (classifier.ready) {
      const raw = classifier.classify(vec)!;
      const rm = {
        relaxation:    medians.relaxation.update(raw.relaxation),
        concentration: medians.concentration.update(raw.concentration),
        stress:        medians.stress.update(raw.stress),
      };
      const sm = {
        relaxation:    smoothers.relaxation.update(rm.relaxation),
        concentration: smoothers.concentration.update(rm.concentration),
        stress:        smoothers.stress.update(rm.stress),
      };
      scores = sm;
      const sorted = Object.values(sm).sort((a, b) => b - a);
      confidence = Math.max(0.3, Math.min(0.98, 0.55 + (sorted[0] - sorted[1]) * 1.4));
      calibrated = true;
    } else {
      // Pre-calibration fallback: all three ~equal with tiny perturbation
      scores = { relaxation: 0.33, concentration: 0.33, stress: 0.33 };
      confidence = 0.33;
    }

    const dominant = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as StateKey;

    const bands: BandPowers = {
      delta: bp2.delta,
      theta: bp2.theta,
      alpha: bp2.alpha,
      beta:  bp2.beta,
      highBeta: bp2.highBeta,
    };

    post({
      type: "scores",
      scores,
      bands,
      sef95: bp2.sef95,
      dominant,
      confidence,
      calibrated,
      signalRms: perChanRms,
    });
  } catch (e: any) {
    post({ type: "error", message: e?.message || String(e) });
  }
}

self.addEventListener("message", (evt: MessageEvent<WorkerIn>) => {
  const msg = evt.data;
  switch (msg.type) {
    case "init":
      sampleRate = msg.sampleRate;
      channelCount = msg.channelCount;
      notchFreq = msg.notchFreq;
      initBuffers();
      post({ type: "ready" });
      break;

    case "samples": {
      for (let ch = 0; ch < Math.min(channelCount, msg.channels.length); ch++) {
        appendSamples(ch, msg.channels[ch]);
      }
      tryCompute(performance.now());
      break;
    }

    case "startCalibration":
      classifier.reset();
      calibrating = msg.state;
      calStartTs = performance.now();
      calDurationMs = msg.durationSec * 1000;
      calVectors = 0;
      lastCalProgressTs = 0;
      break;

    case "endCalibration":
      calibrating = null;
      break;

    case "finalizeCalibration": {
      try {
        const centroids = classifier.finalize();
        // Reset smoothers
        smoothers.relaxation.reset();
        smoothers.concentration.reset();
        smoothers.stress.reset();
        medians.relaxation.reset();
        medians.concentration.reset();
        medians.stress.reset();
        post({ type: "calComplete", centroids });
      } catch (e: any) {
        post({ type: "error", message: e?.message || "Calibration finalize failed" });
      }
      break;
    }

    case "loadCalibration":
      classifier.loadCentroids(msg.centroids);
      break;

    case "reset":
      classifier.reset();
      if (ringBuffers.length) initBuffers();
      break;
  }
});

// Initial buffer setup (will be redone on "init")
initBuffers();
