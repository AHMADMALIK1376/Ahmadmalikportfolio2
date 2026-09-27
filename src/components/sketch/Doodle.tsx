"use client";

import { motion } from "motion/react";

/**
 * Margin doodles that draw themselves, stroke by stroke, the first time they
 * scroll into view — as if someone were sketching in the notebook as you read.
 */

const DOODLES = {
  "arrow-curl": {
    box: "0 0 120 100",
    paths: [
      "M8 20c22-13 51-15 63 5 10 17-5 35-21 27-14-7-2-30 20-30 23 0 37 22 39 50",
      "M95 64c3 7 7 14 13 19 4-7 7-15 8-23",
    ],
  },
  "arrow-down": {
    box: "0 0 60 120",
    paths: ["M32 6c-9 20-14 42-8 64 4 14 8 24 7 40", "M16 92c5 7 10 14 15 21 5-8 11-14 17-20"],
  },
  star: {
    box: "0 0 60 60",
    paths: ["M30 5c2 9 4 17 6 25 8 1 15 2 21 4-7 4-13 8-19 13 2 5 4 8 6 11-8-3-11-6-15-9-5 3-9 6-15 9 2-6 4-11 7-16-6-3-12-6-18-9 8-2 15-3 21-4 2-8 4-16 6-24z"],
  },
  sparkle: {
    box: "0 0 50 50",
    paths: ["M25 4c1 8 2 14 5 18 4 3 9 3 16 3-7 1-12 2-16 5-3 4-4 10-5 17-1-7-2-13-5-17-4-3-9-4-16-5 7 0 12-1 16-3 3-4 4-10 5-18z"],
  },
  spiral: {
    box: "0 0 80 80",
    paths: ["M42 40c-3-4-9-1-8 4 1 7 11 7 14 1 4-8-3-17-12-17-12 0-19 12-16 23 4 13 21 17 32 10 13-8 15-27 5-38-11-12-31-12-43-1"],
  },
  squiggle: {
    box: "0 0 200 24",
    paths: ["M4 14c12-8 20-8 28 0s18 8 28 0 18-8 28 0 18 8 28 0 18-8 28 0 18 8 28 0 12-6 20-2"],
  },
  loop: {
    box: "0 0 140 70",
    paths: ["M6 52c26-6 48-16 58-30 7-10-6-18-12-8-8 14 16 30 44 28 16-1 28-7 36-16", "M120 18c5 2 10 4 15 7-3 5-6 9-8 14"],
  },
  underline: {
    box: "0 0 200 20",
    paths: ["M4 12c40-5 82-8 126-7 22 1 44 3 66 6", "M22 17c32-3 64-4 96-3"],
  },
  plane: {
    box: "0 0 120 90",
    paths: [
      "M8 44c34-13 69-26 104-38-11 25-23 50-36 74-8-9-17-18-26-26-14-3-28-6-42-10z",
      "M50 54c19-15 39-31 60-46M50 54c1 8 2 17 2 25 6-5 12-11 17-16",
    ],
  },
  heart: {
    box: "0 0 60 56",
    paths: ["M30 50C19 41 6 31 6 18 6 9 14 4 21 6c5 1 8 5 9 9 2-5 5-8 10-9 8-2 15 4 14 12-1 13-13 23-24 32z"],
  },
  bulb: {
    box: "0 0 60 80",
    paths: ["M22 56c-1-7-10-12-12-22-3-14 8-27 21-27 13 1 22 13 19 26-2 10-10 15-11 23-6 1-11 1-17 0z", "M22 64c5 1 11 1 17 0M24 71c4 1 9 1 13 0M30 20c-4 2-7 6-7 11"],
  },
} as const;

export type DoodleKind = keyof typeof DOODLES;

type SketchProps = {
  className?: string;
  delay?: number;
  /** seconds to draw each stroke */
  duration?: number;
  strokeWidth?: number;
  /** draw immediately rather than on scrolling into view */
  now?: boolean;
};

/** Any set of strokes, drawn one after another. */
export function Sketch({ box, paths, className, delay = 0, duration = 0.9, strokeWidth = 3, now = false }: SketchProps & { box: string; paths: readonly string[] }) {
  const trigger = now ? { animate: "drawn" } : { whileInView: "drawn", viewport: { once: true, amount: 0.5 } };

  return (
    <motion.svg
      viewBox={box}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      initial="blank"
      {...trigger}
    >
      {paths.map((d, i) => {
        const start = delay + i * duration * 0.8;
        return (
          <motion.path
            key={d}
            d={d}
            variants={{
              blank: { pathLength: 0, opacity: 0 },
              drawn: {
                pathLength: 1,
                opacity: 1,
                transition: {
                  pathLength: { delay: start, duration, ease: "easeInOut" },
                  opacity: { delay: start, duration: 0.01 },
                },
              },
            }}
          />
        );
      })}
    </motion.svg>
  );
}

export default function Doodle({ kind, ...props }: SketchProps & { kind: DoodleKind }) {
  return <Sketch box={DOODLES[kind].box} paths={DOODLES[kind].paths} {...props} />;
}
