"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Every animation on the site steps aside for visitors who ask for reduced motion. */
export default function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
