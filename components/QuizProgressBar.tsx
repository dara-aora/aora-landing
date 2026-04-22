"use client";

/**
 * Thin hairline progress bar fixed to the top of the viewport during the
 * quiz flow. Green fill animates via CSS width transition.
 */
export function QuizProgressBar({
  current,
  total,
}: {
  current: number; // 0..total
  total: number;
}) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label="Assessment progress"
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: 2,
        backgroundColor: "var(--rule)",
      }}
    >
      <div
        className="h-full transition-[width] duration-300 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: "var(--green)",
          boxShadow: "0 0 6px rgba(143,174,90,0.6)",
        }}
      />
    </div>
  );
}
