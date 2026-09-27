"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { CATEGORIES, PROJECTS, type Category } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import { Sketch } from "@/components/sketch/Doodle";
import { DRAWINGS } from "./drawings";
import ProjectModal from "./ProjectModal";
import styles from "./Ring.module.css";

/**
 * Stuff I've built: the projects stood in a ring that turns.
 *
 * The ring turns slowly on its own, and keeps turning under the pointer. It can
 * be dragged round and flung, or turned by the keyboard, which brings each card
 * it reaches to the front and holds it there while it is being read. The card at the front is named underneath. Clicking a
 * card opens it, with its working drawing.
 */

const COUNT = PROJECTS.length;
const STEP = 360 / COUNT;
const AUTO = -7; // degrees a second, so the next card comes round from the right
const TILT = -10;
const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<Category | "all", string>;
const ICON = { ai: DRAWINGS.llm, fullstack: DRAWINGS.web, tools: DRAWINGS.frontend } as const;

/** Which card faces the viewer when the ring has turned by `angle`. */
const frontAt = (angle: number) => ((Math.round(-angle / STEP) % COUNT) + COUNT) % COUNT;
/** The turn that brings card `i` to the front, as near as can be to `angle`. */
const turnTo = (i: number, angle: number) => {
  const want = -i * STEP;
  return angle + ((((want - angle) % 360) + 540) % 360) - 180;
};

type Spin = { angle: number; speed: number; target: number | null; held: boolean; drag: null | { x: number; t: number; moved: number } };

export default function Projects() {
  const [front, setFront] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dragged = useRef(false);
  // the ring's motion, kept out of React: where it is, how fast it turns, where it is going, and whether it is held
  const spin = useRef<Spin>({ angle: 0, speed: AUTO, target: null, held: false, drag: null });
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
      if (s.drag) {
        // the pointer has it
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
    <section id="work" aria-labelledby="work-title" className="gutter py-14 sm:py-20 md:pb-24 md:pt-16">
      <SectionHeading number="03" kicker="selected work" id="work-title" intro="Things I've designed, built and shipped. Drag the ring round or let it turn, and open any card to watch it work.">
        Stuff I&apos;ve <Highlight mark="circle" ink="sienna">built</Highlight>.
      </SectionHeading>

      {/* the ring */}
      <div
        ref={stage}
        className={styles.stage}
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
                <span>
                  <span className={styles.top}>
                    <span className={styles.number}>#{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.kind}>{LABEL[project.category]}</span>
                  </span>
                  <Sketch box="0 0 120 90" paths={ICON[project.category]} className={styles.icon} strokeWidth={4} duration={0.4} />
                  <span className={styles.title}>{project.title}</span>
                  <span className={styles.tagline}>{project.tagline}</span>
                </span>
                <span className={styles.bottom}>
                  <span className={styles.chip}>{project.stack[0]}</span>
                  <span className={styles.open}>open ↗</span>
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

      {/* the card at the front, named */}
      <div className="relative z-10 mt-1 flex items-center justify-center">
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
