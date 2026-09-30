"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { CATEGORIES, PROJECTS, type Category } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import { GitHub } from "@/components/sketch/Icons";
import ProjectModal from "./ProjectModal";
import styles from "./Ring.module.css";

/**
 * Stuff I've built: the projects stood in a ring that turns.
 *
 * The ring turns slowly on its own, and keeps turning under the pointer. A
 * sideways swipe on a trackpad (or shift and the wheel) spins it, easing into
 * the swipe and gliding on after it; it can be dragged round and flung; and the
 * keyboard brings each card it reaches to the front and holds it there while it
 * is being read. Scrolling up and down still scrolls the page. The card at the front is named underneath. Clicking a
 * card opens it, with its working drawing.
 */

const COUNT = PROJECTS.length;
const STEP = 360 / COUNT;
const AUTO = -7; // degrees a second, so the next card comes round from the right
const TILT = -7;
const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<Category | "all", string>;

/** Which card faces the viewer when the ring has turned by `angle`. */
const frontAt = (angle: number) => ((Math.round(-angle / STEP) % COUNT) + COUNT) % COUNT;
/** The turn that brings card `i` to the front, as near as can be to `angle`. */
const turnTo = (i: number, angle: number) => {
  const want = -i * STEP;
  return angle + ((((want - angle) % 360) + 540) % 360) - 180;
};

type Spin = {
  angle: number;
  speed: number;
  target: number | null;
  held: boolean;
  drag: null | { x: number; t: number; moved: number };
  /** turn still owed by a swipe, eased in over the next few frames */
  owed: number;
  /** when the last swipe arrived, and how fast it was turning the ring */
  swipedAt: number;
  swipeSpeed: number;
};
/** Degrees the ring turns for each pixel a swipe moves. */
const PER_PIXEL = 0.2;

export default function Projects() {
  const [front, setFront] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dragged = useRef(false);
  // the ring's motion, kept out of React: where it is, how fast it turns, where it is going, and whether it is held
  const spin = useRef<Spin>({ angle: 0, speed: AUTO, target: null, held: false, drag: null, owed: 0, swipedAt: 0, swipeSpeed: 0 });
  const isOpen = useRef(false);
  useEffect(() => {
    isOpen.current = open !== null;
  }, [open]);

  // the clock that turns the ring
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();
    let shown = -1;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = spin.current;
      const swiping = now - s.swipedAt < 140;
      if (s.drag) {
        // the pointer has it
      } else if (s.owed || swiping) {
        // a swipe has it: turn by what it owes, smoothly, and when it ends, glide on at its speed
        const step = s.owed * (1 - Math.exp(-dt * 14));
        s.angle += step;
        s.owed -= step;
        if (Math.abs(s.owed) < 0.01) s.owed = 0;
        s.speed = 0;
        if (!swiping && !s.owed) {
          s.speed = Math.max(-260, Math.min(260, s.swipeSpeed * 0.6));
          s.swipeSpeed = 0;
        }
      } else if (s.target !== null) {
        s.angle = reduce ? s.target : s.angle + (s.target - s.angle) * (1 - Math.exp(-dt * 9));
        if (Math.abs(s.target - s.angle) < 0.05) {
          s.angle = s.target;
          s.target = null;
          s.speed = 0;
        }
      } else {
        const want = s.held || isOpen.current || reduce ? 0 : AUTO;
        s.speed += (want - s.speed) * (1 - Math.exp(-dt * 2.5));
        s.angle += s.speed * dt;
      }
      if (ring.current) ring.current.style.transform = `rotateX(${TILT}deg) rotateY(${s.angle.toFixed(3)}deg)`;
      const facing = frontAt(s.angle);
      if (facing !== shown) {
        shown = facing;
        setFront(facing);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // a sideways swipe turns the ring; an up-and-down one is left to scroll the page. It is listened
  // for directly, not through React, so it can stop the browser treating the swipe as "go back"
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const s = spin.current;
      const pixels = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;
      const turn = -pixels * PER_PIXEL;
      const now = performance.now();
      const since = Math.max(16, now - (s.swipedAt || now - 16)) / 1000;
      s.swipeSpeed = s.swipeSpeed * 0.6 + (turn / since) * 0.4;
      s.owed += turn;
      s.swipedAt = now;
      s.target = null;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const bring = (i: number) => {
    spin.current.target = turnTo(i, spin.current.target ?? spin.current.angle);
  };

  // dragging the ring round, and flinging it
  const grab = (event: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    spin.current.drag = { x: event.clientX, t: performance.now(), moved: 0 };
    spin.current.target = null;
  };
  const pull = (event: PointerEvent<HTMLDivElement>) => {
    const s = spin.current;
    if (!s.drag) return;
    const dx = event.clientX - s.drag.x;
    const now = performance.now();
    s.angle += dx * 0.22;
    s.speed = (dx * 0.22) / Math.max(0.016, (now - s.drag.t) / 1000);
    s.drag = { x: event.clientX, t: now, moved: s.drag.moved + Math.abs(dx) };
    if (s.drag.moved > 6) {
      dragged.current = true;
      stage.current?.setAttribute("data-dragging", "");
    }
  };
  const letGo = () => {
    const s = spin.current;
    s.drag = null;
    s.speed = Math.max(-240, Math.min(240, s.speed));
    stage.current?.removeAttribute("data-dragging");
  };

  const show = (i: number, from: HTMLElement) => {
    if (dragged.current) return;
    opener.current = from;
    setDirection(1);
    setOpen(i);
  };
  const close = useCallback(() => setOpen(null), []);
  const stepOpen = useCallback((by: number) => {
    setDirection(by);
    setOpen((i) => (i === null ? i : (i + by + COUNT) % COUNT));
  }, []);

  const current = PROJECTS[front];

  return (
    <section id="work" aria-labelledby="work-title" className="gutter overflow-x-clip py-14 sm:py-20 lg:pb-10 lg:pt-14">
      {/* the heading; and on a laptop, beside it, the card at the front, named, so the ring fits one screen under them */}
      <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
        <SectionHeading number="03" kicker="selected work" id="work-title" tight intro="Drag the ring, swipe it, or let it turn, and open any card to watch it work.">
          Stuff I&apos;ve <Highlight mark="circle" ink="sienna">built</Highlight>.
        </SectionHeading>
        <div className="relative z-10 mb-3 hidden shrink-0 lg:block [&_button]:text-right">
          <button type="button" onClick={(e) => show(front, e.currentTarget)} className="group min-w-0 max-w-md rounded-2xl px-3 py-1 text-right">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-sienna-600">
            #{String(front + 1).padStart(2, "0")} · {LABEL[current.category]}
          </span>
          <span className="ink-wobble mt-0.5 block truncate text-base font-bold group-hover:underline group-hover:decoration-wavy group-hover:underline-offset-4 sm:text-lg">{current.title}</span>
          <span className="block truncate text-xs text-muted">{current.tagline}</span>
        </button>
        </div>
      </div>

      {/* the ring */}
      <div
        ref={stage}
        className={styles.stage}
        data-reveal=""
        style={{ "--reveal-i": 3 } as CSSProperties}
        onPointerLeave={letGo}
        onPointerDown={grab}
        onPointerMove={pull}
        onPointerUp={letGo}
        onPointerCancel={letGo}
        onFocus={(e) => {
          // only the keyboard holds the ring still; a click never does
          spin.current.held = e.target.matches(":focus-visible");
        }}
        onBlur={() => {
          spin.current.held = false;
        }}
      >
        <div ref={ring} className={styles.ring} style={{ "--quantity": COUNT } as CSSProperties}>
          {PROJECTS.map((project, i) => (
            <button
              key={project.slug}
              type="button"
              className={`${styles.card} ink-${project.ink}`}
              style={{ "--index": i } as CSSProperties}
              data-front={front === i ? "" : undefined}
              aria-label={`${project.title}: ${project.tagline}. Open`}
              onFocus={() => bring(i)}
              onClick={(e) => show(i, e.currentTarget)}
            >
              <span className={styles.face}>
                <span className={styles.top}>
                  <span className={styles.number}>#{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.kind}>{LABEL[project.category]}</span>
                </span>
                <span className={styles.title}>{project.title}</span>
                <span className={styles.tagline}>{project.tagline}</span>
                <span className={styles.point}>{project.points[0]}</span>
                <span className={styles.stack}>
                  {project.stack.slice(0, 3).map((tool) => (
                    <span key={tool} className={styles.chip}>
                      {tool}
                    </span>
                  ))}
                  {project.stack.length > 3 && <span className={styles.chip}>+{project.stack.length - 3}</span>}
                </span>
                <span className={styles.foot}>
                  <span className={styles.pill}>details +</span>
                  {project.repo && (
                    <span className={styles.code}>
                      <GitHub className="size-3" /> code
                    </span>
                  )}
                </span>
              </span>
              <span className={styles.back} aria-hidden="true">
                <span className={styles.mark}>
                  ahmad
                  <br />
                  .malik
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* the card at the front, named: under the ring, below a laptop's width */}
      <div className="relative z-10 mt-1 flex items-center justify-center lg:hidden">
        <button type="button" onClick={(e) => show(front, e.currentTarget)} className="group min-w-0 max-w-md rounded-2xl px-3 py-1 text-center">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-sienna-600">
            #{String(front + 1).padStart(2, "0")} · {LABEL[current.category]}
          </span>
          <span className="ink-wobble mt-0.5 block truncate text-base font-bold group-hover:underline group-hover:decoration-wavy group-hover:underline-offset-4 sm:text-lg">{current.title}</span>
          <span className="block truncate text-xs text-muted">{current.tagline}</span>
        </button>
      </div>

      <AnimatePresence onExitComplete={() => opener.current?.focus()}>
        {open !== null && <ProjectModal key="project" index={open} direction={direction} onClose={close} onStep={stepOpen} />}
      </AnimatePresence>
    </section>
  );
}
