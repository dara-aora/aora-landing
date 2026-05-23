"use client";

import { forwardRef } from "react";

/**
 * Full-width response button used for quiz questions and the
 * segmentation picker.
 *
 *   - 64px tall, left-aligned label.
 *   - 1px var(--rule) border at rest.
 *   - Hover / focus: border-color flips to var(--green), subtle bg tint.
 *   - Selected: border var(--green), bg var(--green-tint).
 *
 * Numeric point values are intentionally NOT displayed to the taker.
 */
type Props = {
  label: string;
  shortcut?: string; // digit shown on the far left (e.g. "1"..."5")
  selected?: boolean;
  onClick?: () => void;
};

export const QuizAnswerButton = forwardRef<HTMLButtonElement, Props>(
  function QuizAnswerButton({ label, shortcut, selected, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="group w-full min-h-[64px] py-3 flex items-center gap-4 px-5 md:px-6 text-left transition-colors duration-150 focus:outline-none"
        style={{
          border: `1px solid ${
            selected ? "var(--green)" : "var(--rule)"
          }`,
          backgroundColor: selected ? "var(--green-tint)" : "transparent",
          borderRadius: 4,
          color: "var(--paper)",
        }}
        onMouseEnter={(e) => {
          if (!selected) {
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--green)";
          }
        }}
        onMouseLeave={(e) => {
          if (!selected) {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--rule)";
          }
        }}
      >
        {shortcut ? (
          <span
            className="font-mono text-xs tracking-wider shrink-0"
            style={{ color: "var(--mute)", minWidth: 14 }}
            aria-hidden
          >
            {shortcut}
          </span>
        ) : null}

        <span
          className="flex-1 font-display font-light text-lg md:text-xl leading-[1.3]"
          style={{ color: "var(--paper)" }}
        >
          {label}
        </span>
      </button>
    );
  },
);
