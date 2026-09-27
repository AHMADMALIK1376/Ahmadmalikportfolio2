"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** A number that counts up from zero the first time it is seen. */
export default function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.8 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    // wound back to zero once the page is live, so it has somewhere to count from
    if (!seen) {
      el.textContent = `0${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        el.textContent = `${Math.round(value)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [seen, to, suffix, reduce]);

  // the real number is there from the start, for anyone who never scrolls to it
  return (
    <span ref={ref} className="tabular-nums">
      {to}
      {suffix}
    </span>
  );
}
