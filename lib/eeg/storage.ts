// ── localStorage persistence for calibration + settings ─────────────────────

import type { Centroids } from "./classifier";
import type { DriverId } from "./types";

const CAL_KEY = "aora-live-calibration-v1";
const SETTINGS_KEY = "aora-live-settings-v1";

export type CalibrationRecord = {
  version: 1;
  driverId: DriverId;
  channelCount: number;
  sampleRate: number;
  notchFreq: 50 | 60;
  centroids: Centroids;
  createdAt: number;
};

export type LiveSettings = {
  version: 1;
  notchFreq: 50 | 60;
  lastDriver: DriverId | null;
};

export function loadCalibration(
  driverId: DriverId,
  channelCount: number,
  sampleRate: number,
  notchFreq: 50 | 60
): Centroids | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CAL_KEY);
    if (!raw) return null;
    const r: CalibrationRecord = JSON.parse(raw);
    if (r.version !== 1) return null;
    if (r.driverId !== driverId) return null;
    if (r.channelCount !== channelCount) return null;
    if (r.sampleRate !== sampleRate) return null;
    if (r.notchFreq !== notchFreq) return null;
    return r.centroids;
  } catch {
    return null;
  }
}

export function saveCalibration(rec: Omit<CalibrationRecord, "version" | "createdAt">) {
  if (typeof window === "undefined") return;
  const full: CalibrationRecord = { version: 1, createdAt: Date.now(), ...rec };
  try {
    localStorage.setItem(CAL_KEY, JSON.stringify(full));
  } catch (e) {
    console.warn("saveCalibration failed", e);
  }
}

export function clearCalibration() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CAL_KEY);
}

export function loadSettings(): LiveSettings {
  const defaults: LiveSettings = { version: 1, notchFreq: 60, lastDriver: null };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const s = JSON.parse(raw);
    if (s.version !== 1) return defaults;
    return { version: 1, notchFreq: s.notchFreq === 50 ? 50 : 60, lastDriver: s.lastDriver ?? null };
  } catch {
    return defaults;
  }
}

export function saveSettings(s: LiveSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("saveSettings failed", e);
  }
}

// Best-effort mains-frequency guess from navigator.language.
// 60Hz primarily in North America + parts of South America + Japan/Korea.
export function guessMainsFreq(): 50 | 60 {
  if (typeof navigator === "undefined") return 60;
  const l = (navigator.language || "en-US").toLowerCase();
  const hz60Prefixes = ["en-us", "en-ca", "es-mx", "ja", "ko", "pt-br", "es-co", "es-pe", "es-ve"];
  return hz60Prefixes.some(p => l === p || l.startsWith(p + "-") || l === p.split("-")[0]) ? 60 : 50;
}
