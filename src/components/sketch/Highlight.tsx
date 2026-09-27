"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { Ink } from "@/lib/content";

/**
 * A word marked up by hand: swiped with a highlighter, underlined, or circled.
 * The mark is made when the word first scrolls into view.
 */

type Props = {
  children: ReactNode;
  ink?: Ink;
  mark?: "marker" | "underline" | "circle";
  delay?: number;
  /** make the mark now, not on scrolling into view (for the first screen) */
  now?: boolean;
};

export default function Highlight({ children, ink = "sage", mark = "marker", delay = 0.25, now = false }: Props) {
  const trigger = now ? { animate: "on" } : { whileInView: "on", viewport: { once: true, amount: 0.8 } };

  return (
    <motion.span className={`ink-${ink} relative isolate inline-block whitespace-nowrap`} initial="off" {...trigger}>
      {mark === "marker" && (
        <motion.span
          aria-hidden="true"
          className="ink-wobble absolute -inset-x-[0.12em] bottom-[0.02em] -z-10 h-[0.58em] origin-left -skew-x-6 rounded-[0.3em_0.5em_0.25em_0.6em] bg-(--ink-hl)"
          variants={{ off: { scaleX: 0 }, on: { scaleX: 1, transition: { delay, duration: 0.55, ease: [0.65, 0, 0.35, 1] } } }}
        />
      )}
      {mark === "underline" && (
        <svg aria-hidden="true" viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-[0.28em] left-0 h-[0.4em] w-full overflow-visible text-(--ink-accent)">
          <motion.path
            d="M4 12c40-5 82-8 126-7 22 1 44 3 66 6"
            fill="none"
            stroke="currentColor"
            strokeWidth={5}
            strokeLinecap="round"
            variants={{ off: { pathLength: 0, opacity: 0 }, on: { pathLength: 1, opacity: 1, transition: { delay, duration: 0.6, ease: "easeInOut" } } }}
          />
        </svg>
      )}
      {mark === "circle" && (
        <svg aria-hidden="true" viewBox="0 0 200 70" preserveAspectRatio="none" className="absolute -inset-x-[0.35em] -inset-y-[0.3em] -z-10 h-[calc(100%+0.6em)] w-[calc(100%+0.7em)] overflow-visible text-(--ink-accent)">
          <motion.path
            d="M112 6C62 2 12 12 6 34c-6 22 46 32 98 31 52-1 92-12 90-32-2-19-44-29-96-27-18 1-34 3-46 7"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            variants={{ off: { pathLength: 0, opacity: 0 }, on: { pathLength: 1, opacity: 1, transition: { delay, duration: 0.8, ease: "easeInOut" } } }}
          />
        </svg>
      )}
      {children}
    </motion.span>
  );
}
