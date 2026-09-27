"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { onTop, onFront, type Point } from "@/components/desk/iso";
import styles from "./Rigs.module.css";

/**
 * What every What-I-do drawing shares: it builds itself when it opens, as the
 * hero's desk does, and then runs on its own clock while it can be seen.
 */

const BUILD = 3000;

/** Runs --p on `svg` from 0 to 1 over the build, and says when it has finished. With reduced motion it is built at once. */
export function useBuild(svg: RefObject<SVGSVGElement | null>) {
  const [built, setBuilt] = useState(false);
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : BUILD;
    const start = performance.now() + (length ? 250 : 0);
    let frame = 0;
    const tick = (now: number) => {
      const p = length ? Math.min(1, Math.max(0, (now - start) / length)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setBuilt(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [svg]);
  return built;
}

/**
 * Calls `tick` with the milliseconds it has been running, every frame, from
 * when `on` becomes true — but only while `target` is on screen, and never
 * with reduced motion. The time carries on from where it paused.
 */
export function useClock(on: boolean, target: RefObject<Element | null>, tick: (ms: number) => void) {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });
  useEffect(() => {
    const el = target.current;
    if (!on || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let elapsed = 0;
    let last = 0;
    const loop = (now: number) => {
      elapsed += last ? Math.min(250, now - last) : 0;
      last = now;
      latest.current(elapsed);
      frame = requestAnimationFrame(loop);
    };
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      last = 0;
      if (entry.isIntersecting) frame = requestAnimationFrame(loop);
    });
    watch.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
    };
  }, [on, target]);
}

/** Marks an element lit, or not; the drawing's CSS decides what lit looks like. */
export const light = (el: Element | null | undefined, on: boolean | string) => {
  if (!el) return;
  if (on === false) el.removeAttribute("data-lit");
  else el.setAttribute("data-lit", on === true ? "" : on);
};

/** A point along a path, `u` of the way from its start to its end. */
export const along = (path: SVGPathElement | null, u: number): Point => {
  if (!path) return [0, 0];
  const length = path.getTotalLength();
  const p = path.getPointAtLength(Math.min(1, Math.max(0, u)) * length);
  return [p.x, p.y];
};

export const place = (el: SVGElement | null, [x, y]: Point) => el?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

/** A name, printed flat on a top face. */
export function TopTag({ origin, text, size = 7, className }: { origin: Point; text: string; size?: number; className?: string }) {
  return (
    <text transform={onTop(origin)} y={size * 0.35} textAnchor="middle" fontSize={size} fontWeight={700} fill="#2d2f2b" className={`${styles.tag} ${className ?? ""}`}>
      {text}
    </text>
  );
}

/** A name, printed on a face turned towards the viewer. */
export function FrontTag({ origin, text, size = 7, anchor = "start", fill = "#2d2f2b" }: { origin: Point; text: string; size?: number; anchor?: "start" | "middle" | "end"; fill?: string }) {
  return (
    <text transform={onFront(origin)} y={size * 0.35} textAnchor={anchor} fontSize={size} fontWeight={700} fill={fill} className={styles.tag}>
      {text}
    </text>
  );
}

/** A small moving thing: a dot with a soft halo, placed by the clock. */
export function Packet({ ref, colour, r = 4 }: { ref: (el: SVGGElement | null) => void; colour: string; r?: number }) {
  return (
    <g ref={ref} className={styles.packet} transform="translate(-999 -999)">
      <circle r={r * 2} fill={colour} opacity={0.25} />
      <circle r={r} fill={colour} stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
    </g>
  );
}
