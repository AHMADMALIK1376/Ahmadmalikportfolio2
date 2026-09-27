"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Something laid onto the page as it scrolls into view: it rises into place
 * and, if asked, settles from a slight tilt, like a card dropped on a desk.
 */

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** how far below its place it starts, in pixels */
  y?: number;
  /** the tilt it settles from, in degrees */
  tilt?: number;
  /** the tilt it settles to, in degrees */
  rest?: number;
};

export default function Reveal({ children, className, delay = 0, y = 28, tilt = 0, rest = 0 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: rest }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay, type: "spring", stiffness: 140, damping: 18, mass: 0.9 }}
    >
      {children}
    </motion.div>
  );
}
