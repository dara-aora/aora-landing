"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ImagePlaceholderProps {
  /** Image URL. Leave as null / undefined / "" to show the placeholder frame. */
  src?: string | null;
  /** Alt text for the image (used when src is provided). */
  alt?: string;
  /** Label shown inside the placeholder frame (e.g. "Worn behind the ear"). */
  label?: string;
  /** How the image should fill its container. */
  objectFit?: "cover" | "contain";
  /** Optional className for the wrapper. */
  className?: string;
  /** Optional inline style for the wrapper. */
  style?: React.CSSProperties;
  /** Whether the image should be draggable. */
  draggable?: boolean;
  /** If true, the placeholder gets a dashed border instead of a solid one. */
  dashed?: boolean;
}

/**
 * ImagePlaceholder — a reusable fill-in frame for images.
 *
 * When `src` is provided, it renders a normal <img>.
 * When `src` is missing, it renders a styled placeholder box
 * with a label so you know exactly what image belongs there.
 *
 * Usage:
 *   <ImagePlaceholder
 *     src="/my-photo.jpg"      // <-- swap this when you have the image
 *     alt="Product shot"
 *     label="Product on surface"
 *   />
 */
export function ImagePlaceholder({
  src,
  alt = "",
  label = "Image placeholder",
  objectFit = "cover",
  className = "",
  style,
  draggable = false,
  dashed = true,
}: ImagePlaceholderProps) {
  const reduced = useReducedMotion();

  const hasImage = Boolean(src);

  return (
    <div
      className={`relative overflow-hidden w-full h-full ${className}`}
      style={style}
    >
      {hasImage ? (
        <motion.img
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          src={src!}
          alt={alt || label}
          className="w-full h-full"
          style={{ objectFit }}
          draggable={draggable}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{
            backgroundColor: "var(--ink-raised)",
            border: dashed
              ? "2px dashed var(--rule)"
              : "2px solid var(--rule)",
          }}
        >
          {/* Corner brackets — visual "frame" cue */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ opacity: 0.35 }}
          >
            {/* top-left */}
            <path
              d="M4 16 L4 4 L16 4"
              stroke="var(--mute)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* top-right */}
            <path
              d="M32 4 L44 4 L44 16"
              stroke="var(--mute)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* bottom-left */}
            <path
              d="M4 32 L4 44 L16 44"
              stroke="var(--mute)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* bottom-right */}
            <path
              d="M32 44 L44 44 L44 32"
              stroke="var(--mute)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <span
            className="font-mono text-xs tracking-wider uppercase text-center px-4"
            style={{ color: "var(--mute)" }}
          >
            {label}
          </span>

          <span
            className="font-mono text-[10px] tracking-wider"
            style={{ color: "var(--mute)", opacity: 0.5 }}
          >
            Fill in image
          </span>
        </div>
      )}
    </div>
  );
}
