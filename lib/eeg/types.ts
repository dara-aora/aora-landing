// ── Shared types for the EEG pipeline ────────────────────────────────────────

export type StateKey = "relaxation" | "concentration" | "stress";

export type Scores = {
  relaxation: number;
  concentration: number;
  stress: number;
};

export type BandPowers = {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  highBeta: number;
};

export type DriverStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "lost";

export type DriverId = "muse" | "ganglion";

// Per-channel raw sample vector (one entry per channel)
export type ChannelSamples = Float32Array[];

export interface DeviceInfo {
  driverId: DriverId;
  name: string;
  sampleRate: number;        // 256 for Muse, 200 for Ganglion
  channelCount: number;      // always 4 in practice
  channelLabels: string[];
}

// Worker message contracts
export type WorkerIn =
  | { type: "init"; sampleRate: number; channelCount: number; notchFreq: 50 | 60 }
  | { type: "samples"; channels: Float32Array[] }            // per-channel
  | { type: "startCalibration"; state: StateKey; durationSec: number }
  | { type: "endCalibration" }
  | { type: "finalizeCalibration" }
  | { type: "loadCalibration"; centroids: Record<StateKey, { mean: number[]; std: number[] }> }
  | { type: "reset" };

export type WorkerOut =
  | { type: "ready" }
  | {
      type: "scores";
      scores: Scores;
      bands: BandPowers;
      sef95: number;
      dominant: StateKey;
      confidence: number;
      calibrated: boolean;
      signalRms: number[];     // per channel
    }
  | { type: "calProgress"; state: StateKey; progress: number; samples: number }
  | { type: "calStateDone"; state: StateKey; samples: number }
  | {
      type: "calComplete";
      centroids: Record<StateKey, { mean: number[]; std: number[] }>;
    }
  | { type: "error"; message: string };
