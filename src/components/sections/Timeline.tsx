"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * The line down the left of the experience list, drawn in pencil as you
 * scroll: it reaches each role as that role reaches the middle of the screen.
 */
export default function Timeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 22, restDelta: 0.001 });

  return (
    <div ref={ref} className="relative">
      <svg aria-hidden="true" className="absolute left-[0.6rem] top-2 h-full w-4 overflow-visible md:left-[1.1rem]" preserveAspectRatio="none" viewBox="0 0 16 1000">
        <path d="M8 0c3 120-4 240 1 360s-5 250 0 380 3 180-1 260" fill="none" stroke="var(--color-concrete-300)" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <motion.path d="M8 0c3 120-4 240 1 360s-5 250 0 380 3 180-1 260" fill="none" stroke="var(--color-sienna-500)" strokeWidth="3.5" strokeLinecap="round" style={{ pathLength: drawn }} />
      </svg>
      {children}
    </div>
  );
}
