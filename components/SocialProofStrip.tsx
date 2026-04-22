"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SmallCaps } from "./SmallCaps";

// TODO: replace string labels with real SVG logos when assets land.
const outlets = ["Sisters Founders", "Founders Inc", "The Residency"];

export function SocialProofStrip() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative py-20 md:py-28 px-6 md:px-10 snap-section flex items-center"
      style={{ backgroundColor: "var(--ink)" }}
      aria-label="Coverage"
    >
      <div className="max-w-content mx-auto w-full">
        <div className="text-center mb-10 md:mb-14">
          <SmallCaps>As covered in</SmallCaps>
        </div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16"
        >
          {outlets.map((name) => (
            <motion.li
              key={name}
              variants={{
                hidden: reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
              }}
              className="font-display text-xl md:text-2xl font-light tracking-tight transition-colors duration-200 cursor-default"
              style={{ color: "var(--mute)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--paper)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--mute)")
              }
            >
              {name}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
