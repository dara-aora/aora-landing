"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";

/**
 * A single hairline-ruled row of four vitals about the device.
 * Values are pulled from the existing system-architecture copy —
 * no new claims introduced here.
 */

type Spec = {
  label: string;
  value: string;
  unit?: string;
};

const SPECS: ReadonlyArray<Spec> = [
  { label: "Weight", value: "< 8", unit: "g" },
  { label: "Form", value: "Behind-the-ear" },
  { label: "Sensors", value: "ECG · PPG · LED" },
  { label: "Connectivity", value: "BLE 5.4" },
];

export function ProductSpecStrip() {
  return (
    <section
      className="relative px-6 md:px-10 py-16 md:py-24 snap-section flex items-center"
      style={{ backgroundColor: "var(--ink)" }}
      aria-label="Aora Nano specifications"
    >
      <div className="mx-auto max-w-content w-full">
        <FadeUp>
          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            {SPECS.map((s) => (
              <div
                key={s.label}
                className="py-8 md:py-10 px-4 md:px-6"
                style={{ borderBottom: "1px solid var(--rule)" }}
              >
                <SmallCaps className="block mb-3">{s.label}</SmallCaps>
                <div
                  className="font-mono tabular-nums leading-none text-[22px] md:text-[28px]"
                  style={{ color: "var(--paper)" }}
                >
                  {s.value}
                  {s.unit ? (
                    <span
                      className="ml-1 text-[14px] md:text-[16px]"
                      style={{ color: "var(--mute)" }}
                    >
                      {s.unit}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
