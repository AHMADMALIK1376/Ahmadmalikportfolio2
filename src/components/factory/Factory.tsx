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
 * a thought cloud. The belt runs right through three machines — in at an
 * opening at one end, along a tunnel with a glass side, and out at the other —
 * and the work inside each can be watched through the glass: at DESIGN a pen
 * comes down and draws the idea into a wireframe, at BUILD a press stamps the
 * wireframe into a laptop running the app, and at SHIP a box is lowered over
 * it. Between the last two a robot arm at TEST scans each laptop and ticks it
 * off. At the end of the line a gantry lifts each box off the belt and stacks
 * it in storage, two high, and a jointed robot arm picks the boxes off the
 * stack and packs them into a truck in two neat rows of three. Full, the truck
 * drives off behind the words of the hero and up behind the bar along the top
 * of the page, and the next truck, in another colour, pulls in. Clicking the
 * factory drops in an idea.
 *
 * It is drawn in layers, one SVG over another in the same view box, stacked in
 * the order they are painted, so a thing on the belt really goes into a
 * machine, is seen through its glass, and comes out of the other side.
 * Everything that moves is moved by its CSS translate where it can be, so its
 * wobbling edges are not redrawn; only the loading arm, whose joints bend, is
 * drawn afresh as it moves.
 */

// ── the view, and moving within it ──────────────────────────────────────
const VB = { x: 40, y: 50, w: 712, h: 556 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
/** A shift on screen, in view box units, as a CSS translate of a layer the size of the view. */
const shift = (dx: number, dy: number) => `${((dx / VB.w) * 100).toFixed(3)}% ${((dy / VB.h) * 100).toFixed(3)}%`;
/** The shift on screen of a move in the scene: dx along x, dy along y, dz up. */
const move = (dx: number, dy: number, dz = 0) => shift(COS * (dx - dy), (dx + dy) / 2 - dz);
/** The same, in view box units, for an SVG transform. */
const moveBy = (dx: number, dy: number, dz = 0) => `translate(${(COS * (dx - dy)).toFixed(2)} ${((dx + dy) / 2 - dz).toFixed(2)})`;
const percentOf = ([x, y]: Point) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`;
const smooth = (k: number) => k * k * (3 - 2 * k);

// ── the line, in the scene's own units: y along the belt, x across it, z up ──
const BELT = { y0: -286, y1: 244, half: 26, z: 34 };
const FRAME = { half: 30, h: 30 };
const FLOOR = { x0: -98, x1: 132, y0: -332, y1: 270 };
/** Where the ideas drop onto the belt, and from how high. */
const SPAWN_Y = -282;
const FALL_FROM = 64;
/** How far a thing on the belt reaches either way along it, at its biggest. */
const REACH = 20;
/**
 * The machines, in order along the belt. Each is a tunnel the belt runs right through: an open frame at either end,
 * a wall along the far side, glass along the near one, and a roof.
 */
const MACHINES = [
  { key: "design", label: "DESIGN", y0: -238, y1: -154, tone: { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" } },
  { key: "build", label: "BUILD", y0: -110, y1: -26, tone: { top: "#f5dfd5", left: "#ecc9b9", right: "#e2b5a1" } },
  { key: "ship", label: "SHIP", y0: 70, y1: 154, tone: TONES.paper },
] as const;
type Machine = (typeof MACHINES)[number];
const HALF = 34; // either side of the belt
const PORTAL = 10; // the depth of the frame at each end
const LINTEL = 84; // the top of the opening
const ROOF = 112;
/**
 * Where along each machine its tool works: a little way in, not in the middle. Seen from above and to the right, what
 * is in the second half of a tunnel is behind the post of the frame at its far end; what is in the first half is seen
 * through the glass.
 */
const WORK_AT = 26;
const work = (m: { y0: number }) => m.y0 + WORK_AT;
/** Where the robot arm scans what goes by. */
const TEST_Y = 22;
/** Where boxes wait at the end of the belt for the gantry, and the storage it stacks them in: three across, two high. */
const PICK_Y = 228;
const STORE = { xs: [52, 74, 96], layers: 2, table: 10 };
const STORE_SLOTS = STORE.xs.length * STORE.layers;
/** The gantry's gripper, when it holds a box on the belt: its underside just over the box. */
const GRIP_Z = BELT.z + 19;
/** The jointed arm that loads the trucks: where its shoulder is, the length of each link, and where it rests. */
const SHOULDER = { x: 74, y: 255, z: 28 };
const ARM = { upper: 50, fore: 46, hand: 12 };
type Arm = { x: number; y: number; z: number };
const REST: Arm = { x: 82, y: 244, z: 76 };
/** Where a truck waits to be loaded, and the six places in its bed: three along it, two across. */
const BAY = { x: 16, y: 294 };
/** The places in the bed in the order they are filled, which is the order they are painted: the furthest first. */
const SLOTS: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [2, 0],
  [1, 1],
  [2, 1],
];
const ALONG = [-1, 20, 41];
const ACROSS = [-11.5, 11.5];
/** Where a place in the bed is, as the truck stands in the bay facing along −x, or once it has turned to face along −y. */
const slotAt = ([a, b]: [number, number], facing: "x" | "y") => (facing === "x" ? { x: BAY.x + ALONG[a], y: BAY.y + ACROSS[b] } : { x: BAY.x + ACROSS[b], y: BAY.y + ALONG[a] });

const BELT_TONE: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
const KRAFT: Tone = { top: "#ecbea9", left: "#e2b5a1", right: "#de9372" };
const LAPTOP: Tone = { top: "#e6e8e3", left: "#d3d6d0", right: "#b9bdb6" };
const FLOOR_TONE: Tone = { top: "#eceee9", left: "#dcded8", right: "#cfd2cb" };
const STEEL: Tone = { top: "#b8bcb5", left: "#9a9f98", right: "#7c817a" };
const INSIDE: Tone = { top: "#9a9f98", left: "#7c817a", right: "#6b706a" };
const SIENNA: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const PENCIL: Tone = { top: "#f5dfd5", left: "#de9372", right: "#d0714c" };
const NOTES = ["#e2e9da", "#f5dfd5", "#fafaf7"];
const IDEAS = ["FOLIUM", "GRAPHFORGE", "NEURACACHE", "HIREME", "FOCUSFLOW", "BUGISTAN", "BID ENGINE", "ROUTINE"];
/** The trucks, which take turns: each its own colour. */
const TRUCKS: Tone[] = [SIENNA, { top: "#b1c29f", left: "#9caf88", right: "#80966b" }, { top: "#9a9f98", left: "#7c817a", right: "#5e625c" }];

// ── the timing ──────────────────────────────────────────────────────────
const INTRO = 3200;
const DELAY = 450;
const SPEED = 44; // along the belt, units a second
const SPAWN_EVERY = 1900;
const FALL = 420;
const SLAT = 16;
const POOL = 12;
const GAP = 40; // the least room between two things on the belt
const DRIVE = 220; // a truck's speed, units a second
const ARRIVE = 1300;
/** How far before the middle of a machine a thing is when the machine's tool starts on it. */
const LEAD = 10;
/** Where the line is already running when the factory is built: things along the belt, boxes in storage and in the truck. */
const SEED = { belt: [-240, -170, -100, -40, 30, 100, 170], stored: 2, loaded: 2 };

// ── the tools at work: each a set of moves of its layer, starting as a thing reaches LEAD before the middle ──
const PEN_UP = 16;
const PRESS_DOWN = 34;
const DROP_DOWN = 38;
/** Where along the belt the thing under the tool is, `t` seconds after the tool starts: the pen follows it. */
const riding = (t: number) => SPEED * t;
const TOOL_MOVES: { frames: Keyframe[]; ms: number }[] = [
  // DESIGN: the pen comes down on the idea, scribbles along with it, and lifts
  {
    ms: 1000,
    frames: [
      { offset: 0, translate: move(0, 0, 0) },
      { offset: 0.15, translate: move(0, riding(0.15), -PEN_UP) },
      ...[-7, 7, -7, 7, -5, 3].map((dx, k) => ({ offset: 0.25 + k * 0.1, translate: move(dx, riding(0.25 + k * 0.1), -PEN_UP) })),
      { offset: 0.85, translate: move(0, riding(0.85), 0) },
      { offset: 1, translate: move(0, 0, 0) },
    ],
  },
  // BUILD: the press comes down hard, holds as the thing goes on under it, and goes back up
  {
    ms: 900,
    frames: [
      { offset: 0, translate: move(0, 0, 0), easing: "cubic-bezier(0.6, 0, 1, 1)" },
      { offset: 0.25, translate: move(0, 0, -PRESS_DOWN) },
      { offset: 0.36, translate: move(0, riding(0.1), -PRESS_DOWN), easing: "ease-in-out" },
      { offset: 1, translate: move(0, 0, 0) },
    ],
  },
  // SHIP: the box is lowered over the laptop and let go, and the next is fed down from the roof
  {
    ms: 800,
    frames: [
      { offset: 0, translate: move(0, 0, 0), opacity: 1, easing: "ease-in" },
      { offset: 0.28, translate: move(0, 0, -DROP_DOWN), opacity: 1 },
      { offset: 0.29, translate: move(0, 0, -DROP_DOWN), opacity: 0 },
      { offset: 0.5, translate: move(0, 0, 34), opacity: 0 },
      { offset: 0.51, translate: move(0, 0, 34), opacity: 1, easing: "ease-out" },
      { offset: 1, translate: move(0, 0, 0), opacity: 1 },
    ],
  },
];

/** The top of the belt, as a window in percent of the view: the slats are seen through it. */
const BELT_CLIP = `polygon(${topFace(-BELT.half, BELT.half, BELT.y0, BELT.y1, BELT.z)
  .map(percentOf)
  .join(", ")})`;

/**
 * The layers, bottom to top. What is on the belt moves between them as it goes: under the first machine before it
 * gets there, inside it (over its far wall, under its tool and its glass), over it once it is out, and so on.
 */
const LAYER = { base: 1, slats: 2, hopper: 4, steam: 14, test: 16, store: 22, hoist: 23, trolley: 24, front: 25, chart: 26 };
const MACHINE_LAYERS = [
  { back: 5, tool: 7, front: 8 },
  { back: 10, tool: 12, front: 13 },
  { back: 17, tool: 19, front: 20 },
];
/** The layer for what is on the belt, by how many of the boundaries below it has passed. */
const ZONE_LAYERS = [3, 6, 9, 11, 15, 18, 21];
/** In at a machine once its middle is through the frame at the start; out once all of it is past the frame at the end. */
const ZONES = MACHINES.flatMap((m) => [m.y0 + PORTAL / 2, m.y1 + REACH]);

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

/** How the loading arm stands with its wrist at `w`: its shoulder turned towards it, and its elbow bent up to reach. */
function armPose(w: Arm) {
  const s = SHOULDER;
  const dx = w.x - s.x;
  const dy = w.y - s.y;
  const r = Math.max(0.001, Math.hypot(dx, dy));
  const h = w.z - s.z;
  const d = Math.min(ARM.upper + ARM.fore - 0.5, Math.hypot(r, h));
  const lift = Math.atan2(h, r) + Math.acos(Math.min(1, (ARM.upper ** 2 + d ** 2 - ARM.fore ** 2) / (2 * ARM.upper * d)));
  const reach = ARM.upper * Math.cos(lift);
  const e = { x: s.x + (dx / r) * reach, y: s.y + (dy / r) * reach, z: s.z + ARM.upper * Math.sin(lift) };
  const g = w.z - ARM.hand;
  const [S, E, W] = [at(s.x, s.y, s.z), at(e.x, e.y, e.z), at(w.x, w.y, w.z)];
  return {
    links: {
      upper: line(S, E),
      fore: line(E, W),
      // the wrist, a bar across and a finger down either side of the box it holds
      hand: `${line(W, at(w.x, w.y, g))}${line(at(w.x, w.y - 12.5, g - 9), at(w.x, w.y - 12.5, g), at(w.x, w.y + 12.5, g), at(w.x, w.y + 12.5, g - 9))}`,
    },
    joints: [S, E, W],
    box: moveBy(w.x, w.y, g - 19),
  };
}

/** A layer: one SVG the size of the view, stacked at `z`. */
function Layer({ z, className, style, children, layerRef }: { z: number; className?: string; style?: CSSProperties; children: ReactNode; layerRef?: (el: SVGSVGElement | null) => void }) {
  return (
    <svg ref={layerRef} viewBox={VIEW} className={`${styles.layer} ${className ?? ""}`} style={{ zIndex: z * 100, ...style }} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** A box, the size of a place in a truck's bed, standing on z: 20 along x and 22 along y, or turned the other way. */
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
  // the boxes in its bed, in rows, painted furthest first: between its far walls and its near ones
  const boxes = SLOTS.map((slot, k) => {
    const p = slotAt(slot, facing);
    return (
      <g key={k} ref={cargo(k)} visibility="hidden">
        <Parcel x={p.x} y={p.y} z={16} along={facing} label={false} />
      </g>
    );
  });
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
        {boxes}
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
      {boxes}
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

/**
 * A machine's parts behind whatever is inside it: the wall along its far side, the frame of the opening the belt goes
 * in at, and the far post of the frame it comes out of.
 */
function MachineBack({ m }: { m: Machine }) {
  return (
    <g filter="url(#desk-card)">
      <Block x0={-HALF} x1={-HALF + 4} y0={m.y0} y1={m.y1} z={0} h={ROOF} tone={INSIDE} r={3} />
      <Block x0={-HALF} x1={-BELT.half} y0={m.y0} y1={m.y0 + PORTAL} z={0} h={ROOF} tone={m.tone} r={3} />
      <Block x0={BELT.half} x1={HALF} y0={m.y0} y1={m.y0 + PORTAL} z={0} h={ROOF} tone={m.tone} r={3} />
      <Block x0={-HALF} x1={HALF} y0={m.y0} y1={m.y0 + PORTAL} z={LINTEL} h={ROOF - LINTEL} tone={m.tone} r={3} />
      <Block x0={-HALF} x1={-BELT.half} y0={m.y1 - PORTAL} y1={m.y1} z={0} h={ROOF} tone={m.tone} r={3} />
    </g>
  );
}

/** A machine's parts in front of whatever is inside it: the glass along its near side, the rest of the frame the belt comes out of, and the roof. */
function MachineFront({ m }: { m: Machine }) {
  const [i0, i1] = [m.y0 + PORTAL, m.y1 - PORTAL];
  return (
    <>
      <g filter="url(#desk-card)">
        <Block x0={HALF - 4} x1={HALF} y0={i0} y1={i1} z={0} h={BELT.z - 4} tone={m.tone} r={2} />
      </g>
      {/* the glass, and the light on it */}
      <path d={poly(...sideFace(HALF, i0, i1, BELT.z - 4, ROOF))} fill="#eef3e8" fillOpacity={0.2} stroke="rgba(45,47,43,0.4)" strokeWidth={1.1} strokeLinejoin="round" />
      <g stroke="#fafaf7" strokeOpacity={0.8} strokeLinecap="round">
        <path d={line(at(HALF, i0 + 6, ROOF - 8), at(HALF, i0 + 24, BELT.z + 4))} strokeWidth={2.6} />
        <path d={line(at(HALF, i0 + 16, ROOF - 8), at(HALF, i0 + 28, BELT.z + 30))} strokeWidth={1.2} />
      </g>
      <g filter="url(#desk-card)">
        <Block x0={BELT.half} x1={HALF} y0={m.y1 - PORTAL} y1={m.y1} z={0} h={ROOF} tone={m.tone} r={3} />
        <Block x0={-HALF} x1={HALF} y0={m.y1 - PORTAL} y1={m.y1} z={LINTEL} h={ROOF - LINTEL} tone={m.tone} r={3} />
        <Block x0={-HALF - 2} x1={HALF + 2} y0={m.y0 - 2} y1={m.y1 + 2} z={ROOF} h={16} tone={m.tone} r={8} />
      </g>
      {/* a fringe of strips over the way out */}
      {Array.from({ length: 5 }, (_, k) => (
        <Detail key={k} d={line(at(-BELT.half + 5 + k * 10.5, m.y1, LINTEL), at(-BELT.half + 5 + k * 10.5, m.y1, LINTEL - 6))} stroke="#7c817a" width={2.6} />
      ))}
      {/* its name, along the edge of the roof */}
      <Detail d={rounded(sideFace(HALF + 2, m.y0 + 8, m.y1 - 8, ROOF + 3, ROOF + 13), 3)} fill="#fafaf7" />
      <text transform={onSide(at(HALF + 2, m.y1 - 14, ROOF + 5.5))} fontSize={9} fontWeight={700} letterSpacing={1.4} fill="#2d2f2b">
        {m.label}
      </text>
    </>
  );
}

/** The tool inside a machine, at rest over the belt where it works; hung from the roof on rods that go up into it. */
function Tool({ n, y }: { n: number; y: number }) {
  const rod = (x: number, ry: number, from: number) => <Detail d={line(at(x, ry, ROOF + 30), at(x, ry, from))} stroke="#7c817a" width={2.4} />;
  if (n === 0) {
    // DESIGN: a pen, waiting a little before where it works for the next idea
    const py = y - LEAD;
    const tip = BELT.z + 3 + PEN_UP;
    return (
      <>
        {rod(0, py, tip + 30)}
        <g filter="url(#desk-chip)">
          <Block x0={-4.5} x1={4.5} y0={py - 4.5} y1={py + 4.5} z={tip + 8} h={22} tone={SIENNA} r={2} width={1.1} />
        </g>
        <Detail d={poly(at(0, py, tip), at(-4.5, py + 4.5, tip + 8), at(4.5, py + 4.5, tip + 8), at(4.5, py - 4.5, tip + 8))} fill="#3b3d39" width={0.9} />
      </>
    );
  }
  if (n === 1) {
    // BUILD: a press
    const bottom = BELT.z + 4 + PRESS_DOWN;
    return (
      <>
        {rod(-11, y, bottom + 12)}
        {rod(11, y, bottom + 12)}
        <g filter="url(#desk-chip)">
          <Block x0={-18} x1={18} y0={y - 18} y1={y + 18} z={bottom} h={12} tone={SIENNA} r={4} width={1.1} />
        </g>
      </>
    );
  }
  // SHIP: a box, hung ready to be lowered
  const bottom = BELT.z + DROP_DOWN;
  return (
    <>
      {rod(0, y, bottom + 18)}
      <Parcel y={y} z={bottom} label={false} />
    </>
  );
}

/** What is on the belt, and where it is. */
type Item = { on: boolean; y: number; dz: number; stage: number; state: "fall" | "belt"; t: number; zone: number; rank: number; scanned: boolean; worked: number };
/** A truck, and where it is on its round: coming in, waiting to be loaded, or driving off (first along −x, then along −y). */
type Lorry = { state: "away" | "arriving" | "loading" | "leaving"; t: number; loaded: number; leg1: number; leg2: number; facing: "x" | "y" };
/** A robot, easing from where it was to each of its moves in turn, and doing what each says on arriving. */
type Move<T> = { to: T; ms: number; then?: () => void };
type Robot<T> = { at: T; from: T; moves: Move<T>[]; t: number };
/** A place in storage: empty, a box on its way in, a box, or a box about to be taken. */
type Slot = "empty" | "in" | "full" | "out";

export default function Factory({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const items = useRef<(SVGSVGElement | null)[]>([]);
  const tools = useRef<(SVGSVGElement | null)[]>([]);
  const lights = useRef<(SVGSVGElement | null)[]>([]);
  const trucks = useRef<(SVGSVGElement | null)[]>([]);
  const faces = useRef<{ x: SVGGElement | null; y: SVGGElement | null }[]>(TRUCKS.map(() => ({ x: null, y: null })));
  const cargo = useRef<{ x: (SVGGElement | null)[]; y: (SVGGElement | null)[] }[]>(TRUCKS.map(() => ({ x: [], y: [] })));
  const stored = useRef<(SVGGElement | null)[]>([]);
  const hoist = useRef<SVGSVGElement>(null);
  const trolley = useRef<SVGSVGElement>(null);
  const hoistBox = useRef<SVGGElement>(null);
  const loaderLayer = useRef<SVGSVGElement>(null);
  const scanner = useRef<SVGSVGElement>(null);
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
    const state: Item[] = Array.from({ length: POOL }, () => ({ on: false, y: 0, dz: 0, stage: 0, state: "belt", t: 0, zone: -1, rank: -1, scanned: false, worked: 0 }));
    const lorries: Lorry[] = TRUCKS.map((_, n) => ({ state: n === 0 ? "loading" : "away", t: 0, loaded: 0, leg1: 0, leg2: 0, facing: "x" }));
    const slots: Slot[] = Array.from({ length: STORE_SLOTS }, () => "empty");
    let spawned = 0;

    // ── drawing ──
    const look = (i: number, next: number) => {
      items.current[i]?.querySelectorAll<SVGGElement>("[data-stage]").forEach((g) => g.setAttribute("visibility", g.dataset.stage === String(next) ? "visible" : "hidden"));
      state[i].stage = next;
    };
    const place = (i: number) => {
      const svg = items.current[i];
      const it = state[i];
      if (!svg) return;
      svg.style.translate = move(0, it.y, it.dz);
      // its layer, and within the layer, further along is painted later
      const zone = ZONES.filter((y) => it.y >= y).length;
      const rank = Math.floor((it.y - BELT.y0) / 8);
      if (zone !== it.zone || rank !== it.rank) {
        Object.assign(it, { zone, rank });
        svg.style.zIndex = String(ZONE_LAYERS[zone] * 100 + rank);
      }
    };
    const pulse = (el: Element | null | undefined) => {
      if (!el) return;
      el.removeAttribute("data-go");
      void el.getBoundingClientRect();
      el.setAttribute("data-go", "");
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
    const showStore = () => stored.current.forEach((g, k) => g?.setAttribute("visibility", slots[k] === "full" || slots[k] === "out" ? "visible" : "hidden"));
    /** Where the top of a box in a place in storage is. */
    const storeAt = (k: number) => ({ x: STORE.xs[k % STORE.xs.length], top: STORE.table + 18 * (Math.floor(k / STORE.xs.length) + 1) });

    // ── the gantry over the end of the belt: its trolley runs along x, and its hoist goes up and down ──
    const gantry: Robot<{ x: number; z: number }> = { at: { x: 0, z: GRIP_Z + 28 }, from: { x: 0, z: GRIP_Z + 28 }, moves: [], t: 0 };
    const putGantry = () => {
      if (trolley.current) trolley.current.style.translate = move(gantry.at.x, 0);
      if (hoist.current) hoist.current.style.translate = move(gantry.at.x, 0, gantry.at.z - GRIP_Z);
    };
    const gantryHolds = (on: boolean) => hoistBox.current?.setAttribute("visibility", on ? "visible" : "hidden");

    // ── the jointed arm between the storage and the bay: its wrist is steered, and the rest of it follows ──
    const loader: Robot<Arm> & { holding: boolean } = { at: { ...REST }, from: { ...REST }, moves: [], t: 0, holding: false };
    const layer = loaderLayer.current;
    const links = layer ? Array.from(layer.querySelectorAll<SVGPathElement>("[data-link]")) : [];
    const joints = layer ? Array.from(layer.querySelectorAll<SVGCircleElement>("[data-joint]")) : [];
    const carried = layer?.querySelector<SVGGElement>("[data-carried]");
    const drawArm = () => {
      const pose = armPose(loader.at);
      links.forEach((path) => path.setAttribute("d", pose.links[path.dataset.link as keyof typeof pose.links]));
      joints.forEach((dot) => {
        const [x, y] = pose.joints[Number(dot.dataset.joint)];
        dot.setAttribute("cx", x.toFixed(1));
        dot.setAttribute("cy", y.toFixed(1));
      });
      carried?.setAttribute("transform", pose.box);
    };
    const armHolds = (on: boolean) => {
      loader.holding = on;
      carried?.setAttribute("visibility", on ? "visible" : "hidden");
    };

    /** Steps a robot along its moves. */
    const run = <T extends Record<string, number>>(robot: Robot<T>, dt: number, apply: () => void) => {
      const next = robot.moves[0];
      if (!next) return;
      if (robot.t === 0) robot.from = { ...robot.at };
      robot.t += dt;
      const k = smooth(Math.min(1, robot.t / next.ms));
      robot.at = Object.fromEntries(Object.keys(next.to).map((key) => [key, robot.from[key] + (next.to[key] - robot.from[key]) * k])) as T;
      apply();
      if (robot.t >= next.ms) {
        robot.moves.shift();
        robot.t = 0;
        next.then?.();
      }
    };

    const name = (i: number) => {
      const label = IDEAS[spawned++ % IDEAS.length];
      items.current[i]?.querySelectorAll("[data-label]").forEach((text) => (text.textContent = label));
    };
    const spawn = () => {
      const i = state.findIndex((it) => !it.on);
      if (i < 0) return false;
      // room under the hopper
      if (state.some((it) => it.on && it.y < SPAWN_Y + GAP)) return false;
      Object.assign(state[i], { on: true, y: SPAWN_Y, dz: FALL_FROM, state: "fall", t: 0, zone: -1, rank: -1, scanned: false, worked: 0 });
      name(i);
      look(i, 0);
      place(i);
      items.current[i]?.setAttribute("data-on", "");
      return true;
    };
    /** Puts a thing on the belt at y, as far along the line as it would be there. */
    const seed = (y: number) => {
      const i = state.findIndex((it) => !it.on);
      const spots = MACHINES.map(work);
      Object.assign(state[i], { on: true, y, dz: 0, state: "belt", t: 0, zone: -1, rank: -1, scanned: y >= TEST_Y, worked: spots.filter((w) => y >= w - LEAD).length });
      name(i);
      look(i, spots.filter((w) => y >= w).length);
      place(i);
      const svg = items.current[i];
      svg?.setAttribute("data-on", "");
      if (!reduced) svg?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out" });
    };

    // the line as it stands when built: things along the belt, a couple of boxes in storage and in the first truck
    SEED.belt.forEach(seed);
    for (let k = 0; k < SEED.stored; k++) slots[k] = "full";
    lorries[0].loaded = SEED.loaded;
    lorries.forEach((l, n) => {
      face(n, "x");
      moveTruck(n, l.state === "away" ? 300 : 0, 0, l.state === "away" ? 0 : 1);
      showCargo(n, l.loaded);
    });
    showStore();
    putGantry();
    gantryHolds(false);
    drawArm();
    armHolds(false);
    if (reduced) return;

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

    const step = (dt: number) => {
      clock += dt;
      if (clock >= SPAWN_EVERY && spawn()) clock = 0;

      // the things on the belt, front first, so each keeps its distance behind the one ahead; the first waits at the end
      const order = state
        .map((_, i) => i)
        .filter((i) => state[i].on)
        .sort((a, b) => state[b].y - state[a].y);
      let ahead = Infinity;
      for (const i of order) {
        const it = state[i];
        it.t += dt;
        if (it.state === "fall") {
          const k = Math.min(1, it.t / FALL);
          it.dz = FALL_FROM * (1 - k * k);
          if (k >= 1) Object.assign(it, { state: "belt", dz: 0, t: 0 });
        } else {
          it.y = Math.min(it.y + (SPEED * dt) / 1000, ahead - GAP, PICK_Y);
          // inside each machine, its tool starts on the thing just before it gets there, and there it becomes the next thing
          MACHINES.forEach((m, n) => {
            const w = work(m);
            if (it.worked === n && it.y >= w - LEAD) {
              it.worked = n + 1;
              tools.current[n]?.animate(TOOL_MOVES[n].frames, { duration: TOOL_MOVES[n].ms });
              pulse(lights.current[n]);
            }
            if (it.stage === n && it.y >= w) look(i, n + 1);
          });
          // the robot arm ticks it off as it passes under
          if (!it.scanned && it.y >= TEST_Y) {
            it.scanned = true;
            pulse(tick.current);
          }
        }
        ahead = it.y;
        place(i);
      }
      const scan = state.some((it) => it.on && Math.abs(it.y - TEST_Y) < 22);
      if (scan !== scanning) {
        scanning = scan;
        scanner.current?.toggleAttribute("data-working", scan);
      }

      // the gantry: when a box waits at the end of the belt and there is a place for it, it lifts it across and stacks it
      if (!gantry.moves.length) {
        const i = state.findIndex((it) => it.on && it.state === "belt" && it.y >= PICK_Y - 0.5);
        const k = slots.findIndex((s, k) => s === "empty" && (k < STORE.xs.length || slots[k - STORE.xs.length] === "full"));
        if (i >= 0 && k >= 0) {
          slots[k] = "in";
          const { x, top } = storeAt(k);
          const high = GRIP_Z + 30;
          gantry.moves = [
            { to: { x: 0, z: GRIP_Z }, ms: 240 },
            {
              to: { x: 0, z: GRIP_Z },
              ms: 60,
              then: () => {
                state[i].on = false;
                items.current[i]?.removeAttribute("data-on");
                gantryHolds(true);
              },
            },
            { to: { x: 0, z: high }, ms: 230 },
            { to: { x, z: high }, ms: 360 },
            {
              to: { x, z: top + 1 },
              ms: 240,
              then: () => {
                gantryHolds(false);
                slots[k] = "full";
                showStore();
              },
            },
            { to: { x, z: GRIP_Z + 28 }, ms: 200 },
            { to: { x: 0, z: GRIP_Z + 28 }, ms: 340 },
          ];
        }
      }
      run(gantry, dt, putGantry);

      // the arm: when there is a box on top of the stack and a truck in the bay with room, it packs the box into its next place
      if (!loader.moves.length) {
        const n = lorries.findIndex((l) => l.state === "loading" && l.loaded < SLOTS.length);
        let k = -1;
        for (let j = STORE_SLOTS - 1; j >= 0 && k < 0; j--) if (slots[j] === "full" && (j + STORE.xs.length >= STORE_SLOTS || slots[j + STORE.xs.length] === "empty")) k = j;
        if (n >= 0 && k >= 0) {
          const lorry = lorries[n];
          slots[k] = "out";
          const { x, top } = storeAt(k);
          const pick = { x, y: PICK_Y, z: top + 1 + ARM.hand };
          const into = slotAt(SLOTS[lorry.loaded], "x");
          const put = { x: into.x, y: into.y, z: 16 + 18 + 1 + ARM.hand };
          loader.moves = [
            { to: { ...pick, z: pick.z + 26 }, ms: 300 },
            {
              to: pick,
              ms: 180,
              then: () => {
                slots[k] = "empty";
                showStore();
                armHolds(true);
              },
            },
            { to: { ...pick, z: pick.z + 30 }, ms: 180 },
            { to: { ...put, z: put.z + 30 }, ms: 400 },
            {
              to: put,
              ms: 200,
              then: () => {
                armHolds(false);
                lorry.loaded++;
                showCargo(n, lorry.loaded);
              },
            },
            { to: { ...put, z: put.z + 28 }, ms: 170 },
          ];
        } else if (Math.hypot(loader.at.x - REST.x, loader.at.y - REST.y, loader.at.z - REST.z) > 1) {
          loader.moves = [{ to: REST, ms: 420 }];
        }
      }
      run(loader, dt, drawArm);

      // the trucks
      lorries.forEach((lorry, n) => {
        lorry.t += dt;
        if (lorry.state === "loading" && lorry.loaded >= SLOTS.length && !loader.holding) {
          // full: off it goes, and the next truck comes in
          Object.assign(lorry, { state: "leaving", t: -300, ...route(), facing: "x" });
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
          const go = (DRIVE * lorry.t) / 1000;
          const eased = go < 40 ? (go * go) / 80 : go - 20;
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
  const postLamp = (x: number, y: number) => (
    <g key={`${x}-${y}`} filter="url(#desk-chip)">
      <Block x0={x - 2} x1={x + 2} y0={y - 2} y1={y + 2} z={0} h={108} tone={STEEL} r={1.5} width={1} />
      <Block x0={x - 2} x1={x + 16} y0={y - 3} y1={y + 3} z={106} h={5} tone={STEEL} r={2} width={1} />
      <Block x0={x + 10} x1={x + 20} y0={y - 6} y1={y + 6} z={98} h={9} tone={PENCIL} r={3} width={1} />
    </g>
  );
  const rest = armPose(REST);

  return (
    <div className={`${styles.root} ${className ?? ""}`} onClick={() => drop.current()}>
      <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""}`} aria-hidden="true">
        {/* ── the floor, the belt, and everything that stands behind the line ── */}
        <svg viewBox={VIEW} className={styles.base} style={{ zIndex: LAYER.base * 100 }} focusable="false">
          <g style={drawn(0, 0.1)} filter="url(#desk-card)">
            <Block x0={FLOOR.x0} x1={FLOOR.x1} y0={FLOOR.y0} y1={FLOOR.y1} z={-8} h={8} tone={FLOOR_TONE} r={26} />
          </g>
          {/* a walkway painted on the floor */}
          <g style={drawn(0.08, 0.12)}>
            <Detail d={line(at(66, FLOOR.y0 + 24, 0), at(66, 180, 0))} stroke="#b8bcb5" width={1.6} />
            <Detail d={line(at(104, FLOOR.y0 + 24, 0), at(104, 180, 0))} stroke="#b8bcb5" width={1.6} />
          </g>
          <g style={drawn(0.02, 0.12)} filter="url(#desk-card)">
            <Block x0={-FRAME.half} x1={FRAME.half} y0={BELT.y0} y1={BELT.y1} z={0} h={FRAME.h} tone={TONES.concrete} r={10} />
          </g>
          <g style={drawn(0.08, 0.16)} filter="url(#desk-ink)">
            <Block x0={-BELT.half} x1={BELT.half} y0={BELT.y0} y1={BELT.y1} z={FRAME.h} h={BELT.z - FRAME.h} tone={BELT_TONE} r={7} width={1.2} />
          </g>
          {/* rollers along the frame */}
          <g style={drawn(0.14, 0.18, 0.05)}>
            {Array.from({ length: 12 }, (_, i) => (
              <Detail key={i} d={rounded(sideFace(FRAME.half, BELT.y0 + 26 + i * 44, BELT.y0 + 30 + i * 44, 12, 16), 2)} fill="#9a9f98" width={0.8} />
            ))}
          </g>
          {/* the hopper's post, the lamps, and the robot arm's column at TEST: all behind the belt */}
          <g style={drawn(0.16, 0.22)} filter="url(#desk-chip)">
            <Block x0={-44} x1={-36} y0={-300} y1={-292} z={0} h={96} tone={TONES.concrete} r={3} width={1.1} />
          </g>
          <g style={drawn(0.18, 0.24)}>{postLamp(-58, -46)}</g>
          <g style={drawn(0.3, 0.36)} filter="url(#desk-card)">
            <Block x0={-78} x1={-50} y0={TEST_Y - 14} y1={TEST_Y + 14} z={0} h={12} tone={TONES.dark} r={5} />
            <Block x0={-70} x1={-58} y0={TEST_Y - 6} y1={TEST_Y + 6} z={12} h={90} tone={STEEL} r={4} />
          </g>
        </svg>

        {/* the belt's slats: a layer slid along under a window the shape of the belt, so nothing is redrawn as it runs */}
        <div className={styles.window} style={{ clipPath: BELT_CLIP, zIndex: LAYER.slats * 100 }}>
          <Layer z={LAYER.slats} className={`${styles.slats} ${deskStyles.fade}`} style={{ ...slatShift, ...between(0.2, 0.06) }}>
            <g stroke="#7c817a" strokeWidth={1.4} strokeLinecap="round">
              {Array.from({ length: Math.ceil((BELT.y1 - BELT.y0) / SLAT) + 2 }, (_, i) => {
                const y = BELT.y0 - SLAT + i * SLAT;
                return <path key={i} d={line(at(-BELT.half, y, BELT.z), at(BELT.half, y, BELT.z))} />;
              })}
            </g>
          </Layer>
        </div>

        {/* ── what is on the belt: each thing in a layer of its own, moved between the machines' layers as it goes ── */}
        {Array.from({ length: POOL }, (_, i) => (
          <Layer
            key={i}
            z={ZONE_LAYERS[0]}
            className={`${styles.item} ${styles.moving}`}
            layerRef={(el) => {
              items.current[i] = el;
            }}
          >
            <Things index={i} />
          </Layer>
        ))}

        {/* ── the hopper the ideas drop out of, fed from a thought cloud ── */}
        <Layer z={LAYER.hopper}>
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
            <g transform={`translate(${at(0, -288, 176)[0].toFixed(1)} ${at(0, -288, 176)[1].toFixed(1)})`} filter="url(#desk-chip)">
              <path d="M-30 6c-8 0-11-9-4-13-2-9 9-14 15-8 3-9 17-9 20 0 6-5 16 0 13 8 7 3 5 13-3 13Z" fill="#fafaf7" stroke="rgba(45,47,43,0.5)" strokeWidth={1.3} />
              <g fill="none" stroke="#bc4e26" strokeWidth={1.3} strokeLinecap="round" transform="translate(-4 -12)">
                <path d="M4 12c-2.2-1.6-3.3-3.4-3.3-5.5a4.3 4.3 0 0 1 8.6 0c0 2.1-1.1 3.9-3.3 5.5ZM4 14h2.2" />
              </g>
            </g>
          </Part>
        </Layer>

        {/* ── the three machines: behind the belt, the tool at work inside, and the glass, frame and roof in front ── */}
        {MACHINES.map((m, n) => {
          const start = 0.26 + n * 0.08;
          const mid = (m.y0 + m.y1) / 2;
          const arrival = { lift: 60, from: start, span: 0.12 };
          const [lx, ly] = at(HALF, m.y1 - PORTAL / 2, 60);
          return [
            <Layer key={`${m.key}-back`} z={MACHINE_LAYERS[n].back}>
              <Part arrival={arrival} style={drawn(start - 0.02, start + 0.08)}>
                <MachineBack m={m} />
              </Part>
            </Layer>,
            <Layer
              key={`${m.key}-tool`}
              z={MACHINE_LAYERS[n].tool}
              className={styles.moving}
              layerRef={(el) => {
                tools.current[n] = el;
              }}
            >
              <Part arrival={arrival} style={drawn(start + 0.02, start + 0.1)}>
                <Tool n={n} y={work(m)} />
              </Part>
            </Layer>,
            <Layer key={`${m.key}-front`} z={MACHINE_LAYERS[n].front}>
              <Part arrival={arrival} style={drawn(start, start + 0.1)}>
                <MachineFront m={m} />
                {n === 0 && (
                  // on DESIGN's roof, a big pencil
                  <g filter="url(#desk-chip)">
                    <Block x0={-5} x1={5} y0={mid - 5} y1={mid + 5} z={ROOF + 16} h={34} tone={PENCIL} r={2} width={1.1} />
                    <Block x0={-5} x1={5} y0={mid - 5} y1={mid + 5} z={ROOF + 50} h={6} tone={TONES.concrete} r={2} width={1} />
                  </g>
                )}
                {n === 1 && (
                  // on BUILD's roof, a chimney
                  <g filter="url(#desk-chip)">
                    <Block x0={-24} x1={-12} y0={m.y0 + 8} y1={m.y0 + 20} z={ROOF + 16} h={34} tone={TONES.concrete} r={4} width={1.1} />
                  </g>
                )}
                {n === 2 && (
                  // on SHIP's roof, the box feeder
                  <g filter="url(#desk-chip)">
                    <Block x0={-13} x1={13} y0={mid - 16} y1={mid + 16} z={ROOF + 16} h={14} tone={KRAFT} r={4} width={1.1} />
                  </g>
                )}
              </Part>
            </Layer>,
            // a light on the frame the belt comes out of, which flashes as the tool works
            <Layer
              key={`${m.key}-light`}
              z={MACHINE_LAYERS[n].front}
              className={`${styles.lamp} ${deskStyles.fade}`}
              style={between(start + 0.1, 0.05)}
              layerRef={(el) => {
                lights.current[n] = el;
              }}
            >
              <circle cx={lx} cy={ly} r={3} stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
            </Layer>,
          ];
        })}

        {/* BUILD's chimney, smoking */}
        <Layer z={LAYER.steam} className={styles.steam}>
          {[0, 1, 2].map((k) => {
            const [x, y] = at(-18, MACHINES[1].y0 + 14, ROOF + 56);
            return <circle key={k} cx={x} cy={y} r={6 + k * 1.5} fill="#fafaf7" stroke="rgba(45,47,43,0.35)" strokeWidth={1} style={{ animationDelay: `${k * -0.9}s` }} />;
          })}
        </Layer>

        {/* ── TEST: the robot arm, reaching out over the belt with its scanner ── */}
        <Layer z={LAYER.test} className={`${styles.moving} ${styles.arm}`} layerRef={(el) => void (scanner.current = el)}>
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
        <Layer z={LAYER.test} className={styles.tick} layerRef={(el) => void (tick.current = el)}>
          <g transform={`translate(${at(0, TEST_Y, 128)[0].toFixed(1)} ${at(0, TEST_Y, 128)[1].toFixed(1)})`}>
            <circle r={8} fill="#9caf88" stroke="rgba(45,47,43,0.55)" strokeWidth={1.1} />
            <path d="M-3.5 0.2 -1 2.8 3.8 -2.6" fill="none" stroke="#fafaf7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </Layer>

        {/* ── the end of the line: the storage table and what is stacked on it, the gantry over them, and the loading arm's turntable ── */}
        <Layer z={LAYER.store}>
          <Part arrival={{ lift: 40, from: 0.5, span: 0.12 }} style={drawn(0.48, 0.58)}>
            <g filter="url(#desk-card)">
              <Block x0={38} x1={110} y0={PICK_Y - 14} y1={PICK_Y + 14} z={0} h={STORE.table} tone={{ top: "#e2b5a1", left: "#d0a58f", right: "#c0947f" }} r={3} />
              <Block x0={62} x1={86} y0={SHOULDER.y - 12} y1={SHOULDER.y + 12} z={0} h={8} tone={TONES.dark} r={6} />
              <Block x0={66} x1={82} y0={SHOULDER.y - 8} y1={SHOULDER.y + 8} z={8} h={SHOULDER.z - 8} tone={SIENNA} r={7} />
            </g>
            {Array.from({ length: STORE_SLOTS }, (_, k) => (
              <g
                key={k}
                ref={(el) => {
                  stored.current[k] = el;
                }}
                visibility="hidden"
              >
                <Parcel x={STORE.xs[k % STORE.xs.length]} y={PICK_Y} z={STORE.table + 18 * Math.floor(k / STORE.xs.length)} label={false} />
              </g>
            ))}
            <g filter="url(#desk-chip)">
              <Block x0={-54} x1={-46} y0={PICK_Y - 5} y1={PICK_Y + 5} z={0} h={112} tone={STEEL} r={3} width={1.1} />
              <Block x0={116} x1={124} y0={PICK_Y - 5} y1={PICK_Y + 5} z={0} h={112} tone={STEEL} r={3} width={1.1} />
              <Block x0={-54} x1={124} y0={PICK_Y - 5} y1={PICK_Y + 5} z={112} h={8} tone={STEEL} r={3} width={1.1} />
            </g>
            <text transform={onFront(at(70, PICK_Y + 5, 118.5))} fontSize={6} fontWeight={700} letterSpacing={1.2} fill="#3b3d39">
              STORE
            </text>
          </Part>
        </Layer>
        {/* the gantry's hoist: a mast through the trolley, its gripper, and the box it carries */}
        <Layer z={LAYER.hoist} className={styles.moving} layerRef={(el) => void (hoist.current = el)}>
          <Part arrival={{ lift: 40, from: 0.52, span: 0.12 }} style={drawn(0.5, 0.6)}>
            <g filter="url(#desk-chip)">
              <Block x0={-2.5} x1={2.5} y0={PICK_Y - 2.5} y1={PICK_Y + 2.5} z={GRIP_Z + 4} h={80} tone={STEEL} r={1.5} width={1} />
              <Block x0={-12} x1={12} y0={PICK_Y - 13} y1={PICK_Y + 13} z={GRIP_Z} h={4} tone={TONES.dark} r={2} width={1} />
            </g>
            <g ref={hoistBox} visibility="hidden">
              <Parcel y={PICK_Y} z={GRIP_Z - 19} label={false} />
            </g>
          </Part>
        </Layer>
        <Layer z={LAYER.trolley} className={styles.moving} layerRef={(el) => void (trolley.current = el)}>
          <Part arrival={{ lift: 40, from: 0.52, span: 0.12 }} style={drawn(0.5, 0.6)}>
            <g filter="url(#desk-chip)">
              <Block x0={-10} x1={10} y0={PICK_Y - 9} y1={PICK_Y + 9} z={106} h={18} tone={SIENNA} r={4} width={1.1} />
            </g>
          </Part>
        </Layer>

        {/* ── the floor in front of the line: the control desk, the tank piped into BUILD, and pallets of boxes ── */}
        <Layer z={LAYER.front}>
          <Part arrival={{ lift: 40, from: 0.44, span: 0.12 }} style={drawn(0.42, 0.52)}>
            <g filter="url(#desk-card)">
              <Block x0={52} x1={90} y0={-212} y1={-172} z={0} h={34} tone={TONES.concrete} r={6} />
              <Block x0={58} x1={64} y0={-206} y1={-178} z={34} h={26} tone={TONES.dark} r={3} width={1.1} />
              <Block x0={56} x1={94} y0={-86} y1={-48} z={0} h={72} tone={{ top: "#e2e9da", left: "#cbd7bd", right: "#b1c29f" }} r={18} />
            </g>
            {[20, 46].map((z) => (
              <Detail key={z} d={line(at(94, -82, z), at(94, -52, z))} width={1.6} stroke="#80966b" />
            ))}
            <text transform={onSide(at(94, -54, 62))} fontSize={7} fontWeight={700} letterSpacing={0.8} fill="#4c5e3e">
              COFFEE
            </text>
            {[
              [74, -204],
              [82, -194],
              [74, -184],
            ].map(([x, y], k) => (
              <Detail key={k} d={rounded(topFace(x - 2.5, x + 2.5, y - 2.5, y + 2.5, 34), 1.5)} fill={["#d0714c", "#9caf88", "#f4f4f0"][k]} width={0.9} />
            ))}
            <Wire d={bend([at(56, -68, 22), at(44, -68, 22), at(HALF, -68, 22)], 6)} width={4} colour="#9a9f98" light="#d2d5cf" />
            <g filter="url(#desk-chip)">
              <Block x0={50} x1={94} y0={96} y1={140} z={0} h={6} tone={{ top: "#e2b5a1", left: "#d0a58f", right: "#c0947f" }} r={2} width={1.1} />
            </g>
            {[
              [62, 108, 6],
              [82, 108, 6],
              [62, 128, 6],
              [82, 128, 6],
              [72, 118, 24],
            ].map(([x, y, z]) => (
              <g key={`${x}-${y}-${z}`}>
                <Parcel x={x} y={y} z={z} along="y" label={false} />
              </g>
            ))}
          </Part>
        </Layer>
        <Layer z={LAYER.chart} className={deskStyles.fade} style={between(0.56, 0.05)}>
          <g transform={onSide(at(64, -180, 58))}>
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
          style={{ zIndex: 30, opacity: n === 0 ? undefined : 0 }}
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

      {/* ── the loading arm, over the trucks as it reaches into them: drawn afresh from its joints as it moves ── */}
      <svg ref={loaderLayer} viewBox={VIEW} className={`${styles.layer} ${deskStyles.fade}`} style={{ zIndex: 31, ...between(0.62, 0.06) }} aria-hidden="true" focusable="false">
        <g data-carried="" transform={rest.box} visibility="hidden">
          <Parcel z={0} label={false} />
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {(
            [
              ["upper", 8.5, "#9caf88"],
              ["fore", 7, "#b1c29f"],
            ] as const
          ).map(([link, width, colour]) => (
            <g key={link}>
              <path data-link={link} d={rest.links[link]} stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={width + 2.6} />
              <path data-link={link} d={rest.links[link]} stroke={colour} strokeWidth={width} />
              <path data-link={link} d={rest.links[link]} stroke="#fafaf7" strokeOpacity={0.55} strokeWidth={2} transform={`translate(0 ${(-width / 4).toFixed(1)})`} />
            </g>
          ))}
          <path data-link="hand" d={rest.links.hand} stroke="#3b3d39" strokeWidth={2.6} />
        </g>
        {[6, 5, 4].map((r, k) => (
          <circle key={k} data-joint={k} cx={rest.joints[k][0]} cy={rest.joints[k][1]} r={r} fill={k ? "#f4f4f0" : "#de9372"} stroke="rgba(45,47,43,0.6)" strokeWidth={1.2} />
        ))}
      </svg>
    </div>
  );
}
