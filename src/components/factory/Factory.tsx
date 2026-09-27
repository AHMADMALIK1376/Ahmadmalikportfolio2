"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { at, bend, between, Block, COS, Detail, drawn, frontFace, line, onFront, onSide, onTop, Part, poly, rounded, sideFace, topFace, TONES, Wire, type Point, type Tone } from "@/components/desk/iso";
import deskStyles from "@/components/desk/Desk.module.css";
import styles from "./Factory.module.css";

/**
 * The hero's factory, where ideas go in and apps come out: a conveyor belt
 * running from the top right of the picture to the bottom left, through a line
 * of machines, drawn the way the site's cards and buttons are — soft blocks in
 * paper and pastel, a wobbling edge and a hard shadow — on a factory floor.
 *
 * Sticky-note ideas (named after Ahmad's projects) drop out of a hopper fed from
 * a thought cloud. DESIGN turns each into a wireframe, BUILD (smoking away,
 * with a tank piped into it) into a laptop running the app, a robot arm at TEST
 * scans it and ticks it off, and SHIP boxes it. Each machine works while
 * something is inside it. The boxes drop into a truck at the end of the line;
 * when it is full it drives off — behind the words of the hero and on up behind
 * the bar along the top of the page — and the next truck, in another colour,
 * pulls in. Clicking the factory drops in an idea.
 *
 * It is drawn in layers, one SVG over another in the same view box, stacked in
 * the order they are painted, so a thing on the belt really goes into a machine
 * and comes out of the other side. Everything that moves is moved by its CSS
 * translate, so its wobbling edges are never redrawn.
 */

// ── the view, and moving within it ──────────────────────────────────────
const VB = { x: 40, y: 58, w: 712, h: 546 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
/** A shift on screen, in view box units, as a CSS translate of a layer the size of the view. */
const shift = (dx: number, dy: number) => `${((dx / VB.w) * 100).toFixed(3)}% ${((dy / VB.h) * 100).toFixed(3)}%`;
/** The shift on screen of a move in the scene: dx along x, dy along y, dz up. */
const move = (dx: number, dy: number, dz = 0) => shift(COS * (dx - dy), (dx + dy) / 2 - dz);
/** The same, in view box units, for an SVG transform. */
const moveBy = (dx: number, dy: number, dz = 0) => `translate(${(COS * (dx - dy)).toFixed(2)} ${((dx + dy) / 2 - dz).toFixed(2)})`;
const percentOf = ([x, y]: Point) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`;

// ── the line, in the scene's own units: y along the belt, x across it, z up ──
const BELT = { y0: -286, y1: 244, half: 26, z: 34 };
const FRAME = { half: 30, h: 30 };
const FLOOR = { x0: -98, x1: 114, y0: -332, y1: 262 };
/** Where the ideas drop onto the belt, and from how high. */
const SPAWN_Y = -282;
const FALL_FROM = 64;
/** The machines, in order along the belt, each a block the belt runs through. */
const MACHINES = [
  { key: "design", label: "DESIGN", y0: -226, y1: -168, h: 84, tone: { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" } },
  { key: "build", label: "BUILD", y0: -110, y1: -52, h: 88, tone: { top: "#f5dfd5", left: "#ecc9b9", right: "#e2b5a1" } },
  { key: "ship", label: "SHIP", y0: 60, y1: 118, h: 80, tone: TONES.paper },
] as const;
/** How far each machine reaches either side of the belt: no further than it must, so it hides as little of the belt as it can. */
const HALF = 32;
/** Where the robot arm scans what goes by. */
const TEST_Y = 6;
/** Where a truck waits to be loaded, and where in its bed the boxes go. */
const BAY = { x: 16, y: 284 };
const SLOTS = [0, 21, 42];

const BELT_TONE: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
const KRAFT: Tone = { top: "#ecbea9", left: "#e2b5a1", right: "#de9372" };
const LAPTOP: Tone = { top: "#e6e8e3", left: "#d3d6d0", right: "#b9bdb6" };
const FLOOR_TONE: Tone = { top: "#eceee9", left: "#dcded8", right: "#cfd2cb" };
const STEEL: Tone = { top: "#b8bcb5", left: "#9a9f98", right: "#7c817a" };
const NOTES = ["#e2e9da", "#f5dfd5", "#fafaf7"];
const IDEAS = ["FOLIUM", "GRAPHFORGE", "NEURACACHE", "HIREME", "FOCUSFLOW", "BUGISTAN", "BID ENGINE", "ROUTINE"];
/** The trucks, which take turns: each its own colour. */
const TRUCKS: Tone[] = [
  { top: "#de9372", left: "#d0714c", right: "#bc4e26" },
  { top: "#b1c29f", left: "#9caf88", right: "#80966b" },
  { top: "#9a9f98", left: "#7c817a", right: "#5e625c" },
];

// ── the timing ──────────────────────────────────────────────────────────
const INTRO = 3200;
const DELAY = 450;
const SPEED = 44; // along the belt, units a second
const SPAWN_EVERY = 1900;
const FALL = 420;
const DROP = 380;
const SLAT = 16;
const POOL = 10;
const GAP = 40; // the least room between two things on the belt
const DRIVE = 220; // a truck's speed, units a second
const ARRIVE = 1300;

/** The top of the belt, as a window in percent of the view: the slats are seen through it. */
const BELT_CLIP = `polygon(${topFace(-BELT.half, BELT.half, BELT.y0, BELT.y1, BELT.z)
  .map(percentOf)
  .join(", ")})`;

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

/** A box, as it goes into a truck: the size of a slot in its bed. */
function Parcel({ x = 0, y = 0, z = BELT.z, along = "x", label = true }: { x?: number; y?: number; z?: number; along?: "x" | "y"; label?: boolean }) {
  const [hx, hy] = along === "x" ? [10, 11] : [11, 10];
  return (
    <>
      <g filter="url(#desk-chip)">
        <Block x0={x - hx} x1={x + hx} y0={y - hy} y1={y + hy} z={z} h={18} tone={KRAFT} r={2.5} width={1.1} />
      </g>
      <path d={poly(...(along === "x" ? topFace(x - hx, x + hx, y - 2.4, y + 2.4, z + 18) : topFace(x - 2.4, x + 2.4, y - hy, y + hy, z + 18)))} fill="#d0714c" fillOpacity={0.75} />
      {label && <path d={rounded(sideFace(x + hx, y - 7, y + 8, z + 5, z + 12.5), 1.5)} fill="#fafaf7" stroke="rgba(45,47,43,0.4)" strokeWidth={0.6} />}
    </>
  );
}

/** The four things an idea is on its way down the line, drawn where the belt starts: all there, one shown at a time. */
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
          <Block x0={-12} x1={12} y0={-16} y1={16} z={z} h={2} tone={TONES.paper} r={3} width={1.1} />
        </g>
        <g transform={onTop(at(-12, -16, z + 2))} fill="none" stroke="#5e625c" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x={2.5} y={2.5} width={19} height={5} rx={1} fill="#cbd7bd" />
          <rect x={2.5} y={10} width={9} height={11} rx={1} />
          <path d="M2.5 10 11.5 21M11.5 10 2.5 21" strokeWidth={0.5} />
          <rect x={13.5} y={10} width={8} height={5} rx={1} fill="#f5dfd5" />
          <path d="M13.5 18H21.5M2.5 25H21.5M2.5 28H15" />
        </g>
      </g>
      {/* the app, running on a laptop */}
      <g data-stage="2" visibility="hidden" transform={bigger}>
        <g filter="url(#desk-chip)">
          <Block x0={-10} x1={12} y0={-16} y1={16} z={z} h={3} tone={LAPTOP} r={3} width={1.1} />
          <Block x0={-13} x1={-10} y0={-16} y1={16} z={z + 3} h={24} tone={TONES.dark} r={2.5} width={1.1} />
        </g>
        <path d={rounded(topFace(-6, 9, -12, 12, z + 3), 2)} fill="#d3d6d0" />
        <g transform={onSide(at(-10, 14, z + 25))}>
          <rect x={0} y={0} width={28} height={19.5} rx={1.5} fill="#f4f4f0" />
          <rect x={0} y={0} width={28} height={4} rx={1.5} fill="#9caf88" />
          <path d="M3 8H22M3 11H18" stroke="#9a9f98" strokeWidth={1} strokeLinecap="round" />
          <rect x={3} y={14} width={8} height={3.4} rx={1.2} fill="#d0714c" />
          <rect x={14} y={7} width={11} height={10} rx={1} fill="#e2e9da" />
        </g>
      </g>
      {/* and boxed, for the truck */}
      <g data-stage="3" visibility="hidden">
        <Parcel />
        <text data-label="" transform={onSide(at(10, 7, z + 7.4))} fontSize={3.8} fontWeight={700} fill="#2d2f2b" textLength={13} lengthAdjust="spacingAndGlyphs">
          IDEA
        </text>
      </g>
    </g>
  );
}

/** A truck, standing at the loading bay: facing along −x as it waits and drives off, or along −y once it has turned. */
function Truck({ tone, facing, cargo }: { tone: Tone; facing: "x" | "y"; cargo: (k: number) => (el: SVGGElement | null) => void }) {
  const { x: cx, y: cy } = BAY;
  const glass = "#cbd7bd";
  if (facing === "x") {
    return (
      <>
        <g filter="url(#desk-card)">
          <Block x0={cx - 44} x1={cx - 12} y0={cy - 24} y1={cy + 24} z={8} h={42} tone={tone} r={9} />
          <Block x0={cx - 12} x1={cx + 56} y0={cy - 26} y1={cy + 26} z={8} h={8} tone={TONES.concrete} r={5} />
          <Block x0={cx - 12} x1={cx + 56} y0={cy - 26} y1={cy - 23} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
        </g>
        <Detail d={rounded(frontFace(cx - 38, cx - 18, 30, 44, cy + 24), 3)} fill={glass} />
        <Detail d={rounded(topFace(cx - 36, cx - 20, cy - 10, cy + 10, 50), 3)} fill="#fafaf7" />
        {SLOTS.map((s, k) => (
          <g key={s} ref={cargo(k)} visibility="hidden">
            <Parcel x={cx + s} y={cy} z={16} along="x" label={false} />
          </g>
        ))}
        <g filter="url(#desk-card)">
          <Block x0={cx - 12} x1={cx + 56} y0={cy + 23} y1={cy + 26} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
          <Block x0={cx + 53} x1={cx + 56} y0={cy - 26} y1={cy + 26} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
        </g>
        <text transform={onFront(at(cx - 6, cy + 26, 25))} y={1} fontSize={6.5} fontWeight={700} letterSpacing={1} fill="#5e625c">
          SHIPPED ✓
        </text>
        {[cx - 28, cx + 40].map((x) => (
          <g key={x} transform={onFront(at(x, cy + 26, 8))}>
            <circle r={8} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1.2} />
            <circle r={3.2} fill="#b8bcb5" />
          </g>
        ))}
      </>
    );
  }
  return (
    <>
      <g filter="url(#desk-card)">
        <Block x0={cx - 24} x1={cx + 24} y0={cy - 44} y1={cy - 12} z={8} h={42} tone={tone} r={9} />
        <Block x0={cx - 26} x1={cx + 26} y0={cy - 12} y1={cy + 56} z={8} h={8} tone={TONES.concrete} r={5} />
        <Block x0={cx - 26} x1={cx - 23} y0={cy - 12} y1={cy + 56} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
      </g>
      <Detail d={rounded(sideFace(cx + 24, cy - 38, cy - 18, 30, 44), 3)} fill={glass} />
      <Detail d={rounded(topFace(cx - 10, cx + 10, cy - 36, cy - 20, 50), 3)} fill="#fafaf7" />
      {SLOTS.map((s, k) => (
        <g key={s} ref={cargo(k)} visibility="hidden">
          <Parcel x={cx} y={cy + s} z={16} along="y" label={false} />
        </g>
      ))}
      <g filter="url(#desk-card)">
        <Block x0={cx + 23} x1={cx + 26} y0={cy - 12} y1={cy + 56} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
        <Block x0={cx - 26} x1={cx + 26} y0={cy + 53} y1={cy + 56} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
      </g>
      <text transform={onSide(at(cx + 26, cy + 50, 25))} y={1} fontSize={6.5} fontWeight={700} letterSpacing={1} fill="#5e625c">
        SHIPPED ✓
      </text>
      {[cy - 28, cy + 40].map((y) => (
        <g key={y} transform={onSide(at(cx + 26, y, 8))}>
          <circle r={8} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1.2} />
          <circle r={3.2} fill="#b8bcb5" />
        </g>
      ))}
    </>
  );
}

/** What is on the belt, and where it is. */
type Item = { on: boolean; y: number; dz: number; stage: number; state: "fall" | "belt"; t: number; gap: number; scanned: boolean };
/** A truck, and where it is on its round: coming in, waiting to be loaded, or driving off (first along −x, then along −y). */
type Lorry = { state: "away" | "arriving" | "loading" | "leaving"; t: number; loaded: number; dropping: { k: number; t: number }[]; leg1: number; leg2: number; facing: "x" | "y" };

export default function Factory({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const items = useRef<(SVGSVGElement | null)[]>([]);
  const works = useRef<(SVGSVGElement | null)[]>([]);
  const tools = useRef<(SVGSVGElement | null)[]>([]);
  const trucks = useRef<(SVGSVGElement | null)[]>([]);
  const faces = useRef<{ x: SVGGElement | null; y: SVGGElement | null }[]>(TRUCKS.map(() => ({ x: null, y: null })));
  const cargo = useRef<{ x: (SVGGElement | null)[]; y: (SVGGElement | null)[] }[]>(TRUCKS.map(() => ({ x: [], y: [] })));
  const tick = useRef<SVGSVGElement>(null);
  /** set while running: drops a new idea into the hopper */
  const drop = useRef<() => void>(() => {});

  // the opening: --p runs from 0 to 1, and every part works out from it where it is
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : INTRO;
    let start = -1;
    let frame = 0;
    const step = (now: number) => {
      if (start < 0) start = now + (length ? DELAY : 0);
      const p = length ? Math.min(1, Math.max(0, (now - start) / length)) : 1;
      el.parentElement?.style.setProperty("--p", p.toFixed(4));
      if (p < 1) frame = requestAnimationFrame(step);
      else setBuilt(true);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  // the line, running
  useEffect(() => {
    if (!built) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state: Item[] = Array.from({ length: POOL }, () => ({ on: false, y: 0, dz: 0, stage: 0, state: "belt", t: 0, gap: 0, scanned: false }));
    const lorries: Lorry[] = TRUCKS.map((_, n) => ({ state: n === 0 ? "loading" : "away", t: 0, loaded: 0, dropping: [], leg1: 0, leg2: 0, facing: "x" }));
    let spawned = 0;

    const look = (i: number, next: number) => {
      items.current[i]?.querySelectorAll<SVGGElement>("[data-stage]").forEach((g) => g.setAttribute("visibility", g.dataset.stage === String(next) ? "visible" : "hidden"));
      state[i].stage = next;
    };
    /** Which layer a thing on the belt belongs in: before the first machine it has come out of, and so on. */
    const LAYER_FOR_GAP = [3, 7, 10, 14];
    const place = (i: number) => {
      const svg = items.current[i];
      const it = state[i];
      if (!svg) return;
      svg.style.translate = move(0, it.y, it.dz);
      const gap = MACHINES.filter((m) => it.y >= m.y1).length;
      if (gap !== it.gap) {
        it.gap = gap;
        svg.style.zIndex = String(LAYER_FOR_GAP[gap]);
      }
    };
    const showCargo = (n: number, count: number) =>
      (["x", "y"] as const).forEach((f) => cargo.current[n][f].forEach((g, k) => g?.setAttribute("visibility", k < count ? "visible" : "hidden")));
    const face = (n: number, facing: "x" | "y") => {
      faces.current[n].x?.setAttribute("visibility", facing === "x" ? "visible" : "hidden");
      faces.current[n].y?.setAttribute("visibility", facing === "y" ? "visible" : "hidden");
    };
    const moveTruck = (n: number, dx: number, dy: number, opacity: number) => {
      const svg = trucks.current[n];
      if (!svg) return;
      svg.style.translate = move(dx, dy);
      svg.style.opacity = String(opacity);
    };

    const spawn = () => {
      const i = state.findIndex((it) => !it.on);
      if (i < 0) return false;
      // room under the hopper
      if (state.some((it) => it.on && it.y < SPAWN_Y + GAP)) return false;
      const it = state[i];
      Object.assign(it, { on: true, y: SPAWN_Y, dz: FALL_FROM, state: "fall", t: 0, gap: -1, scanned: false });
      const name = IDEAS[spawned++ % IDEAS.length];
      items.current[i]?.querySelectorAll("[data-label]").forEach((text) => (text.textContent = name));
      look(i, 0);
      place(i);
      items.current[i]?.setAttribute("data-on", "");
      return true;
    };

    // every truck but the first waits out of sight; the first stands in the bay
    lorries.forEach((l, n) => {
      face(n, "x");
      moveTruck(n, l.state === "away" ? 300 : 0, 0, l.state === "away" ? 0 : 1);
      showCargo(n, 0);
    });

    // with reduced motion: one of each thing along the belt, standing still, and a truck with two boxes in
    if (reduced) {
      [-282, -120, 0, 150].forEach((y, i) => {
        Object.assign(state[i], { on: true, y, dz: 0, state: "belt", gap: -1 });
        items.current[i]?.querySelectorAll("[data-label]").forEach((text) => (text.textContent = IDEAS[i]));
        look(i, i);
        place(i);
        items.current[i]?.setAttribute("data-on", "");
      });
      showCargo(0, 2);
      return;
    }

    let working = MACHINES.map(() => false);
    let scanning = false;
    let clock = SPAWN_EVERY - 600;
    drop.current = () => {
      if (spawn()) clock = 0;
    };

    /** How far a truck must drive to go behind the words of the hero and then up past the top of the page. */
    const route = () => {
      const el = stage.current;
      if (!el) return { leg1: 500, leg2: 1200 };
      const box = el.getBoundingClientRect();
      const scale = box.width / VB.w;
      const [vx, vy] = at(BAY.x, BAY.y, 0);
      const x = box.left + (vx - VB.x) * scale;
      const y = box.top + window.scrollY + (vy - VB.y) * scale;
      // along −x (up and to the left) until it is a little way in from the left of the page, behind the words there
      const leg1 = Math.max(160, (x - Math.max(24, window.innerWidth * 0.14)) / (COS * scale));
      // then along −y (up and to the right) until it has gone behind the bar at the top, and on off the page
      const leg2 = (y - leg1 * 0.5 * scale + 320) / (0.5 * scale);
      return { leg1, leg2 };
    };

    const loading = () => lorries.findIndex((l) => l.state === "loading");

    const step = (dt: number) => {
      clock += dt;
      if (clock >= SPAWN_EVERY && spawn()) clock = 0;

      // the things on the belt, front first, so each keeps its distance behind the one ahead
      const order = state.map((_, i) => i).filter((i) => state[i].on).sort((a, b) => state[b].y - state[a].y);
      let ahead = Infinity;
      for (const i of order) {
        const it = state[i];
        it.t += dt;
        if (it.state === "fall") {
          const k = Math.min(1, it.t / FALL);
          it.dz = FALL_FROM * (1 - k * k);
          if (k >= 1) Object.assign(it, { state: "belt", dz: 0, t: 0 });
        } else {
          it.y = Math.min(it.y + (SPEED * dt) / 1000, ahead - GAP, BELT.y1);
          // each machine turns it into the next thing halfway through
          MACHINES.forEach((m, n) => {
            if (it.stage === n && it.y >= (m.y0 + m.y1) / 2) look(i, n + 1);
          });
          // the robot arm ticks it off as it passes under
          if (!it.scanned && it.y >= TEST_Y) {
            it.scanned = true;
            tick.current?.removeAttribute("data-on");
            void tick.current?.getBoundingClientRect();
            tick.current?.setAttribute("data-on", "");
          }
          // at the end of the belt, into the truck in the bay, if there is one with room
          const n = loading();
          if (it.y >= BELT.y1 && n >= 0 && lorries[n].loaded + lorries[n].dropping.length < SLOTS.length) {
            const lorry = lorries[n];
            const k = lorry.loaded + lorry.dropping.length;
            lorry.dropping.push({ k, t: 0 });
            it.on = false;
            items.current[i]?.removeAttribute("data-on");
            continue;
          }
        }
        ahead = it.y;
        place(i);
      }

      // a machine works while something is inside it
      const now = MACHINES.map((m) => state.some((it) => it.on && it.state === "belt" && it.y > m.y0 && it.y < m.y1));
      now.forEach((on, n) => {
        if (on !== working[n]) {
          works.current[n]?.toggleAttribute("data-working", on);
          tools.current[n]?.toggleAttribute("data-working", on);
        }
      });
      working = now;
      const scan = state.some((it) => it.on && Math.abs(it.y - TEST_Y) < 22);
      if (scan !== scanning) {
        scanning = scan;
        tools.current[3]?.toggleAttribute("data-working", scan);
      }

      // the trucks
      lorries.forEach((lorry, n) => {
        lorry.t += dt;
        // boxes dropping into its bed, off the end of the belt
        lorry.dropping = lorry.dropping.filter((d) => {
          d.t += dt;
          const k = Math.min(1, d.t / DROP);
          const g = cargo.current[n].x[d.k];
          g?.setAttribute("visibility", "visible");
          const fromX = -BAY.x - SLOTS[d.k];
          const fromY = BELT.y1 - BAY.y;
          g?.setAttribute("transform", moveBy(fromX * (1 - k), fromY * (1 - k), (BELT.z - 16) * (1 - k) + 14 * Math.sin(Math.PI * k)));
          if (k >= 1) {
            g?.removeAttribute("transform");
            lorry.loaded++;
            showCargo(n, lorry.loaded);
            return false;
          }
          return true;
        });
        if (lorry.state === "loading" && lorry.loaded >= SLOTS.length && !lorry.dropping.length) {
          // full: off it goes, and the next truck comes in
          Object.assign(lorry, { state: "leaving", t: -350, ...route(), facing: "x" });
          const next = lorries.findIndex((l) => l.state === "away");
          if (next >= 0) Object.assign(lorries[next], { state: "arriving", t: 0, loaded: 0 });
        } else if (lorry.state === "arriving") {
          const k = Math.min(1, lorry.t / ARRIVE);
          const e = 1 - (1 - k) * (1 - k);
          face(n, "x");
          showCargo(n, 0);
          moveTruck(n, 300 * (1 - e), 0, Math.min(1, k * 3));
          if (k >= 1) Object.assign(lorry, { state: "loading", t: 0 });
        } else if (lorry.state === "leaving" && lorry.t > 0) {
          // pulling away gently, then at speed: first along −x, round the corner, then along −y
          const run = (DRIVE * lorry.t) / 1000;
          const eased = run < 40 ? (run * run) / 80 : run - 20;
          if (eased <= lorry.leg1) {
            moveTruck(n, -eased, 0, 1);
          } else {
            if (lorry.facing === "x") {
              lorry.facing = "y";
              face(n, "y");
            }
            const on = eased - lorry.leg1;
            moveTruck(n, -lorry.leg1, -on, 1);
            if (on >= lorry.leg2) {
              Object.assign(lorry, { state: "away", t: 0, loaded: 0 });
              face(n, "x");
              showCargo(n, 0);
              moveTruck(n, 300, 0, 0);
            }
          }
        }
      });
    };

    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(60, now - last) : 16;
      last = now;
      step(dt);
      frame = requestAnimationFrame(loop);
    };
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = 0;
        frame = requestAnimationFrame(loop);
      }
    });
    if (stage.current) watch.observe(stage.current);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      drop.current = () => {};
    };
  }, [built]);

  const slatShift = { "--slat-to": move(0, SLAT), "--slat-time": `${SLAT / SPEED}s` } as CSSProperties;
  const lamp = (x: number, y: number) => (
    <g key={`${x}-${y}`} filter="url(#desk-chip)">
      <Block x0={x - 2} x1={x + 2} y0={y - 2} y1={y + 2} z={0} h={108} tone={STEEL} r={1.5} width={1} />
      <Block x0={x - 2} x1={x + 16} y0={y - 3} y1={y + 3} z={106} h={5} tone={STEEL} r={2} width={1} />
      <Block x0={x + 10} x1={x + 20} y0={y - 6} y1={y + 6} z={98} h={9} tone={{ top: "#f5dfd5", left: "#de9372", right: "#d0714c" }} r={3} width={1} />
    </g>
  );

  return (
    <div className={`${styles.root} ${className ?? ""}`} onClick={() => drop.current()}>
      <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""}`} aria-hidden="true">
        {/* ── the floor, the belt, and everything that stands behind the line ── */}
        <svg viewBox={VIEW} className={styles.base} style={{ zIndex: 1 }} focusable="false">
          <g style={drawn(0, 0.1)} filter="url(#desk-card)">
            <Block x0={FLOOR.x0} x1={FLOOR.x1} y0={FLOOR.y0} y1={FLOOR.y1} z={-8} h={8} tone={FLOOR_TONE} r={26} />
          </g>
          {/* a walkway painted on the floor, and hazard stripes at the bay */}
          <g style={drawn(0.08, 0.12)}>
            <Detail d={line(at(64, FLOOR.y0 + 24, 0), at(64, FLOOR.y1 - 30, 0))} stroke="#b8bcb5" width={1.6} />
            <Detail d={line(at(100, FLOOR.y0 + 24, 0), at(100, FLOOR.y1 - 30, 0))} stroke="#b8bcb5" width={1.6} />
          </g>
          {Array.from({ length: 7 }, (_, k) => (
            <path key={k} d={poly(at(-40 + k * 16, 250, 0), at(-32 + k * 16, 250, 0), at(-38 + k * 16, 260, 0), at(-46 + k * 16, 260, 0))} fill={k % 2 ? "#fafaf7" : "#de9372"} className={deskStyles.fade} style={between(0.1, 0.05)} />
          ))}
          <g style={drawn(0.02, 0.12)} filter="url(#desk-card)">
            <Block x0={-FRAME.half} x1={FRAME.half} y0={BELT.y0} y1={BELT.y1} z={0} h={FRAME.h} tone={TONES.concrete} r={10} />
          </g>
          <g style={drawn(0.08, 0.16)} filter="url(#desk-ink)">
            <Block x0={-BELT.half} x1={BELT.half} y0={BELT.y0} y1={BELT.y1} z={FRAME.h} h={BELT.z - FRAME.h} tone={BELT_TONE} r={7} width={1.2} />
          </g>
          {/* rivets along the frame */}
          <g style={drawn(0.14, 0.18, 0.05)}>
            {Array.from({ length: 12 }, (_, i) => (
              <Detail key={i} d={rounded(sideFace(FRAME.half, BELT.y0 + 26 + i * 44, BELT.y0 + 30 + i * 44, 12, 16), 2)} fill="#9a9f98" width={0.8} />
            ))}
          </g>
          {/* the hopper's post, the lamps, and the robot arm's column: all behind the belt */}
          <g style={drawn(0.16, 0.22)} filter="url(#desk-chip)">
            <Block x0={-44} x1={-36} y0={-300} y1={-292} z={0} h={96} tone={TONES.concrete} r={3} width={1.1} />
          </g>
          <g style={drawn(0.18, 0.24)}>{[lamp(-56, -120), lamp(-56, 150)]}</g>
          <g style={drawn(0.3, 0.36)} filter="url(#desk-card)">
            <Block x0={-78} x1={-50} y0={TEST_Y - 14} y1={TEST_Y + 14} z={0} h={12} tone={TONES.dark} r={5} />
            <Block x0={-70} x1={-58} y0={TEST_Y - 6} y1={TEST_Y + 6} z={12} h={90} tone={STEEL} r={4} />
          </g>
        </svg>

        {/* the belt's slats: a layer slid along under a window the shape of the belt, so nothing is redrawn as it runs */}
        <div className={styles.window} style={{ clipPath: BELT_CLIP, zIndex: 2 }}>
          <Layer z={2} className={`${styles.slats} ${deskStyles.fade}`} style={{ ...slatShift, ...between(0.2, 0.06) }}>
            <g stroke="#7c817a" strokeWidth={1.4} strokeLinecap="round">
              {Array.from({ length: Math.ceil((BELT.y1 - BELT.y0) / SLAT) + 2 }, (_, i) => {
                const y = BELT.y0 - SLAT + i * SLAT;
                return <path key={i} d={line(at(-BELT.half, y, BELT.z), at(BELT.half, y, BELT.z))} />;
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

        {/* ── the hopper the ideas drop out of, fed from a thought cloud ── */}
        <Layer z={4}>
          <Part arrival={{ lift: 40, from: 0.2, span: 0.1 }} style={drawn(0.18, 0.26)}>
            <g filter="url(#desk-chip)">
              <Block x0={-6} x1={6} y0={-294} y1={-282} z={124} h={40} tone={STEEL} r={3} width={1.1} />
            </g>
            <g filter="url(#desk-card)">
              <Block x0={-30} x1={30} y0={-314} y1={-262} z={96} h={28} tone={TONES.paper} r={8} />
            </g>
            <text transform={onSide(at(30, -270, 116))} y={2} fontSize={9.5} fontWeight={700} letterSpacing={1.2} fill="#3b3d39">
              IDEAS
            </text>
            {/* the thought cloud, with a bright idea in it */}
            <g transform={`translate(${at(0, -288, 176)[0].toFixed(1)} ${at(0, -288, 176)[1].toFixed(1)})`} filter="url(#desk-chip)">
              <path d="M-30 6c-8 0-11-9-4-13-2-9 9-14 15-8 3-9 17-9 20 0 6-5 16 0 13 8 7 3 5 13-3 13Z" fill="#fafaf7" stroke="rgba(45,47,43,0.5)" strokeWidth={1.3} />
              <g fill="none" stroke="#bc4e26" strokeWidth={1.3} strokeLinecap="round" transform="translate(-4 -12)">
                <path d="M4 12c-2.2-1.6-3.3-3.4-3.3-5.5a4.3 4.3 0 0 1 8.6 0c0 2.1-1.1 3.9-3.3 5.5ZM4 14h2.2" />
              </g>
            </g>
          </Part>
        </Layer>

        {/* ── the three machines, each with its moving parts in a layer just over it ── */}
        {MACHINES.map((m, n) => {
          const z = [5, 8, 12][n];
          const start = 0.26 + n * 0.08;
          const mid = (m.y0 + m.y1) / 2;
          return [
            <Layer key={m.key} z={z}>
              <Part arrival={{ lift: 60, from: start, span: 0.12 }} style={drawn(start - 0.02, start + 0.08)}>
                <g filter="url(#desk-card)">
                  <Block x0={-HALF} x1={HALF} y0={m.y0} y1={m.y1} z={0} h={m.h} tone={m.tone} r={14} />
                  {n === 1 && <Block x0={-26} x1={-12} y0={m.y0 + 6} y1={m.y0 + 20} z={m.h} h={40} tone={TONES.concrete} r={4} />}
                </g>
                {n === 1 && <Detail d={poly(...topFace(-26, -12, m.y0 + 6, m.y0 + 20, m.h + 32))} fill="#d0714c" width={1} />}
                {/* where the belt comes out, with a curtain of strips */}
                <Detail d={rounded(frontFace(-BELT.half - 2, BELT.half + 2, BELT.z - 2, BELT.z + 34, m.y1), 6)} fill="#3b3d39" />
                {Array.from({ length: 5 }, (_, k) => (
                  <Detail key={k} d={line(at(-BELT.half + 6 + k * 10, m.y1, BELT.z + 32), at(-BELT.half + 6 + k * 10, m.y1, BELT.z + 14))} stroke="#7c817a" width={2.4} />
                ))}
                {/* its name, on the side */}
                <Detail d={rounded(sideFace(HALF, m.y0 + 6, m.y1 - 6, m.h - 30, m.h - 12), 5)} fill="#fafaf7" />
                <text transform={onSide(at(HALF, m.y1 - 10, m.h - 17))} fontSize={9.5} fontWeight={700} letterSpacing={0.8} fill="#2d2f2b">
                  {m.label}
                </text>
                {Array.from({ length: 3 }, (_, k) => (
                  <Detail key={k} d={line(at(HALF, m.y1 - 10, 20 + k * 8), at(HALF, m.y1 - 30, 20 + k * 8))} width={1.3} />
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
                {/* the light on the side, lit while it works */}
                <circle cx={at(HALF, m.y0 + 14, m.h - 22)[0]} cy={at(HALF, m.y0 + 14, m.h - 22)[1]} r={3} className={styles.light} stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
                {n === 1 && (
                  <g filter="url(#desk-chip)">
                    <Block x0={-6} x1={6} y0={mid - 6} y1={mid + 6} z={m.h} h={30} tone={TONES.concrete} r={3} width={1.1} />
                  </g>
                )}
                {n === 2 && (
                  <g filter="url(#desk-chip)">
                    <Block x0={-13} x1={13} y0={mid - 16} y1={mid + 16} z={m.h} h={16} tone={TONES.concrete} r={4} width={1.1} />
                  </g>
                )}
              </Part>
            </Layer>,
            // the part that moves while it works, in a layer of its own that is turned or slid as a whole
            <Layer
              key={`${m.key}-tool`}
              z={z + 1}
              className={`${styles.moving} ${[styles.pencil, styles.press, styles.tag][n]}`}
              style={{ transformOrigin: percentOf([at(0, mid, m.h), at(0, 0, 0), at(-9, mid + 16, m.h + 10)][n]) }}
              layerRef={(el) => {
                tools.current[n] = el;
              }}
            >
              <Part arrival={{ lift: 60, from: start, span: 0.12 }} style={drawn(start + 0.06, start + 0.1, 0.05)}>
                {n === 0 && (
                  // DESIGN: a big pencil on top, which scribbles
                  <g filter="url(#desk-chip)">
                    <Block x0={-5} x1={5} y0={mid - 5} y1={mid + 5} z={m.h} h={40} tone={{ top: "#f5dfd5", left: "#de9372", right: "#d0714c" }} r={2} width={1.1} />
                    <Block x0={-5} x1={5} y0={mid - 5} y1={mid + 5} z={m.h + 40} h={6} tone={TONES.concrete} r={2} width={1} />
                    <Detail d={poly(at(0, mid, m.h - 12), at(-5, mid + 5, m.h), at(5, mid + 5, m.h), at(5, mid - 5, m.h))} fill="#f4f4f0" width={1} />
                  </g>
                )}
                {n === 1 && (
                  // BUILD: the press, which comes down
                  <g filter="url(#desk-chip)">
                    <Block x0={-14} x1={14} y0={mid - 18} y1={mid + 18} z={m.h + 22} h={12} tone={{ top: "#9a9f98", left: "#7c817a", right: "#5e625c" }} r={4} width={1.1} />
                  </g>
                )}
                {n === 2 && (
                  // SHIP: the label, which flutters out
                  <path d={rounded(frontFace(-9, 9, m.h + 2, m.h + 10, mid + 16), 1)} fill="#fafaf7" stroke="rgba(45,47,43,0.55)" strokeWidth={0.8} transform="translate(0 6)" />
                )}
              </Part>
            </Layer>,
          ];
        })}

        {/* BUILD's chimney, smoking */}
        <Layer z={9} className={styles.steam}>
          {[0, 1, 2].map((k) => {
            const [x, y] = at(-19, MACHINES[1].y0 + 13, MACHINES[1].h + 44);
            return <circle key={k} cx={x} cy={y} r={6 + k * 1.5} fill="#fafaf7" stroke="rgba(45,47,43,0.35)" strokeWidth={1} style={{ animationDelay: `${k * -0.9}s` }} />;
          })}
        </Layer>

        {/* ── TEST: the robot arm, reaching out over the belt with its scanner ── */}
        <Layer
          z={11}
          className={`${styles.moving} ${styles.arm}`}
          layerRef={(el) => {
            tools.current[3] = el;
          }}
        >
          <Part arrival={{ lift: 50, from: 0.52, span: 0.1 }} style={drawn(0.5, 0.58)}>
            <g filter="url(#desk-chip)">
              <Block x0={-70} x1={10} y0={TEST_Y - 5} y1={TEST_Y + 5} z={102} h={9} tone={STEEL} r={3} width={1.1} />
              <Block x0={-9} x1={9} y0={TEST_Y - 9} y1={TEST_Y + 9} z={80} h={22} tone={{ top: "#e2e9da", left: "#cbd7bd", right: "#b1c29f" }} r={5} width={1.1} />
            </g>
            <path className={styles.beam} d={poly(at(-6, TEST_Y - 6, 80), at(6, TEST_Y + 6, 80), at(20, TEST_Y + 22, BELT.z), at(-20, TEST_Y - 22, BELT.z))} fill="#9caf88" />
            <Detail d={rounded(sideFace(9, TEST_Y - 5, TEST_Y + 5, 86, 96), 2)} fill="#3b3d39" />
            <text transform={onSide(at(-58, TEST_Y + 5, 118))} fontSize={8} fontWeight={700} letterSpacing={1} fill="#5e625c">
              TEST
            </text>
          </Part>
        </Layer>
        {/* and the tick it gives each laptop */}
        <Layer z={11} className={styles.tick} layerRef={(el) => void (tick.current = el)}>
          <g transform={`translate(${at(0, TEST_Y, 128)[0].toFixed(1)} ${at(0, TEST_Y, 128)[1].toFixed(1)})`}>
            <circle r={8} fill="#9caf88" stroke="rgba(45,47,43,0.55)" strokeWidth={1.1} />
            <path d="M-3.5 0.2 -1 2.8 3.8 -2.6" fill="none" stroke="#fafaf7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </Layer>

        {/* ── the floor in front of the line: the control desk, the tank piped into BUILD, and pallets of boxes ── */}
        <Layer z={15}>
          <Part arrival={{ lift: 40, from: 0.44, span: 0.12 }} style={drawn(0.42, 0.52)}>
            <g filter="url(#desk-card)">
              <Block x0={50} x1={88} y0={-176} y1={-136} z={0} h={34} tone={TONES.concrete} r={6} />
              <Block x0={56} x1={62} y0={-170} y1={-142} z={34} h={26} tone={TONES.dark} r={3} width={1.1} />
              <Block x0={54} x1={92} y0={-58} y1={-20} z={0} h={72} tone={{ top: "#e2e9da", left: "#cbd7bd", right: "#b1c29f" }} r={18} />
            </g>
            {[20, 46].map((z) => (
              <Detail key={z} d={line(at(92, -54, z), at(92, -24, z))} width={1.6} stroke="#80966b" />
            ))}
            <text transform={onSide(at(92, -26, 62))} fontSize={7} fontWeight={700} letterSpacing={0.8} fill="#4c5e3e">
              COFFEE
            </text>
            {[
              [72, -168],
              [80, -158],
              [72, -148],
            ].map(([x, y], k) => (
              <Detail key={k} d={rounded(topFace(x - 2.5, x + 2.5, y - 2.5, y + 2.5, 34), 1.5)} fill={["#d0714c", "#9caf88", "#f4f4f0"][k]} width={0.9} />
            ))}
            <Wire d={bend([at(54, -40, 52), at(42, -40, 52), at(42, -80, 52), at(HALF, -80, 52)], 6)} width={4} colour="#9a9f98" light="#d2d5cf" />
            <g filter="url(#desk-chip)">
              <Block x0={48} x1={92} y0={82} y1={126} z={0} h={6} tone={{ top: "#e2b5a1", left: "#d0a58f", right: "#c0947f" }} r={2} width={1.1} />
            </g>
            {[
              [60, 94, 6],
              [80, 94, 6],
              [60, 114, 6],
              [80, 114, 6],
              [70, 104, 24],
            ].map(([x, y, z]) => (
              <g key={`${x}-${y}-${z}`}>
                <Parcel x={x} y={y} z={z} along="y" label={false} />
              </g>
            ))}
          </Part>
        </Layer>
        {/* the control desk's screen, charting the line's output */}
        <Layer z={16} className={deskStyles.fade} style={between(0.56, 0.05)}>
          <g transform={onSide(at(62, -144, 58))}>
            <rect x={0} y={0} width={24} height={20} rx={1.5} fill="#3b3d39" />
            <clipPath id="factory-chart">
              <rect x={1.5} y={1.5} width={21} height={17} />
            </clipPath>
            <g clipPath="url(#factory-chart)">
              <path className={styles.chart} d="M0 15 4 12 8 13 12 8 16 10 20 5 24 7 28 4 32 9 36 6 40 10 44 7 48 11" fill="none" stroke="#9caf88" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        </Layer>
      </div>

      {/* ── the trucks: outside the factory's own stacking, so they can drive off behind the words of the hero ── */}
      {TRUCKS.map((tone, n) => (
        <svg
          key={n}
          ref={(el) => {
            trucks.current[n] = el;
          }}
          viewBox={VIEW}
          className={`${styles.layer} ${styles.truck}`}
          style={{ zIndex: 20, opacity: n === 0 ? undefined : 0 }}
          aria-hidden="true"
          focusable="false"
        >
          <Part arrival={{ lift: 30, from: 0.6, span: 0.12 }} style={drawn(0.58, 0.66)}>
            {(["x", "y"] as const).map((f) => (
              <g
                key={f}
                ref={(el) => {
                  faces.current[n][f] = el;
                }}
                visibility={f === "x" ? "visible" : "hidden"}
              >
                <Truck
                  tone={tone}
                  facing={f}
                  cargo={(k) => (el) => {
                    cargo.current[n][f][k] = el;
                  }}
                />
              </g>
            ))}
          </Part>
        </svg>
      ))}
    </div>
  );
}
