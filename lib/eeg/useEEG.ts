// ── useEEG: React hook that glues driver + worker + refs ────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DriverId,
  DriverStatus,
  StateKey,
  Scores,
  BandPowers,
  WorkerIn,
  WorkerOut,
} from "./types";
import { DeviceDriver, isWebBluetoothSupported } from "./drivers/base";
import { MuseDriver } from "./drivers/muse";
import { GanglionDriver } from "./drivers/ganglion";
import {
  loadCalibration,
  saveCalibration,
  clearCalibration,
  loadSettings,
  saveSettings,
  guessMainsFreq,
} from "./storage";

export type LiveState =
  | "disconnected"
  | "connecting"
  | "needsCalibration"
  | "calibrating"
  | "finalizing"
  | "live"
  | "signalLost";

export type CalPhase = {
  state: StateKey;
  label: string;
  instruction: string;
  countdown?: number;
  progress: number;
  samples: number;
};

const CAL_SEQUENCE: Array<{ key: StateKey; label: string; instruction: string }> = [
  {
    key: "relaxation",
    label: "RELAXED",
    instruction: "Close your eyes · breathe slowly · clear your mind completely",
  },
  {
    key: "concentration",
    label: "FOCUSED",
    instruction: "Eyes open · solve 300−7−7−7... keep going · stay locked in",
  },
  {
    key: "stress",
    label: "STRESSED",
    instruction: "Feel a real deadline · heart racing · pressure building now",
  },
];

// Per-channel ring buffer length for the raw-EEG canvas (≈ 6 s of display)
const RAW_BUFFER_LEN = 1500;

export function useEEG() {
  const [supported, setSupported] = useState<boolean>(true);
  const [liveState, setLiveState] = useState<LiveState>("disconnected");
  const [driverId, setDriverId] = useState<DriverId | null>(null);
  const [deviceName, setDeviceName] = useState<string>("");
  const [sampleRate, setSampleRate] = useState<number>(256);
  const [channelCount, setChannelCount] = useState<number>(4);
  const [channelLabels, setChannelLabels] = useState<string[]>([]);
  const [battery, setBattery] = useState<number | null>(null);
  const [notchFreq, setNotchFreq] = useState<50 | 60>(60);

  const [scores, setScores] = useState<Scores>({ relaxation: 0.33, concentration: 0.33, stress: 0.33 });
  const [bands, setBands] = useState<BandPowers>({ delta: 0, theta: 0, alpha: 0, beta: 0, highBeta: 0 });
  const [sef95, setSEF95] = useState<number>(18);
  const [dominant, setDominant] = useState<StateKey>("relaxation");
  const [confidence, setConfidence] = useState<number>(0.33);
  const [signalQuality, setSignalQuality] = useState<boolean[]>([true, true, true, true]);

  const [calPhase, setCalPhase] = useState<CalPhase | null>(null);
  const [calDone, setCalDone] = useState<Record<StateKey, boolean>>({
    relaxation: false,
    concentration: false,
    stress: false,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs for hot path
  const scoresRef = useRef<Scores>({ relaxation: 0.33, concentration: 0.33, stress: 0.33 });
  const rawBuffersRef = useRef<Float32Array[]>([]);
  const rawWritePosRef = useRef<number[]>([]);
  const driverRef = useRef<DeviceDriver | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const calIdxRef = useRef<number>(0);
  const unsubsRef = useRef<Array<() => void>>([]);

  // ── On mount: check support, load settings ───────────────────────────────
  useEffect(() => {
    setSupported(isWebBluetoothSupported());
    const s = loadSettings();
    // Override defaults via best-guess mains if not explicitly set
    const guess = guessMainsFreq();
    setNotchFreq(s.notchFreq ?? guess);
  }, []);

  // ── Ensure worker is ready before connect ────────────────────────────────
  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (evt: MessageEvent<WorkerOut>) => {
      const msg = evt.data;
      switch (msg.type) {
        case "ready":
          break;
        case "scores": {
          setScores(msg.scores);
          scoresRef.current = msg.scores;
          setBands(msg.bands);
          setSEF95(msg.sef95);
          setDominant(msg.dominant);
          setConfidence(msg.confidence);
          // Signal quality: amber if RMS outside expected range
          const SQ_HIGH = 150;   // µV — artifact
          const SQ_LOW = 0.5;    // near-zero: flatline
          setSignalQuality(msg.signalRms.map(v => v >= SQ_LOW && v <= SQ_HIGH));
          break;
        }
        case "calProgress":
          setCalPhase(p => p ? { ...p, progress: msg.progress, samples: msg.samples } : p);
          break;
        case "calStateDone": {
          setCalDone(prev => ({ ...prev, [msg.state]: true }));
          // Advance or finalize
          const nextIdx = calIdxRef.current + 1;
          calIdxRef.current = nextIdx;
          if (nextIdx < CAL_SEQUENCE.length) {
            runCalStep(nextIdx);
          } else {
            setLiveState("finalizing");
            workerRef.current?.postMessage({ type: "finalizeCalibration" } satisfies WorkerIn);
          }
          break;
        }
        case "calComplete": {
          // Persist centroids
          if (driverRef.current) {
            saveCalibration({
              driverId: driverRef.current.driverId,
              channelCount: driverRef.current.channelCount,
              sampleRate: driverRef.current.sampleRate,
              notchFreq,
              centroids: msg.centroids,
            });
          }
          setCalPhase(null);
          setCalDone({ relaxation: false, concentration: false, stress: false });
          calIdxRef.current = 0;
          setLiveState("live");
          break;
        }
        case "error":
          setErrorMsg(msg.message);
          break;
      }
    };
    workerRef.current = w;
    return w;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notchFreq]);

  const runCalStep = useCallback((idx: number) => {
    const step = CAL_SEQUENCE[idx];
    setCalPhase({
      state: step.key,
      label: step.label,
      instruction: step.instruction,
      countdown: 4,
      progress: 0,
      samples: 0,
    });
    // 4-second countdown
    let c = 4;
    const interval = setInterval(() => {
      c -= 1;
      if (c > 0) {
        setCalPhase(p => p ? { ...p, countdown: c } : p);
      } else {
        clearInterval(interval);
        setCalPhase(p => p ? { ...p, countdown: 0, progress: 0 } : p);
        // Kick the worker
        workerRef.current?.postMessage({
          type: "startCalibration",
          state: step.key,
          durationSec: 40,
        } satisfies WorkerIn);
      }
    }, 1000);
  }, []);

  // ── Connect to device ────────────────────────────────────────────────────
  const connect = useCallback(async (which: DriverId) => {
    setErrorMsg(null);
    if (!isWebBluetoothSupported()) {
      setErrorMsg("Web Bluetooth not supported in this browser. Use Chrome, Edge, or Brave.");
      setSupported(false);
      return;
    }
    setLiveState("connecting");
    setDriverId(which);

    const driver: DeviceDriver = which === "muse" ? new MuseDriver() : new GanglionDriver();
    driverRef.current = driver;
    setDeviceName(driver.name);
    setSampleRate(driver.sampleRate);
    setChannelCount(driver.channelCount);
    setChannelLabels(driver.channelLabels);

    // Initialize raw display buffers
    rawBuffersRef.current = new Array(driver.channelCount)
      .fill(0)
      .map(() => new Float32Array(RAW_BUFFER_LEN));
    rawWritePosRef.current = new Array(driver.channelCount).fill(0);

    // Spin up worker
    const worker = ensureWorker();
    worker.postMessage({
      type: "init",
      sampleRate: driver.sampleRate,
      channelCount: driver.channelCount,
      notchFreq,
    } satisfies WorkerIn);

    // Wire callbacks
    unsubsRef.current.push(
      driver.onStatus(s => {
        if (s === "connected") {
          // Decide next state: calibration vs live
          const cached = loadCalibration(driver.driverId, driver.channelCount, driver.sampleRate, notchFreq);
          if (cached) {
            workerRef.current?.postMessage({ type: "loadCalibration", centroids: cached } satisfies WorkerIn);
            setLiveState("live");
          } else {
            setLiveState("needsCalibration");
          }
        } else if (s === "lost") {
          setLiveState("signalLost");
        } else if (s === "disconnected") {
          setLiveState("disconnected");
        }
      }),
    );

    unsubsRef.current.push(
      driver.onSamples(channels => {
        // Copy to fresh arrays so we can transfer-free postMessage and also
        // write the same buffers to the raw display ring without fighting over ownership.
        const copied = channels.map(c => new Float32Array(c));
        workerRef.current?.postMessage({
          type: "samples",
          channels: copied,
        } satisfies WorkerIn);
        // Also write to raw display ring buffers
        for (let i = 0; i < Math.min(rawBuffersRef.current.length, channels.length); i++) {
          const buf = rawBuffersRef.current[i];
          const src = channels[i];
          let pos = rawWritePosRef.current[i];
          for (let k = 0; k < src.length; k++) {
            buf[pos] = src[k];
            pos++;
            if (pos >= buf.length) pos = 0;
          }
          rawWritePosRef.current[i] = pos;
        }
      }),
    );

    unsubsRef.current.push(
      driver.onBattery(pct => setBattery(pct)),
    );

    try {
      await driver.connect();
      saveSettings({ version: 1, notchFreq, lastDriver: which });
    } catch (e: any) {
      setErrorMsg(e?.message || "Pairing failed");
      setLiveState("disconnected");
    }
  }, [ensureWorker, notchFreq]);

  const disconnect = useCallback(async () => {
    try {
      await driverRef.current?.disconnect();
    } catch {}
    unsubsRef.current.forEach(fn => fn());
    unsubsRef.current = [];
    driverRef.current = null;
    setLiveState("disconnected");
    setBattery(null);
  }, []);

  // ── Calibration controls ─────────────────────────────────────────────────
  const startCalibration = useCallback(() => {
    if (liveState !== "needsCalibration" && liveState !== "live") return;
    setCalDone({ relaxation: false, concentration: false, stress: false });
    calIdxRef.current = 0;
    setLiveState("calibrating");
    runCalStep(0);
  }, [liveState, runCalStep]);

  const recalibrate = useCallback(() => {
    clearCalibration();
    startCalibration();
  }, [startCalibration]);

  const cancelCalibration = useCallback(() => {
    workerRef.current?.postMessage({ type: "endCalibration" } satisfies WorkerIn);
    setCalPhase(null);
    setCalDone({ relaxation: false, concentration: false, stress: false });
    calIdxRef.current = 0;
    setLiveState("needsCalibration");
  }, []);

  // ── Read raw-EEG buffer for canvas display ───────────────────────────────
  const readRawBuffer = useCallback((channelIdx: number, out: Float32Array): number => {
    if (channelIdx < 0 || channelIdx >= rawBuffersRef.current.length) return 0;
    const buf = rawBuffersRef.current[channelIdx];
    const pos = rawWritePosRef.current[channelIdx];
    const n = buf.length;
    // Copy in chronological order
    const firstLen = n - pos;
    out.set(buf.subarray(pos), 0);
    out.set(buf.subarray(0, pos), firstLen);
    return n;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubsRef.current.forEach(fn => fn());
      unsubsRef.current = [];
      driverRef.current?.disconnect().catch(() => {});
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Switch notch at runtime: invalidates worker init; easiest to require reconnect
  const changeNotch = useCallback((f: 50 | 60) => {
    setNotchFreq(f);
    saveSettings({ version: 1, notchFreq: f, lastDriver: driverId });
    // Calibration is tied to notch → invalidate
    clearCalibration();
    if (workerRef.current && driverRef.current) {
      workerRef.current.postMessage({
        type: "init",
        sampleRate: driverRef.current.sampleRate,
        channelCount: driverRef.current.channelCount,
        notchFreq: f,
      } satisfies WorkerIn);
      setLiveState("needsCalibration");
    }
  }, [driverId]);

  return {
    // state
    supported,
    liveState,
    driverId,
    deviceName,
    sampleRate,
    channelCount,
    channelLabels,
    battery,
    notchFreq,
    scores,
    bands,
    sef95,
    dominant,
    confidence,
    signalQuality,
    calPhase,
    calDone,
    errorMsg,
    // refs (for canvases)
    scoresRef,
    // actions
    connect,
    disconnect,
    startCalibration,
    cancelCalibration,
    recalibrate,
    changeNotch,
    readRawBuffer,
    CAL_SEQUENCE,
  };
}
