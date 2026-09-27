"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { at, between, Block, COS, Detail, drawn, frontFace, line, onFront, onTop, Part, poly, rounded, sideFace, topFace, TONES, type Point, type Tone } from "@/components/desk/iso";
import deskStyles from "@/components/desk/Desk.module.css";
import styles from "./Factory.module.css";

/**
 * The hero's factory, where ideas go in and apps come out: a conveyor belt
 * through three machines, drawn the way the site's cards and buttons are —
 * soft blocks in paper and pastel, a wobbling edge and a hard shadow.
 *
 * Sticky-note ideas (named after Ahmad's projects) drop out of the IDEAS
 * hopper onto the belt. DESIGN turns each into a wireframe, BUILD into a laptop
 * running the app, and SHIP boxes it; the boxes drop off the end of the belt
 * into a little truck, which drives off when it is full and comes back empty.
 * Each machine works while something is inside it: the pencil scribbles, the
 * press comes down, the label flutters. Clicking the factory drops in an idea.
 *
 * It is drawn in layers, one SVG over another in the same view box, stacked in
 * the order they are painted, so a thing on the belt really goes into a machine
 * and comes out of the other side. Everything that moves is moved by its CSS
 * translate, so its wobbling edges are never redrawn.
 */

// ── the view, and moving within it ──────────────────────────────────────
const VB = { x: 80, y: 120, w: 660, h: 500 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
/** A shift on screen, in view box units, as a CSS translate of a layer the size of the view. */
const shift = (dx: number, dy: number) => `${((dx / VB.w) * 100).toFixed(3)}% ${((dy / VB.h) * 100).toFixed(3)}%`;
/** The shift on screen of a move `dx` along the belt and `dz` up. */
const along = (dx: number, dz = 0) => shift(COS * dx, dx / 2 - dz);

// ── the line, in the scene's own units: x along the belt, y across it, z up ──
const BELT = { x0: -266, x1: 266, half: 26, z: 34 };
const FRAME = { half: 30, h: 30 };
/** Where the ideas drop onto the belt, and from how high. */
const SPAWN_X = -236;
const FALL_FROM = 64;
/** The machines, in order along the belt, each a block the belt runs through. */
const MACHINES = [
  { key: "design", label: "DESIGN", x0: -166, x1: -108, h: 84, tone: { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" } },
  { key: "build", label: "BUILD", x0: -44, x1: 14, h: 88, tone: { top: "#f5dfd5", left: "#ecc9b9", right: "#e2b5a1" } },
  { key: "ship", label: "SHIP", x0: 76, x1: 134, h: 80, tone: TONES.paper },
] as const;
/** How far each machine reaches either side of the belt: no deeper than it must be, so it hides as little of the belt behind it as it can. */
const MACHINE_HALF = 32;
/** The truck, and the three places in its bed. */
const TRUCK = { x0: 272, x1: 342, cab: 382, half: 32, floor: 16 };
const SLOTS = [284, 306, 328];

const BELT_TONE: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
const KRAFT: Tone = { top: "#ecbea9", left: "#e2b5a1", right: "#de9372" };
const CAB: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const LAPTOP: Tone = { top: "#e6e8e3", left: "#d3d6d0", right: "#b9bdb6" };
const NOTES = ["#e2e9da", "#f5dfd5", "#fafaf7"];
const IDEAS = ["FOLIUM", "GRAPHFORGE", "NEURACACHE", "HIREME", "FOCUSFLOW", "BUGISTAN", "BID ENGINE", "ROUTINE"];

// ── the timing ──────────────────────────────────────────────────────────
const INTRO = 3200;
const DELAY = 450;
const SPEED = 44; // along the belt, units a second
const SPAWN_EVERY = 1900;
const FALL = 420;
const DROP = 520;
const SLAT = 16;
const POOL = 10;

/** The top of the belt, as a window in percent of the view: the slats are seen through it. */
const BELT_CLIP = `polygon(${topFace(BELT.x0, BELT.x1, -BELT.half, BELT.half, BELT.z)
  .map(([x, y]) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`)
  .join(", ")})`;
/** Where a machine's moving part turns about, in percent of the view. */
const pivot = ([x, y]: Point) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`;

/** What is on the belt, and where it is. */
type Item = { on: boolean; x: number; dz: number; stage: number; state: "fall" | "belt" | "drop"; t: number; slot: number; gap: number };

/** A flat rectangle at height z, turned by `angle`: a note lying on the belt at an angle. */
function quad(cx: number, cy: number, hw: number, hd: number, angle: number, z: number): Point[] {
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([x, y]) => at(cx + x * c - y * s, cy + x * s + y * c, z));
}

/** A layer: one SVG the size of the view, stacked at `z`. */
function Layer({ z, className, style, children, layerRef }: { z: number; className?: string; style?: CSSProperties; children: ReactNode; layerRef?: (el: SVGSVGElement | null) => void }) {
  return (
    <svg ref={layerRef} viewBox={VIEW} className={`${styles.layer} ${className ?? ""}`} style={{ zIndex: z, ...style }} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** The four things an idea is on its way along the line, drawn where the belt starts: all there, one shown at a time. */
function Things({ index }: { index: number }) {
  const z = BELT.z;
  const note = NOTES[index % NOTES.length];
  const angle = ((index % 3) - 1) * 0.22;
  const [ox, oy] = at(0, 0, z);
  const bigger = `translate(${ox} ${oy}) scale(1.25) translate(${-ox} ${-oy})`;
  return (
    <g>
      {/* an idea, on a sticky note */}
      <g data-stage="0" transform={bigger}>
        <g filter="url(#desk-chip)">
          <path d={rounded(quad(0, 0, 13, 13, angle, z + 1), 2.5)} fill={note} stroke="rgba(45,47,43,0.55)" strokeWidth={1.1} />
        </g>
        <g transform={`${onTop(at(0, 0, z + 1))} rotate(${((angle * 180) / Math.PI).toFixed(1)})`} fill="none" stroke="#5e625c" strokeWidth={0.8} strokeLinecap="round">
          <path d="M-9 1.5c3-1.4 6 1.4 9 0s5-1.2 8 0.3M-9 5.5c2.5-1.2 5 1.2 8 0" />
          <text data-label="" x={-10} y={-4} fontSize={4.2} fontWeight={700} fill="#2d2f2b" stroke="none" textLength={20} lengthAdjust="spacingAndGlyphs">
            IDEA
          </text>
        </g>
      </g>
      {/* a wireframe of it */}
      <g data-stage="1" visibility="hidden" transform={bigger}>
        <g filter="url(#desk-chip)">
          <Block x0={-16} x1={16} y0={-12} y1={12} z={z} h={2} tone={TONES.paper} r={3} width={1.1} />
        </g>
        <g transform={onTop(at(-16, -12, z + 2))} fill="none" stroke="#5e625c" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x={2.5} y={2.5} width={27} height={4} rx={1} fill="#cbd7bd" />
          <rect x={2.5} y={9} width={12} height={12} rx={1} />
          <path d="M2.5 9 14.5 21M14.5 9 2.5 21" strokeWidth={0.5} />
          <rect x={17} y={9} width={12.5} height={5} rx={1} fill="#f5dfd5" />
          <path d="M17 17.5H29.5M17 20.5H25" />
        </g>
      </g>
      {/* the app, running on a laptop */}
      <g data-stage="2" visibility="hidden" transform={bigger}>
        <g filter="url(#desk-chip)">
          <Block x0={-16} x1={16} y0={-10} y1={12} z={z} h={3} tone={LAPTOP} r={3} width={1.1} />
          <Block x0={-16} x1={16} y0={-13} y1={-10} z={z + 3} h={24} tone={TONES.dark} r={2.5} width={1.1} />
        </g>
        <path d={rounded(topFace(-12, 12, -6, 8, z + 3), 2)} fill="#d3d6d0" />
        <g transform={onFront(at(-14, -10, z + 25))}>
          <rect x={0} y={0} width={28} height={19.5} rx={1.5} fill="#f4f4f0" />
          <rect x={0} y={0} width={28} height={4} rx={1.5} fill="#9caf88" />
          <path d="M3 8H22M3 11H18" stroke="#9a9f98" strokeWidth={1} strokeLinecap="round" />
          <rect x={3} y={14} width={8} height={3.4} rx={1.2} fill="#d0714c" />
          <rect x={14} y={7} width={11} height={10} rx={1} fill="#e2e9da" />
        </g>
      </g>
      {/* and boxed, for the truck */}
      <g data-stage="3" visibility="hidden">
        <g filter="url(#desk-chip)">
          <Block x0={-10} x1={10} y0={-11} y1={11} z={z} h={18} tone={KRAFT} r={2.5} width={1.1} />
        </g>
        <path d={poly(...topFace(-10, 10, -2.4, 2.4, z + 18))} fill="#d0714c" fillOpacity={0.75} />
        <path d={rounded(frontFace(-8, 7, z + 5, z + 12.5, 11), 1.5)} fill="#fafaf7" stroke="rgba(45,47,43,0.4)" strokeWidth={0.6} />
        <text data-label="" transform={onFront(at(-7, 11, z + 7.4))} fontSize={3.8} fontWeight={700} fill="#2d2f2b" textLength={13} lengthAdjust="spacingAndGlyphs">
          IDEA
        </text>
      </g>
    </g>
  );
}

export default function Factory({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const items = useRef<(SVGSVGElement | null)[]>([]);
  const works = useRef<(SVGSVGElement | null)[]>([]);
  const tools = useRef<(SVGSVGElement | null)[]>([]);
  const truck = useRef<(SVGSVGElement | null)[]>([]);
  const cargo = useRef<(SVGGElement | null)[]>([]);
  /** set while running: drops a new idea into the hopper */
  const drop = useRef<() => void>(() => {});

  // the opening: --p runs from 0 to 1, and every part works out from it where it is
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : INTRO;
    let start = -1;
    let frame = 0;
    const tick = (now: number) => {
      if (start < 0) start = now + (length ? DELAY : 0);
      const p = length ? Math.min(1, Math.max(0, (now - start) / length)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setBuilt(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // the line, running
  useEffect(() => {
    if (!built) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state: Item[] = Array.from({ length: POOL }, () => ({ on: false, x: 0, dz: 0, stage: 0, state: "belt", t: 0, slot: 0, gap: 0 }));
    let spawned = 0;
    let loaded = 0;
    let reserved = 0;
    // the truck: here, leaving, or coming back; `away` is how far it has driven off
    const lorry = { state: "here" as "here" | "leaving" | "arriving", t: 0, away: 0 };

    const look = (i: number, next: number) => {
      const svg = items.current[i];
      if (!svg) return;
      svg.querySelectorAll<SVGGElement>("[data-stage]").forEach((g) => g.setAttribute("visibility", g.dataset.stage === String(next) ? "visible" : "hidden"));
      state[i].stage = next;
    };
    /** Which layer a thing on the belt belongs in: before the first machine it has come out of, and so on. */
    const gapOf = (x: number) => MACHINES.filter((m) => x >= m.x1).length;
    const LAYER_FOR_GAP = [3, 7, 10, 14];
    const place = (i: number) => {
      const svg = items.current[i];
      const it = state[i];
      if (!svg) return;
      svg.style.translate = along(it.x, it.dz);
      const gap = it.state === "drop" ? 3 : gapOf(it.x);
      if (gap !== it.gap) {
        it.gap = gap;
        svg.style.zIndex = String(LAYER_FOR_GAP[gap]);
      }
    };
    const showCargo = (n: number) => cargo.current.forEach((g, k) => g?.setAttribute("visibility", k < n ? "visible" : "hidden"));
    const moveTruck = (away: number, opacity: number) => {
      for (const svg of truck.current) {
        if (!svg) continue;
        svg.style.translate = along(away);
        svg.style.opacity = String(opacity);
      }
    };

    const spawn = () => {
      const i = state.findIndex((it) => !it.on);
      if (i < 0) return false;
      // room under the hopper
      if (state.some((it) => it.on && it.state !== "drop" && it.x < SPAWN_X + 34)) return false;
      const it = state[i];
      Object.assign(it, { on: true, x: SPAWN_X, dz: FALL_FROM, state: "fall", t: 0, gap: -1 });
      const name = IDEAS[spawned++ % IDEAS.length];
      items.current[i]?.querySelectorAll("[data-label]").forEach((text) => (text.textContent = name));
      look(i, 0);
      place(i);
      items.current[i]?.setAttribute("data-on", "");
      return true;
    };

    // with reduced motion: one of each thing along the belt, standing still, and a truck with two boxes in
    if (reduced) {
      [-236, -60, 70, 200].forEach((x, i) => {
        Object.assign(state[i], { on: true, x, dz: 0, state: "belt", gap: -1 });
        items.current[i]?.querySelectorAll("[data-label]").forEach((text) => (text.textContent = IDEAS[i]));
        look(i, i);
        place(i);
        items.current[i]?.setAttribute("data-on", "");
      });
      showCargo(2);
      return;
    }

    let working = MACHINES.map(() => false);
    let clock = SPAWN_EVERY - 600;
    drop.current = () => {
      if (spawn()) clock = 0;
    };

    const step = (dt: number) => {
      clock += dt;
      if (clock >= SPAWN_EVERY && spawn()) clock = 0;

      state.forEach((it, i) => {
        if (!it.on) return;
        it.t += dt;
        if (it.state === "fall") {
          const k = Math.min(1, it.t / FALL);
          it.dz = FALL_FROM * (1 - k * k);
          if (k >= 1) Object.assign(it, { state: "belt", dz: 0, t: 0 });
        } else if (it.state === "belt") {
          it.x += (SPEED * dt) / 1000;
          // each machine turns it into the next thing halfway through
          MACHINES.forEach((m, n) => {
            if (it.stage === n && it.x >= (m.x0 + m.x1) / 2) look(i, n + 1);
          });
          // off the end of the belt, into the truck
          if (it.x >= BELT.x1 - 2) {
            const room = lorry.state === "here" && reserved < SLOTS.length;
            Object.assign(it, { state: "drop", t: 0, slot: room ? reserved++ : -1 });
          }
        } else {
          const k = Math.min(1, it.t / DROP);
          const target = it.slot >= 0 ? SLOTS[it.slot] : BELT.x1 + 40;
          it.x = BELT.x1 - 2 + (target - BELT.x1 + 2) * k;
          it.dz = (TRUCK.floor + 1 - BELT.z) * k + 12 * Math.sin(Math.PI * k);
          if (it.slot < 0 && items.current[i]) items.current[i]!.style.opacity = String(1 - k);
          if (k >= 1) {
            it.on = false;
            items.current[i]?.removeAttribute("data-on");
            if (items.current[i]) items.current[i]!.style.opacity = "";
            if (it.slot >= 0) {
              loaded++;
              showCargo(loaded);
              if (loaded === SLOTS.length) Object.assign(lorry, { state: "leaving", t: -500 });
            }
          }
        }
        place(i);
      });

      // a machine works while something is inside it
      const now = MACHINES.map((m) => state.some((it) => it.on && it.state === "belt" && it.x > m.x0 && it.x < m.x1));
      now.forEach((on, n) => {
        if (on !== working[n]) {
          works.current[n]?.toggleAttribute("data-working", on);
          tools.current[n]?.toggleAttribute("data-working", on);
        }
      });
      working = now;

      // the truck, full, drives off down the road and comes back empty
      if (lorry.state !== "here") {
        lorry.t += dt;
        if (lorry.state === "leaving" && lorry.t > 0) {
          const k = Math.min(1, lorry.t / 1500);
          moveTruck(260 * k * k, 1 - Math.max(0, (k - 0.6) / 0.4));
          if (k >= 1) {
            loaded = 0;
            reserved = 0;
            showCargo(0);
            Object.assign(lorry, { state: "arriving", t: 0 });
          }
        } else if (lorry.state === "arriving") {
          const k = Math.min(1, lorry.t / 900);
          moveTruck(-70 * (1 - k) * (1 - k), k);
          if (k >= 1) {
            moveTruck(0, 1);
            Object.assign(lorry, { state: "here", t: 0 });
          }
        }
      }
    };

    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(60, now - last) : 16;
      last = now;
      step(dt);
      frame = requestAnimationFrame(tick);
    };
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    if (stage.current) watch.observe(stage.current);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      drop.current = () => {};
    };
  }, [built]);

  const slatShift = { "--slat-to": along(SLAT), "--slat-time": `${SLAT / SPEED}s` } as CSSProperties;

  return (
    <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""} ${className ?? ""}`} onClick={() => drop.current()} aria-hidden="true">
      {/* ── the line: its frame and belt, the hopper's post ── */}
      <svg viewBox={VIEW} className={styles.base} style={{ zIndex: 1 }} focusable="false">
        <g style={drawn(0.02, 0.12)} filter="url(#desk-card)">
          <Block x0={BELT.x0} x1={BELT.x1} y0={-FRAME.half} y1={FRAME.half} z={0} h={FRAME.h} tone={TONES.concrete} r={10} />
        </g>
        <g style={drawn(0.08, 0.16)} filter="url(#desk-ink)">
          <Block x0={BELT.x0} x1={BELT.x1} y0={-BELT.half} y1={BELT.half} z={FRAME.h} h={BELT.z - FRAME.h} tone={BELT_TONE} r={7} width={1.2} />
        </g>
        {/* rivets along the frame */}
        <g style={drawn(0.14, 0.18, 0.05)}>
          {Array.from({ length: 12 }, (_, i) => (
            <Detail key={i} d={rounded(frontFace(BELT.x0 + 26 + i * 44, BELT.x0 + 30 + i * 44, 12, 16, FRAME.half), 2)} fill="#9a9f98" width={0.8} />
          ))}
        </g>
        <g style={drawn(0.16, 0.22)} filter="url(#desk-chip)">
          <Block x0={-240} x1={-232} y0={-34} y1={-26} z={0} h={100} tone={TONES.concrete} r={3} width={1.1} />
        </g>
      </svg>

      {/* the belt's slats: a layer slid along under a window the shape of the belt, so nothing is redrawn as it runs */}
      <div className={styles.window} style={{ clipPath: BELT_CLIP, zIndex: 2 }}>
        <Layer z={2} className={`${styles.slats} ${deskStyles.fade}`} style={{ ...slatShift, ...between(0.2, 0.06) }}>
          <g stroke="#7c817a" strokeWidth={1.4} strokeLinecap="round">
            {Array.from({ length: Math.ceil((BELT.x1 - BELT.x0) / SLAT) + 2 }, (_, i) => {
              const x = BELT.x0 - SLAT + i * SLAT;
              return <path key={i} d={line(at(x, -BELT.half, BELT.z), at(x, BELT.half, BELT.z))} />;
            })}
          </g>
        </Layer>
      </div>

      {/* ── what is on the belt: each thing in a layer of its own, stacked between the machines as it goes ── */}
      {Array.from({ length: POOL }, (_, i) => (
        <Layer
          key={i}
          z={3}
          className={`${styles.item} ${styles.moving}`}
          layerRef={(el) => {
            items.current[i] = el;
          }}
        >
          <Things index={i} />
        </Layer>
      ))}

      {/* ── the hopper the ideas drop out of ── */}
      <Layer z={4}>
        <Part arrival={{ lift: 40, from: 0.2, span: 0.1 }} style={drawn(0.18, 0.26)}>
          <g filter="url(#desk-card)">
            <Block x0={-262} x1={-208} y0={-30} y1={30} z={96} h={30} tone={TONES.paper} r={8} />
          </g>
          {/* ideas waiting in it */}
          <g filter="url(#desk-chip)">
            <path d={rounded(quad(-246, -12, 10, 10, 0.4, 128), 2)} fill="#f5dfd5" stroke="rgba(45,47,43,0.55)" />
            <path d={rounded(quad(-226, -4, 10, 10, -0.3, 131), 2)} fill="#e2e9da" stroke="rgba(45,47,43,0.55)" />
          </g>
          <text transform={onFront(at(-254, 30, 116))} y={2} fontSize={9.5} fontWeight={700} letterSpacing={1.2} fill="#3b3d39">
            IDEAS
          </text>
          {/* a light bulb, drawn on it */}
          <g transform={onFront(at(-222, 30, 121))} fill="none" stroke="#bc4e26" strokeWidth={1.2} strokeLinecap="round">
            <path d="M3 9c-2-1.5-3-3.2-3-5a4 4 0 0 1 8 0c0 1.8-1 3.5-3 5ZM3 11h2M3.3 12.6h1.4" />
          </g>
        </Part>
      </Layer>

      {/* ── the three machines, each with its moving parts in a layer just over it ── */}
      {MACHINES.map((m, n) => {
        const z = [5, 8, 11][n];
        const start = 0.26 + n * 0.08;
        const face = MACHINE_HALF;
        return [
          <Layer key={m.key} z={z}>
            <Part arrival={{ lift: 60, from: start, span: 0.12 }} style={drawn(start - 0.02, start + 0.08)}>
              <g filter="url(#desk-card)">
                <Block x0={m.x0} x1={m.x1} y0={-face} y1={face} z={0} h={m.h} tone={m.tone} r={14} />
              </g>
              {/* where the belt comes out, with a curtain of strips */}
              <Detail d={rounded(sideFace(m.x1, -BELT.half - 2, BELT.half + 2, BELT.z - 2, BELT.z + 34), 6)} fill="#3b3d39" />
              {Array.from({ length: 5 }, (_, k) => (
                <Detail key={k} d={line(at(m.x1, -BELT.half + 6 + k * 10, BELT.z + 32), at(m.x1, -BELT.half + 6 + k * 10, BELT.z + 14))} stroke="#7c817a" width={2.4} />
              ))}
              {/* its name on the front */}
              <Detail d={rounded(frontFace(m.x0 + 6, m.x1 - 6, m.h - 30, m.h - 12, face), 5)} fill="#fafaf7" />
              <text transform={onFront(at(m.x0 + 10, face, m.h - 17))} fontSize={9.5} fontWeight={700} letterSpacing={0.8} fill="#2d2f2b">
                {m.label}
              </text>
              {/* vents */}
              {Array.from({ length: 3 }, (_, k) => (
                <Detail key={k} d={line(at(m.x0 + 10, face, 20 + k * 8), at(m.x0 + 30, face, 20 + k * 8))} width={1.3} />
              ))}
            </Part>
          </Layer>,
          <Layer
            key={`${m.key}-work`}
            z={z + 1}
            className={styles.moving}
            layerRef={(el) => {
              works.current[n] = el;
            }}
          >
            <Part arrival={{ lift: 60, from: start, span: 0.12 }} style={drawn(start + 0.06, start + 0.1, 0.05)}>
              {/* the light on the front, lit while it works */}
              <circle cx={at(m.x1 - 14, face, m.h - 22)[0]} cy={at(m.x1 - 14, face, m.h - 22)[1]} r={3} className={styles.light} stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
              {n === 1 && (
                // BUILD's press stands on a column
                <g filter="url(#desk-chip)">
                  <Block x0={-21} x1={-9} y0={-6} y1={6} z={m.h} h={30} tone={TONES.concrete} r={3} width={1.1} />
                </g>
              )}
              {n === 2 && (
                // SHIP's label printer
                <g filter="url(#desk-chip)">
                  <Block x0={88} x1={122} y0={-13} y1={13} z={m.h} h={16} tone={TONES.concrete} r={4} width={1.1} />
                </g>
              )}
            </Part>
          </Layer>,
          // the part that moves while it works, in a layer of its own that is turned or slid as a whole
          <Layer
            key={`${m.key}-tool`}
            z={z + 1}
            className={`${styles.moving} ${[styles.pencil, styles.press, styles.tag][n]}`}
            style={{ transformOrigin: pivot([at(-137, 0, m.h), at(0, 0, 0), at(96, 13, m.h + 10)][n]) }}
            layerRef={(el) => {
              tools.current[n] = el;
            }}
          >
            <Part arrival={{ lift: 60, from: start, span: 0.12 }} style={drawn(start + 0.06, start + 0.1, 0.05)}>
              {n === 0 && (
                // DESIGN: a big pencil on top, which scribbles
                <g filter="url(#desk-chip)">
                  <Block x0={-142} x1={-132} y0={-5} y1={5} z={m.h} h={40} tone={{ top: "#f5dfd5", left: "#de9372", right: "#d0714c" }} r={2} width={1.1} />
                  <Block x0={-142} x1={-132} y0={-5} y1={5} z={m.h + 40} h={6} tone={TONES.concrete} r={2} width={1} />
                  <Detail d={poly(at(-137, 0, m.h - 12), at(-142, 5, m.h), at(-132, 5, m.h), at(-132, -5, m.h))} fill="#f4f4f0" width={1} />
                </g>
              )}
              {n === 1 && (
                // BUILD: the press, which comes down
                <g filter="url(#desk-chip)">
                  <Block x0={-33} x1={3} y0={-14} y1={14} z={m.h + 22} h={12} tone={{ top: "#9a9f98", left: "#7c817a", right: "#5e625c" }} r={4} width={1.1} />
                </g>
              )}
              {n === 2 && (
                // SHIP: the label, which flutters out
                <path d={rounded(frontFace(96, 114, m.h + 2, m.h + 10, 13), 1)} fill="#fafaf7" stroke="rgba(45,47,43,0.55)" strokeWidth={0.8} transform="translate(0 6)" />
              )}
            </Part>
          </Layer>,
        ];
      })}

      {/* ── the truck: its bed and what is loaded in it, under whatever is dropping in, under its cab ── */}
      <Layer
        z={13}
        className={styles.truck}
        layerRef={(el) => {
          truck.current[0] = el;
        }}
      >
        <Part arrival={{ lift: 30, from: 0.6, span: 0.12 }} style={drawn(0.58, 0.66)}>
          <g filter="url(#desk-card)">
            <Block x0={TRUCK.x0} x1={TRUCK.x1} y0={-TRUCK.half} y1={TRUCK.half} z={8} h={TRUCK.floor - 8} tone={TONES.concrete} r={5} />
            <Block x0={TRUCK.x0} x1={TRUCK.x1} y0={-TRUCK.half} y1={-TRUCK.half + 3} z={TRUCK.floor} h={12} tone={TONES.paper} r={2} width={1.1} />
            <Block x0={TRUCK.x0} x1={TRUCK.x0 + 3} y0={-TRUCK.half} y1={TRUCK.half} z={TRUCK.floor} h={12} tone={TONES.paper} r={2} width={1.1} />
          </g>
          {SLOTS.map((x, k) => (
            <g
              key={x}
              ref={(el) => {
                cargo.current[k] = el;
              }}
              visibility="hidden"
              filter="url(#desk-chip)"
            >
              <Block x0={x - 10} x1={x + 10} y0={-11} y1={11} z={TRUCK.floor} h={18} tone={KRAFT} r={2.5} width={1.1} />
              <path d={poly(...topFace(x - 10, x + 10, -2.4, 2.4, TRUCK.floor + 18))} fill="#d0714c" fillOpacity={0.75} />
            </g>
          ))}
        </Part>
      </Layer>
      <Layer
        z={15}
        className={styles.truck}
        layerRef={(el) => {
          truck.current[1] = el;
        }}
      >
        <Part arrival={{ lift: 30, from: 0.62, span: 0.12 }} style={drawn(0.6, 0.68)}>
          <g>
            <g filter="url(#desk-card)">
              <Block x0={TRUCK.x0} x1={TRUCK.x1} y0={TRUCK.half - 3} y1={TRUCK.half} z={TRUCK.floor} h={12} tone={TONES.paper} r={2} width={1.1} />
              <Block x0={TRUCK.x1} x1={TRUCK.cab} y0={-TRUCK.half + 2} y1={TRUCK.half - 2} z={8} h={44} tone={CAB} r={9} />
            </g>
            {/* windows, a light and its name */}
            <Detail d={rounded(frontFace(TRUCK.x1 + 8, TRUCK.cab - 8, 34, 46, TRUCK.half - 2), 3)} fill="#cbd7bd" />
            <Detail d={rounded(sideFace(TRUCK.cab, -TRUCK.half + 8, TRUCK.half - 8, 32, 46), 3)} fill="#cbd7bd" />
            <Detail d={rounded(sideFace(TRUCK.cab, TRUCK.half - 12, TRUCK.half - 6, 14, 19), 1.5)} fill="#fafaf7" />
            <text transform={onFront(at(TRUCK.x0 + 8, TRUCK.half, 25))} y={1} fontSize={6.5} fontWeight={700} letterSpacing={1} fill="#5e625c">
              SHIPPED ✓
            </text>
          </g>
          {/* wheels */}
          {[TRUCK.x0 + 16, TRUCK.x1 + 20].map((x) => (
            <g key={x} transform={onFront(at(x, TRUCK.half, 8))}>
              <circle r={8} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1.2} />
              <circle r={3.2} fill="#b8bcb5" />
            </g>
          ))}
        </Part>
      </Layer>
    </div>
  );
}
