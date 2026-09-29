"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { at, bend, between, Block, COS, CY, Detail, drawn, frontFace, line, onFront, onSide, onTop, Part, poly, rounded, sideFace, topFace, TONES, Wire, type Point, type Tone } from "@/components/desk/iso";
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
 * off.
 *
 * Two robot arms stand at the end of the belt. The first lifts each box off the
 * belt and stacks it at the right side of the belt, two high; the second takes
 * the boxes off the stack and carries them into the warehouse. A robot on
 * wheels, with an arm of its own, takes them from the warehouse and drives them
 * one at a time to the truck, and packs it, six boxes to a truck, in two rows
 * of three. Full, the truck drives off behind the words of the hero and up
 * behind the bar along the top of the page, and the next truck, in another
 * colour, pulls in. Clicking the factory drops in an idea.
 *
 * It is drawn in layers, one SVG over another in the same view box, stacked in
 * the order they are painted, so a thing on the belt really goes into a
 * machine, is seen through its glass, and comes out of the other side.
 * Everything that moves is moved by its CSS translate where it can be, so its
 * wobbling edges are not redrawn; the robot arms, whose joints bend, are drawn
 * afresh from their pose as they move, each part a shaded block.
 */

// ── the view, and moving within it ──────────────────────────────────────
const VB = { x: 16, y: -300, w: 970, h: 960 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
/** A shift on screen, in view box units, as a CSS translate of a layer the size of the view. */
const shift = (dx: number, dy: number) => `${((dx / VB.w) * 100).toFixed(3)}% ${((dy / VB.h) * 100).toFixed(3)}%`;
/** The shift on screen of a move in the scene: dx along x, dy along y, dz up. */
const move = (dx: number, dy: number, dz = 0) => shift(COS * (dx - dy), (dx + dy) / 2 - dz);
/** The same, in view box units, for an SVG transform. */
const moveBy = (dx: number, dy: number, dz = 0) => `translate(${(COS * (dx - dy)).toFixed(2)} ${((dx + dy) / 2 - dz).toFixed(2)})`;
const percentOf = ([x, y]: Point) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`;
const smooth = (k: number) => k * k * (3 - 2 * k);

// ── points in the scene ─────────────────────────────────────────────────
type V3 = { x: number; y: number; z: number };
const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const plus = (a: V3, b: V3) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const minus = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const times = (a: V3, k: number) => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const unit = (a: V3) => times(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const flat = (p: V3) => at(p.x, p.y, p.z);
const above = (p: V3, by: number) => v3(p.x, p.y, p.z + by);
/** How near the viewer a point is: the viewer looks down from along x, y and z at once. */
const depthOf = (p: V3) => p.x + p.y + p.z;

// ── the line, in the scene's own units: y along the belt, x across it, z up ──
const BELT = { y0: -300, y1: 140, half: 26, z: 34 };
const FRAME = { half: 30, h: 30 };
const FLOOR = { x0: -130, x1: 236, y0: -350, y1: 250 };
/** Where the ideas drop onto the belt, and from how high. */
const SPAWN_Y = -296;
const FALL_FROM = 64;
/** How far a thing on the belt reaches either way along it, at its biggest. */
const REACH = 20;
/**
 * The machines, in order along the belt. Each is a tunnel the belt runs right through: an open frame at either end,
 * a wall along the far side, glass along the near one, and a roof.
 */
const MACHINES = [
  { key: "design", label: "DESIGN", y0: -256, y1: -172, tone: { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" } },
  { key: "build", label: "BUILD", y0: -140, y1: -56, tone: { top: "#f5dfd5", left: "#ecc9b9", right: "#e2b5a1" } },
  { key: "ship", label: "SHIP", y0: 12, y1: 96, tone: TONES.paper },
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
const TEST_Y = -22;
/** Where a box waits at the end of the belt to be lifted off. */
const PICK_Y = 122;

// ── the end of the line ─────────────────────────────────────────────────
/** A box is 18 high; a gripper holding one has its wrist this far over the bottom of the box. */
const BOX_H = 18;
const HAND = 14;
const GRIP = BOX_H + 1 + HAND;
/**
 * The end of the line is a row to the right of the belt's end: the stack at the side of the belt (three across, two
 * high, on a low table), then the warehouse (three bays, two high), with an arm standing behind each gap to work
 * across it. The robot on wheels runs along a lane in front of the row, between the warehouse and the truck.
 */
const STAGE = { xs: [63, 85, 107], y: 132, table: 10, layers: 2, x0: 50, x1: 120 };
const STORE = { xs: [163, 185, 207], y: 132, floor: 4, layers: 2, x0: 150, x1: 220, y0: 116, y1: 148 };
const LANE = 170;
const ROVER = { x: 120, deck: 20, shoulder: 34, speed: 280 };
/** Where a truck waits to be loaded, and the six places in its bed: three along it, two across. */
const BAY = { x: -30, y: 212 };
/** The places in the bed in the order they are painted: the furthest first. */
const SLOTS: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [2, 0],
  [1, 1],
  [2, 1],
];
/** The order the robot fills them in: the row nearer it first, then the other, each from the cab back. */
const FILL = [0, 1, 3, 2, 4, 5];
const ALONG = [-1, 20, 41];
const ACROSS = [-11.5, 11.5];
/** Which way a truck faces: along −x as it waits and drives off, along −y once it has turned, and along +x on its way down to the server. */
type Facing = "x" | "y" | "X";
const FACINGS: Facing[] = ["x", "y", "X"];
/** Where a place in the bed is, as the truck stands in the bay, facing each way. */
const slotAt = ([a, b]: [number, number], facing: Facing) =>
  facing === "x" ? { x: BAY.x + ALONG[a], y: BAY.y + ACROSS[b] } : facing === "X" ? { x: BAY.x - ALONG[a], y: BAY.y + ACROSS[b] } : { x: BAY.x + ACROSS[b], y: BAY.y + ALONG[a] };

// ── the live server ─────────────────────────────────────────────────────
/**
 * The live server the truck takes the apps to, at the top right of the picture: three racks on a raised floor, and a
 * lane in front of them for a robot on wheels, with an arm, that deploys the boxes into them. The truck comes along a
 * road in front of it all and turns up into the dock to the right of the racks, its tail to the robot's lane.
 */
const RACK = { x0: -262, y0: -716, y1: -680, w: 40, h: 170, n: 3 };
const DEPLOY_LEVELS = [14, 50, 86];
const DEPLOY_SLOTS = RACK.n * DEPLOY_LEVELS.length;
/** The slots the robot deploys into: across the racks, three high. */
const deploySlot = (k: number) => ({ x: RACK.x0 + RACK.w / 2 + RACK.w * (k % RACK.n), z: DEPLOY_LEVELS[Math.floor(k / RACK.n)] });
/** Where the truck stands at the server, facing along −y, its bed towards the robot's lane; and the road in front. */
const DOCK = { x: -90, y: -716 };
const ROAD_Y = -596;
/** The robot's lane, in front of the racks and behind the truck's tail, and where it waits on it. */
const BOT = { x: -150, y: -638, deck: 20, shoulder: 34, speed: 240 };

// ── colours ─────────────────────────────────────────────────────────────
const BELT_TONE: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
const KRAFT: Tone = { top: "#ecbea9", left: "#e2b5a1", right: "#de9372" };
const LAPTOP: Tone = { top: "#e6e8e3", left: "#d3d6d0", right: "#b9bdb6" };
const FLOOR_TONE: Tone = { top: "#eceee9", left: "#dcded8", right: "#cfd2cb" };
const STEEL: Tone = { top: "#b8bcb5", left: "#9a9f98", right: "#7c817a" };
const INSIDE: Tone = { top: "#9a9f98", left: "#7c817a", right: "#6b706a" };
const SIENNA: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const PENCIL: Tone = { top: "#f5dfd5", left: "#de9372", right: "#d0714c" };
const SAGE: Tone = { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" };
const SAGE_DEEP: Tone = { top: "#b1c29f", left: "#9caf88", right: "#80966b" };
const GRIPPER: Tone = { top: "#7c817a", left: "#5e625c", right: "#4a4d48" };
const WOOD: Tone = { top: "#e2b5a1", left: "#d0a58f", right: "#c0947f" };
const NOTES = ["#e2e9da", "#f5dfd5", "#fafaf7"];
const IDEAS = ["FOLIUM", "GRAPHFORGE", "NEURACACHE", "HIREME", "FOCUSFLOW", "BUGISTAN", "BID ENGINE", "ROUTINE"];
/** The truck, which goes round and round: from the factory to the server and back. */
const TRUCKS: Tone[] = [SIENNA];

// ── the timing ──────────────────────────────────────────────────────────
const INTRO = 3200;
const DELAY = 450;
const SPEED = 44; // along the belt, units a second
const SPAWN_EVERY = 3000;
const FALL = 420;
const SLAT = 16;
const POOL = 12;
const GAP = 40; // the least room between two things on the belt
const DRIVE = 220; // a truck's speed, units a second
const ARRIVE = 1300;
/** How far before where a machine's tool works a thing is when the tool starts on it. */
const LEAD = 10;
/** Where the line is already running when the factory is built: things along the belt, boxes stacked, stored and loaded. */
const SEED = { belt: [-268, -195, -150, -80, -10, 60, PICK_Y], staged: 2, stored: 3, loaded: 5, deploys: 37, live: 5 };

// ── the tools at work: each a set of moves of its layer, starting as a thing reaches LEAD before where it works ──
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
const LAYER = { server: 0, base: 1, slats: 2, hopper: 4, test: 16, front: 22, chart: 23, armsBack: 24, stage: 25, store: 26, armsFront: 27, rover: 28, smoke: 29 };

/** The pipe on each machine's roof that smoke comes out of: where it stands, how thick it is, and how tall. */
const PIPES = MACHINES.map((m, n) => (n === 1 ? { x: -18, y: m.y0 + 14, w: 12, h: 34 } : { x: -22, y: m.y0 + 11, w: 8, h: n === 0 ? 30 : 24 }));
/** A puff of smoke: a little cloud, standing on its flat bottom. */
const PUFF = "M-14 0c-6 0-7-8-1.5-9.5 0-6.5 8-9 12-4.5 2.5-5.5 11-5 12.5 1 5.5-.5 8 6 3.5 9.5-.5 3.5-2 3.5-4 3.5Z";
const MACHINE_LAYERS = [
  { back: 5, tool: 7, front: 8 },
  { back: 10, tool: 12, front: 13 },
  { back: 17, tool: 19, front: 20 },
];
/** The layer for what is on the belt, by how many of the boundaries below it has passed. */
const ZONE_LAYERS = [3, 6, 9, 11, 15, 18, 21];
/** In at a machine once its middle is through the frame at the start; out once all of it is past the frame at the end. */
const ZONES = MACHINES.flatMap((m) => [m.y0 + PORTAL / 2, m.y1 + REACH]);

// ── the robot arms ──────────────────────────────────────────────────────

/** A robot arm: the length and thickness of its two links, its turret, and its colours. */
type Rig = { upper: number; fore: number; widths: [number, number]; turret: { base: number; w: number; tone: Tone }; tone: Tone; joints: [number, number, number]; hub: string };
/** The arm at the belt's end that stacks the boxes at the side of it. */
const STACKER: Rig = { upper: 56, fore: 52, widths: [13, 11], turret: { base: 8, w: 20, tone: SIENNA }, tone: SAGE, joints: [8, 7, 5.5], hub: "#d0714c" };
const STACKER_AT = v3(52, 104, 30);
const STACKER_REST = v3(30, 112, 92);
/** The arm beside it that takes the boxes off the stack into the warehouse. */
const SHELVER: Rig = { upper: 56, fore: 52, widths: [13, 11], turret: { base: 8, w: 20, tone: SAGE_DEEP }, tone: STEEL, joints: [8, 7, 5.5], hub: "#80966b" };
const SHELVER_AT = v3(138, 102, 30);
const SHELVER_REST = v3(148, 114, 94);
/** The arm on the robot with wheels. */
const ROVER_ARM: Rig = { upper: 44, fore: 40, widths: [10, 9], turret: { base: ROVER.deck, w: 14, tone: TONES.dark }, tone: TONES.paper, joints: [6.5, 5.5, 4.5], hub: "#d0714c" };
/** The arm on the robot at the live server. */
const BOT_ARM: Rig = { upper: 56, fore: 52, widths: [12, 10], turret: { base: BOT.deck, w: 16, tone: TONES.dark }, tone: { top: "#e2e9da", left: "#cbd7bd", right: "#b1c29f" }, joints: [7, 6, 5], hub: "#d0714c" };
/** How the robot on wheels carries a box as it drives: its wrist over its deck. */
const CARRY = { wx: -6, wy: 0, wz: 44 };

type Face = { d: string; fill: string };
const NO_FACE: Face = { d: "", fill: "none" };

/**
 * A block from a to b, `w` across and `t` through, and turned about its length so that its width lies level (or along
 * `across`, if it stands upright): the faces of it the viewer sees, shaded by which way each one faces.
 */
function beam(a: V3, b: V3, w: number, t: number, tone: Tone, across = v3(1, 0, 0)): Face[] {
  const d = unit(minus(b, a));
  let h = cross(d, v3(0, 0, 1));
  if (Math.hypot(h.x, h.y, h.z) < 0.25) h = across;
  h = unit(minus(h, times(d, dot(h, d))));
  const u = cross(h, d);
  const H = times(h, w / 2);
  const U = times(u, t / 2);
  const c = (p: V3, sh: number, su: number) => flat(plus(plus(p, times(H, sh)), times(U, su)));
  const faces: [V3, Point[]][] = [
    [u, [c(a, 1, 1), c(b, 1, 1), c(b, -1, 1), c(a, -1, 1)]],
    [times(u, -1), [c(a, 1, -1), c(b, 1, -1), c(b, -1, -1), c(a, -1, -1)]],
    [h, [c(a, 1, 1), c(b, 1, 1), c(b, 1, -1), c(a, 1, -1)]],
    [times(h, -1), [c(a, -1, 1), c(b, -1, 1), c(b, -1, -1), c(a, -1, -1)]],
    [d, [c(b, 1, 1), c(b, -1, 1), c(b, -1, -1), c(b, 1, -1)]],
    [times(d, -1), [c(a, 1, 1), c(a, -1, 1), c(a, -1, -1), c(a, 1, -1)]],
  ];
  const shown: Face[] = faces
    .filter(([n]) => n.x + n.y + n.z > 0.02)
    .map(([n, points]) => ({ d: rounded(points, 1.4), fill: n.z > 0.55 ? tone.top : n.y > n.x ? tone.left : tone.right }));
  while (shown.length < 3) shown.push(NO_FACE);
  return shown.slice(0, 3);
}

/** A part of a robot arm, and how near the viewer it is: the parts are painted furthest first. */
type RigPart = { key: string; depth: number; faces?: Face[]; joint?: { c: Point; r: number }; box?: string };

/**
 * A robot arm with its shoulder at `s` and its wrist at `w`: its turret turned to face the wrist, its upper arm lifted
 * and its elbow bent so the two links reach it, and its gripper hanging from the wrist with a finger either side of
 * the box it holds.
 */
function rigParts(rig: Rig, s: V3, w: V3): RigPart[] {
  const dx = w.x - s.x;
  const dy = w.y - s.y;
  const r = Math.hypot(dx, dy);
  const dir = r > 0.5 ? { x: dx / r, y: dy / r } : { x: -1, y: 0 };
  const rise = w.z - s.z;
  const span = Math.min(rig.upper + rig.fore - 0.5, Math.max(Math.abs(rig.upper - rig.fore) + 1, Math.hypot(r, rise)));
  const lift = Math.atan2(rise, r) + Math.acos(Math.min(1, Math.max(-1, (rig.upper ** 2 + span ** 2 - rig.fore ** 2) / (2 * rig.upper * span))));
  const out = rig.upper * Math.cos(lift);
  const e = v3(s.x + dir.x * out, s.y + dir.y * out, s.z + rig.upper * Math.sin(lift));
  const g = w.z - HAND;
  const foot = v3(s.x, s.y, rig.turret.base);
  const finger = (y: number) => beam(v3(w.x, y, g), v3(w.x, y, g - 10), 8, 2.5, GRIPPER);
  return [
    { key: "turret", depth: depthOf(foot), faces: beam(foot, above(s, rig.turret.w * 0.3), rig.turret.w, rig.turret.w, rig.turret.tone, v3(-dir.y, dir.x, 0)) },
    { key: "upper", depth: depthOf(times(plus(s, e), 0.5)), faces: beam(s, e, rig.widths[0], rig.widths[0], rig.tone) },
    { key: "fore", depth: depthOf(times(plus(e, w), 0.5)), faces: beam(e, w, rig.widths[1], rig.widths[1], rig.tone) },
    { key: "hand", depth: depthOf(v3(w.x, w.y, g + 4)), faces: [...beam(w, v3(w.x, w.y, g + 3), 8, 8, GRIPPER), ...beam(v3(w.x, w.y - 14, g + 1.5), v3(w.x, w.y + 14, g + 1.5), 9, 3, GRIPPER)] },
    { key: "far", depth: depthOf(v3(w.x, w.y - 12.5, g - 5)), faces: finger(w.y - 12.5) },
    { key: "near", depth: depthOf(v3(w.x, w.y + 12.5, g - 5)), faces: finger(w.y + 12.5) },
    { key: "box", depth: depthOf(v3(w.x, w.y, g - 10)), box: moveBy(w.x, w.y, g - 1 - BOX_H) },
    ...[s, e, w].map((p, k) => ({ key: `j${k}`, depth: depthOf(p) + 12, joint: { c: flat(p), r: rig.joints[k] } })),
  ];
}

/**
 * The parts of an arm standing behind the stacks it works over, which are drawn behind them: its turret, its upper arm
 * and its shoulder. The rest of it, which reaches over the stacks, is drawn in front of them.
 */
const BACK_PARTS = ["turret", "upper", "j0"];

/**
 * Keeps the drawing of a robot arm in step with its pose: its parts redrawn, and put back in painting order when that
 * changes. Its parts may be split between layers (see BACK_PARTS); each layer keeps its own order.
 */
function rigDrawing(svgs: (SVGSVGElement | null)[], rig: Rig) {
  const holders = svgs.flatMap((svg) => svg?.querySelector<SVGGElement>("[data-rig]") ?? []);
  const groups = new Map<string, SVGGElement>();
  holders.forEach((holder) => holder.querySelectorAll<SVGGElement>(":scope > [data-part]").forEach((g) => groups.set(g.dataset.part ?? "", g)));
  const paths = new Map([...groups].map(([key, g]) => [key, Array.from(g.querySelectorAll<SVGPathElement>(":scope > path"))]));
  let order = "";
  return {
    draw(s: V3, w: V3) {
      const parts = rigParts(rig, s, w);
      for (const part of parts) {
        const g = groups.get(part.key);
        part.faces?.forEach((face, k) => {
          const path = paths.get(part.key)?.[k];
          path?.setAttribute("d", face.d);
          path?.setAttribute("fill", face.fill);
        });
        if (part.joint) g?.firstElementChild?.setAttribute("transform", `translate(${part.joint.c[0].toFixed(1)} ${part.joint.c[1].toFixed(1)})`);
        if (part.box) g?.firstElementChild?.setAttribute("transform", part.box);
      }
      const sorted = parts.sort((a, b) => a.depth - b.depth).map((part) => part.key);
      const next = sorted.join();
      if (next !== order) {
        order = next;
        for (const holder of holders) holder.append(...sorted.flatMap((key) => (groups.get(key)?.parentNode === holder ? (groups.get(key) ?? []) : [])));
      }
    },
    hold(on: boolean) {
      groups.get("box")?.setAttribute("display", on ? "inline" : "none");
    },
  };
}

/** A robot arm as first drawn, before it moves: the same parts the script redraws, in painting order; or some of them. */
function RigShape({ rig, s, w, only }: { rig: Rig; s: V3; w: V3; only?: (key: string) => boolean }) {
  const parts = rigParts(rig, s, w)
    .filter((part) => !only || only(part.key))
    .sort((a, b) => a.depth - b.depth);
  return (
    <g data-rig="">
      {parts.map((part) => (
        <g key={part.key} data-part={part.key} display={part.box ? "none" : undefined}>
          {part.faces?.map((face, k) => (
            <path key={k} d={face.d} fill={face.fill} stroke="rgba(45,47,43,0.62)" strokeWidth={1} strokeLinejoin="round" />
          ))}
          {part.joint && (
            <g transform={`translate(${part.joint.c[0].toFixed(1)} ${part.joint.c[1].toFixed(1)})`}>
              <circle r={part.joint.r} fill="#fafaf7" stroke="rgba(45,47,43,0.62)" strokeWidth={1.1} />
              <circle r={part.joint.r * 0.42} fill={rig.hub} />
            </g>
          )}
          {part.box && (
            <g transform={part.box}>
              <Parcel z={0} label={false} />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

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
        <Block x0={x - hx} x1={x + hx} y0={y - hy} y1={y + hy} z={z} h={BOX_H} tone={KRAFT} r={2.5} width={1.1} />
      </g>
      <path d={poly(...(along === "x" ? topFace(x - hx, x + hx, y - 2.4, y + 2.4, z + BOX_H) : topFace(x - 2.4, x + 2.4, y - hy, y + hy, z + BOX_H)))} fill="#d0714c" fillOpacity={0.75} />
      {label && <path d={rounded(sideFace(x + hx, y - 7, y + 8, z + 5, z + 12.5), 1.5)} fill="#fafaf7" stroke="rgba(45,47,43,0.4)" strokeWidth={0.6} />}
    </>
  );
}

/** A group of boxes shown one at a time as they are put there: the places in a stack, `cols` across and two high. */
function Stack({ xs, y, z, groupRef }: { xs: number[]; y: number; z: number; groupRef: (k: number) => (el: SVGGElement | null) => void }) {
  return (
    <>
      {Array.from({ length: xs.length * 2 }, (_, k) => (
        <g key={k} ref={groupRef(k)} display="none">
          <Parcel x={xs[k % xs.length]} y={y} z={z + BOX_H * Math.floor(k / xs.length)} label={false} />
        </g>
      ))}
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
      <g data-stage="1" display="none" transform={bigger}>
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
      <g data-stage="2" display="none" transform={bigger}>
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
      <g data-stage="3" display="none">
        <Parcel />
        <text data-label="" transform={onSide(at(10, 7, z + 7.4))} fontSize={3.8} fontWeight={700} fill="#2d2f2b" textLength={13} lengthAdjust="spacingAndGlyphs">
          IDEA
        </text>
      </g>
    </g>
  );
}

/** A truck, standing at the loading bay: facing along −x as it waits and drives off, along −y once it has turned, or along +x on its way down to the server. */
function Truck({ tone, facing, cargo }: { tone: Tone; facing: Facing; cargo: (k: number) => (el: SVGGElement | null) => void }) {
  const { x: cx, y: cy } = BAY;
  const glass = "#cbd7bd";
  // the boxes in its bed, in rows, painted furthest first: between its far walls and its near ones
  const boxes = SLOTS.map((slot, k) => ({ k, ...slotAt(slot, facing) }))
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .map(({ k, x, y }) => (
      <g key={k} ref={cargo(k)} display="none">
        <Parcel x={x} y={y} z={16} along={facing === "y" ? "y" : "x"} label={false} />
      </g>
    ));
  const wheel = (x: number, y: number, side: "front" | "side") => (
    <g key={`${x}-${y}`} transform={side === "front" ? onFront(at(x, y, 8)) : onSide(at(x, y, 8))}>
      <circle r={8} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1.2} />
      <circle r={3.2} fill="#b8bcb5" />
    </g>
  );
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
        {[cx - 28, cx + 40].map((x) => wheel(x, cy + 26, "front"))}
      </>
    );
  }
  if (facing === "X") {
    return (
      <>
        <g filter="url(#desk-card)">
          <Block x0={cx - 56} x1={cx + 12} y0={cy - 26} y1={cy + 26} z={8} h={8} tone={TONES.concrete} r={5} />
          <Block x0={cx - 56} x1={cx + 12} y0={cy - 26} y1={cy - 23} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
          <Block x0={cx - 56} x1={cx - 53} y0={cy - 26} y1={cy + 26} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
        </g>
        {boxes}
        <g filter="url(#desk-card)">
          <Block x0={cx - 56} x1={cx + 12} y0={cy + 23} y1={cy + 26} z={16} h={12} tone={TONES.paper} r={2} width={1.1} />
          <Block x0={cx + 12} x1={cx + 44} y0={cy - 24} y1={cy + 24} z={8} h={42} tone={tone} r={9} />
        </g>
        <Detail d={rounded(sideFace(cx + 44, cy - 17, cy + 17, 30, 44), 3)} fill={glass} />
        <Detail d={rounded(frontFace(cx + 18, cx + 38, 30, 44, cy + 24), 3)} fill={glass} />
        <Detail d={rounded(topFace(cx + 20, cx + 36, cy - 10, cy + 10, 50), 3)} fill="#fafaf7" />
        <text transform={onFront(at(cx - 50, cy + 26, 25))} y={1} fontSize={6.5} fontWeight={700} letterSpacing={1} fill="#5e625c">
          SHIPPED ✓
        </text>
        {[cx - 40, cx + 28].map((x) => wheel(x, cy + 26, "front"))}
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
      {[cy - 28, cy + 40].map((y) => wheel(cx + 26, y, "side"))}
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
      {rod(0, y, bottom + BOX_H)}
      <Parcel y={y} z={bottom} label={false} />
    </>
  );
}

/** A wheel of the robot, standing on the floor at (x, y), with a spoke that turns as it drives. */
function Wheel({ x, y }: { x: number; y: number }) {
  return (
    <g transform={onFront(at(x, y, 6))}>
      <circle r={6} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1.1} />
      <path className={styles.spoke} d="M-3.6 0H3.6M0 -3.6V3.6" stroke="#b8bcb5" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}

/**
 * The live server: three racks of servers on a raised floor, their lights blinking. Each rack has its name and vents
 * at the top, a screen saying how it is doing, a row of drive bays, and three slots the robot deploys into, dark until
 * a box goes in and a server blade lights up there. On the roof, a tray of cables, a cooling unit with its fan turning,
 * a second fan, an antenna sending, and a sign across the front that says it is live and counts the deploys; on the
 * side, a monitor with the uptime; cables running off across the floor; and the dock marked out on the right.
 */
function ServerRoom({ blade, counter, badge, signal }: { blade: (k: number) => (el: SVGGElement | null) => void; counter: (el: SVGTextElement | null) => void; badge: (el: SVGGElement | null) => void; signal: (el: SVGGElement | null) => void }) {
  const { x0, y0, y1, w, h, n } = RACK;
  const x1 = x0 + n * w;
  const dark: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
  const floor: Tone = { top: "#e6e8e3", left: "#d3d6d0", right: "#b9bdb6" };
  const colours = ["#9caf88", "#de9372", "#fafaf7"];
  const pad = { x0: x0 - 16, x1: x1 + 10, y0: y0 - 13, y1: BOT.y + 18 };
  const names = ["API", "DB", "AI"];
  const status = ["200 OK", "p99 42ms", "CPU 31%"];
  /** A light on the front of a rack, blinking in its own time. */
  const led = (x: number, z: number, k: number, fast = false) => {
    const [cx, cy] = at(x, y1, z);
    return (
      <circle
        key={`${x}-${z}`}
        className={styles.led}
        cx={cx.toFixed(1)}
        cy={cy.toFixed(1)}
        r={1.3}
        fill={colours[k % 3]}
        style={{ animationDuration: `${fast ? 0.45 : 1.1 + (k % 4) * 0.35}s`, animationDelay: `${-((k * 0.37) % 1.7).toFixed(2)}s` }}
      />
    );
  };
  const [dishX, dishY] = at(x0 + w + 20, y0 + 11, h + 36);
  const [badgeX, badgeY] = at(x0 + (n * w) / 2, y1, h + 50);
  const fan = (x: number, y: number, z: number, r: number) => (
    <g transform={onTop(at(x, y, z))}>
      <circle r={r} fill="#d3d6d0" stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
      <path className={styles.fan} d="M0 0C1.5-3 5-4.5 6-2.5ZM0 0C3 1.5 4.5 5 2.5 6ZM0 0C-1.5 3-5 4.5-6 2.5ZM0 0C-3-1.5-4.5-5-2.5-6Z" fill="#7c817a" transform={`scale(${(r / 7.5).toFixed(2)})`} />
    </g>
  );
  return (
    <>
      {/* the raised floor, tiled, with the robot's lane on it; and the dock marked out to the right */}
      <g filter="url(#desk-card)">
        <Block x0={pad.x0} x1={pad.x1} y0={pad.y0} y1={pad.y1} z={-6} h={6} tone={floor} r={10} />
      </g>
      <g stroke="#b9bdb6" strokeWidth={0.8}>
        {Array.from({ length: 8 }, (_, k) => pad.x0 + 18 + k * 18).map((x) => (
          <path key={`x${x}`} d={line(at(x, pad.y0 + 3, 0), at(x, pad.y1 - 3, 0))} />
        ))}
        {Array.from({ length: 5 }, (_, k) => pad.y0 + 18 + k * 18).map((y) => (
          <path key={`y${y}`} d={line(at(pad.x0 + 3, y, 0), at(pad.x1 - 3, y, 0))} />
        ))}
      </g>
      <path d={line(at(pad.x0 + 8, BOT.y, 0), at(pad.x1 - 6, BOT.y, 0))} fill="none" stroke="#de9372" strokeWidth={1.4} strokeDasharray="6 5" strokeLinecap="round" />
      <path d={rounded(topFace(DOCK.x - 34, DOCK.x + 34, DOCK.y - 52, DOCK.y + 66, 0), 6)} fill="none" stroke="#9a9f98" strokeWidth={1.4} strokeDasharray="5 5" />
      <text transform={onTop(at(DOCK.x + 22, DOCK.y + 56, 0))} fontSize={6.5} fontWeight={700} letterSpacing={1.2} fill="#9a9f98" className={deskStyles.fade} style={between(0.66, 0.05)}>
        DOCK
      </text>

      {/* the three racks */}
      <g filter="url(#desk-card)">
        {Array.from({ length: n }, (_, r) => (
          <Block key={r} x0={x0 + r * w} x1={x0 + (r + 1) * w} y0={y0} y1={y1} z={0} h={h} tone={dark} r={4} />
        ))}
      </g>
      {Array.from({ length: n }, (_, r) => {
        const rx = x0 + r * w;
        const xc = rx + w / 2;
        return (
          <g key={r}>
            <path d={rounded(frontFace(rx + 2, rx + w - 2, 3, h - 3, y1), 2)} fill="none" stroke="#7c817a" strokeWidth={0.8} />
            {/* the top unit: its name, its vents and its lights */}
            <path d={rounded(frontFace(rx + 4, rx + w - 4, h - 20, h - 5, y1), 1.5)} fill="#2d2f2b" />
            <text transform={onFront(at(rx + 6, y1, h - 16))} fontSize={4.6} fontWeight={700} letterSpacing={0.4} fill="#cfd2cb">
              {names[r]}-0{r + 1}
            </text>
            {[h - 8, h - 10.5, h - 13].map((z) => (
              <path key={z} d={line(at(rx + 24, y1, z), at(rx + w - 7, y1, z))} stroke="#7c817a" strokeWidth={0.9} />
            ))}
            {led(rx + 8, h - 9, r * 3)}
            {led(rx + 12, h - 9, r * 3 + 1)}
            {/* a screen with how it is doing */}
            <path d={rounded(frontFace(rx + 4, rx + w - 4, h - 40, h - 25, y1), 1.5)} fill="#26302a" stroke="rgba(45,47,43,0.6)" strokeWidth={0.7} />
            <text transform={onFront(at(rx + 7, y1, h - 35))} fontSize={5} fontWeight={700} letterSpacing={0.3} fill="#9caf88">
              {status[r]}
            </text>
            {/* a row of drive bays */}
            {[0, 1, 2, 3].map((k) => (
              <g key={k}>
                <path d={rounded(frontFace(rx + 5 + k * 8, rx + 11 + k * 8, h - 58, h - 45, y1), 1)} fill="#3b3d39" stroke="rgba(45,47,43,0.5)" strokeWidth={0.6} />
                {led(rx + 8 + k * 8, h - 48, r * 5 + k)}
              </g>
            ))}
            {/* the units between the slots, each with its row of lights */}
            {[4, 37, 73].map((z) => (
              <g key={z}>
                <path d={rounded(frontFace(rx + 4, rx + w - 4, z, z + 8, y1), 1)} fill="#3b3d39" />
                {[8, 12, 16, 20, 24].map((x, j) => led(rx + x, z + 4, r + z + j))}
                <path d={line(at(rx + 28, y1, z + 4), at(rx + w - 7, y1, z + 4))} stroke="#7c817a" strokeWidth={0.9} />
              </g>
            ))}
            {/* the slots the robot deploys into: dark, until a box goes in and a server blade lights up there */}
            {DEPLOY_LEVELS.map((lvl, l) => (
              <g key={lvl}>
                <path d={rounded(frontFace(xc - 11, xc + 11, lvl - 1, lvl + 19, y1), 1.5)} fill="#2d2f2b" stroke="rgba(45,47,43,0.6)" strokeWidth={0.8} />
                <g ref={blade(l * n + r)} className={styles.blade} display="none">
                  <path d={rounded(frontFace(xc - 10, xc + 10, lvl, lvl + 18, y1), 1.5)} fill="#e6e8e3" stroke="rgba(45,47,43,0.5)" strokeWidth={0.7} />
                  <path d={poly(...frontFace(xc - 10, xc + 10, lvl + 13, lvl + 16, y1))} fill="#9caf88" />
                  {[0, 1, 2].map((j) => (
                    <path key={j} d={line(at(xc - 7, y1, lvl + 3 + j * 3), at(xc + 2, y1, lvl + 3 + j * 3))} stroke="#b9bdb6" strokeWidth={0.8} />
                  ))}
                  {led(xc + 6, lvl + 9, l * n + r, true)}
                  {led(xc + 6, lvl + 5, l * n + r + 1, true)}
                </g>
              </g>
            ))}
          </g>
        );
      })}

      {/* on the side, a monitor with the uptime */}
      <path d={rounded(sideFace(x1, y0 + 4, y1 - 4, 52, 112), 3)} fill="#2d2f2b" stroke="rgba(45,47,43,0.6)" strokeWidth={1} />
      <g transform={onSide(at(x1, y1 - 7, 106))}>
        <text x={0} y={5} fontSize={4.6} fontWeight={700} fill="#9caf88">
          UPTIME
        </text>
        <text x={0} y={12.5} fontSize={6.5} fontWeight={700} fill="#fafaf7" textLength={21} lengthAdjust="spacingAndGlyphs">
          99.98%
        </text>
        <clipPath id="server-chart">
          <rect x={0} y={17} width={21} height={30} />
        </clipPath>
        <g clipPath="url(#server-chart)">
          <path className={styles.chart} d="M0 42 4 35 8 38 12 29 16 33 20 25 24 31 28 23 32 29 36 24 40 32 44 27 48 35" fill="none" stroke="#9caf88" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* cables off the side, down and away across the floor */}
      <Wire d={bend([at(x1, y0 + 12, 30), at(x1 + 6, y0 + 12, 30), at(x1 + 6, y0 + 12, 2), at(x1 + 6, BOT.y - 16, 2)], 4)} width={3} colour="#5e625c" light="#9a9f98" />
      <Wire d={bend([at(x1, y0 + 20, 40), at(x1 + 3, y0 + 20, 40), at(x1 + 3, y0 + 20, 2), at(x1 + 3, BOT.y - 16, 2)], 4)} width={3} colour="#d0714c" light="#de9372" />

      {/* on the roof: a tray of cables, a cooling unit and a second fan, and an antenna sending */}
      <g filter="url(#desk-chip)">
        <Block x0={x0} x1={x1} y0={y0} y1={y0 + 6} z={h} h={4} tone={STEEL} r={2} width={1} />
        <Block x0={x0 + 3} x1={x0 + w - 3} y0={y0 + 7} y1={y1 - 6} z={h} h={12} tone={TONES.paper} r={3} width={1.1} />
        <Block x0={x0 + 2 * w + 4} x1={x0 + 3 * w - 4} y0={y0 + 8} y1={y1 - 8} z={h} h={8} tone={TONES.concrete} r={3} width={1.1} />
        <Block x0={x0 + w + 18.5} x1={x0 + w + 21.5} y0={y0 + 9.5} y1={y0 + 12.5} z={h} h={34} tone={STEEL} r={1} width={1} />
      </g>
      {fan(x0 + w / 2, (y0 + 7 + y1 - 6) / 2, h + 12, 8.5)}
      {fan(x0 + 2.5 * w, (y0 + y1) / 2, h + 8, 6.5)}
      <g transform={`translate(${dishX.toFixed(1)} ${dishY.toFixed(1)}) rotate(-24)`}>
        <path d="M-12 0a12 6 0 0 0 24 0Z" fill="#fafaf7" stroke="rgba(45,47,43,0.6)" strokeWidth={1} />
        <path d="M0 0V-8" stroke="#7c817a" strokeWidth={1.2} />
        <circle cy={-8.6} r={1.7} fill="#d0714c" />
      </g>
      <g ref={signal} className={styles.signal} transform={`translate(${(dishX + 3).toFixed(1)} ${(dishY - 13).toFixed(1)}) rotate(-24)`} fill="none" stroke="#9caf88" strokeWidth={1.5} strokeLinecap="round">
        {["M-5 0a7 7 0 0 1 10 0", "M-9 -4a12 12 0 0 1 18 0", "M-13 -8a17 17 0 0 1 26 0"].map((d, k) => (
          <path key={k} d={d} style={{ animationDelay: `${k * 0.35}s` }} />
        ))}
      </g>

      {/* the sign across the roof's front edge: live, and how many deploys */}
      <g filter="url(#desk-chip)">
        <Block x0={x0} x1={x1} y0={y1 - 4} y1={y1} z={h + 2} h={18} tone={TONES.paper} r={3} width={1.1} />
      </g>
      <circle className={styles.liveDot} cx={at(x0 + 7, y1, h + 11.5)[0]} cy={at(x0 + 7, y1, h + 11.5)[1]} r={2.6} fill="#d0714c" />
      <text transform={onFront(at(x0 + 12, y1, h + 8))} fontSize={8} fontWeight={700} letterSpacing={0.6} fill="#bc4e26">
        LIVE
      </text>
      <text transform={onFront(at(x0 + 36, y1, h + 8.4))} fontSize={4.6} fontWeight={700} letterSpacing={0.3} fill="#5e625c">
        apps.ahmad.dev
      </text>
      <text ref={counter} transform={onFront(at(x0 + 80, y1, h + 8.4))} fontSize={4.6} fontWeight={700} letterSpacing={0.2} fill="#5e625c">
        {SEED.deploys} DEPLOYS
      </text>
      {/* and a tick over it each time something goes live */}
      <g ref={badge} className={styles.badge} transform={`translate(${badgeX.toFixed(1)} ${badgeY.toFixed(1)})`}>
        <rect x={-23} y={-7.5} width={46} height={14} rx={7} fill="#9caf88" stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
        <text x={0} y={2.4} textAnchor="middle" fontSize={6.4} fontWeight={700} letterSpacing={0.5} fill="#fafaf7">
          ✓ DEPLOYED
        </text>
      </g>
    </>
  );
}

/** The robot on wheels at the server: its body, drawn where it waits on its lane, moved along it by its translate. */
function ServerBot() {
  const { x, y } = BOT;
  return (
    <>
      {[-11, 11].map((dx) => (
        <Wheel key={dx} x={x + dx} y={y - 12} />
      ))}
      <g filter="url(#desk-card)">
        <Block x0={x - 18} x1={x + 18} y0={y - 11} y1={y + 11} z={4} h={12} tone={SAGE_DEEP} r={4} />
        <Block x0={x - 19} x1={x + 19} y0={y - 12} y1={y + 12} z={16} h={BOT.deck - 16} tone={TONES.concrete} r={3} />
      </g>
      <g filter="url(#desk-chip)">
        <Block x0={x + 11} x1={x + 16} y0={y - 9} y1={y - 4} z={BOT.deck} h={6} tone={SIENNA} r={2} width={1} />
      </g>
      <Detail d={rounded(frontFace(x - 14, x + 14, 7, 13, y + 11), 1.5)} fill="#fafaf7" />
      <text transform={onFront(at(x - 12, y + 11, 8.2))} fontSize={5} fontWeight={700} letterSpacing={0.8} fill="#2d2f2b">
        BOT-2
      </text>
      {[-11, 11].map((dx) => (
        <Wheel key={dx} x={x + dx} y={y + 12} />
      ))}
    </>
  );
}

/** What is on the belt, and where it is. */
type Item = { on: boolean; y: number; dz: number; stage: number; state: "fall" | "belt"; t: number; zone: number; rank: number; scanned: boolean; worked: number };
/** One straight run of a truck's way: where it starts (from the bay), which way it goes, how far, and which way it faces. */
type Run = { from: { x: number; y: number }; dx: number; dy: number; length: number; facing: Facing };
/**
 * A truck's way, in runs. To the server: along −x behind the words of the hero, along −y up under the bar along the top
 * of the page (on a narrow page, off its left edge instead); then, out of sight, on to the road in front of the server,
 * along it (+x) out from under the bar, and up (−y) into the dock. From the server: back (+y) on to the road, and along
 * it (+x) off the right of the page.
 */
type Route = { runs: Run[]; total: number };
/** The truck, and where it is on its round: coming in to the bay, being loaded, on its way to the server, being unloaded there, or driving off. */
type Lorry = { state: "arriving" | "loading" | "leaving" | "docked" | "exiting"; t: number; loaded: number; route: Route; go: number; facing: Facing };
/**
 * A robot, easing from where it was to each of its moves in turn. A move can wait until it may go (for a place no
 * other robot is working in, or a truck to load), be settled only as it starts, and do something on arriving.
 */
type Move<T> = { to: T; ms: number; wait?: () => boolean; start?: (move: Move<T>) => void; then?: () => void };
type Robot<T> = { at: T; from: T; moves: Move<T>[]; t: number; going: boolean };
/** Where the robot on wheels is along its lane, and where its wrist is from its shoulder. */
type RoverAt = { x: number; wx: number; wy: number; wz: number };
/** A place in a stack: empty, a box on its way in, a box, or a box about to be taken. */
type Slot = "empty" | "in" | "full" | "out";

export default function Factory({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const items = useRef<(SVGSVGElement | null)[]>([]);
  const tools = useRef<(SVGSVGElement | null)[]>([]);
  const lights = useRef<(SVGSVGElement | null)[]>([]);
  const smoke = useRef<(SVGGElement | null)[]>([]);
  const trucks = useRef<(SVGSVGElement | null)[]>([]);
  const faces = useRef<Record<Facing, SVGGElement | null>[]>(TRUCKS.map(() => ({ x: null, y: null, X: null })));
  const cargo = useRef<Record<Facing, (SVGGElement | null)[]>[]>(TRUCKS.map(() => ({ x: [], y: [], X: [] })));
  const staged = useRef<(SVGGElement | null)[]>([]);
  const stored = useRef<(SVGGElement | null)[]>([]);
  const stackerLayers = useRef<(SVGSVGElement | null)[]>([]);
  const shelverLayers = useRef<(SVGSVGElement | null)[]>([]);
  const roverLayer = useRef<SVGSVGElement>(null);
  const roverArmLayer = useRef<SVGSVGElement>(null);
  const botLayer = useRef<SVGSVGElement>(null);
  const botArmLayer = useRef<SVGSVGElement>(null);
  const blades = useRef<(SVGGElement | null)[]>([]);
  const counter = useRef<SVGTextElement>(null);
  const badge = useRef<SVGGElement>(null);
  const signal = useRef<SVGGElement>(null);
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
    const lorries: Lorry[] = TRUCKS.map(() => ({ state: "loading", t: 0, loaded: 0, route: { runs: [], total: 0 }, go: 0, facing: "x" }));
    const staging: Slot[] = Array.from({ length: STAGE.xs.length * STAGE.layers }, () => "empty");
    const store: Slot[] = Array.from({ length: STORE.xs.length * STORE.layers }, () => "empty");
    let spawned = 0;

    // ── drawing ──
    const show = (el: Element | null | undefined, on: boolean) => el?.setAttribute("display", on ? "inline" : "none");
    const look = (i: number, next: number) => {
      items.current[i]?.querySelectorAll<SVGGElement>("[data-stage]").forEach((g) => show(g, g.dataset.stage === String(next)));
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
    const showCargo = (n: number, count: number) => {
      const filled = FILL.slice(0, count);
      FACINGS.forEach((f) => cargo.current[n][f].forEach((g, k) => show(g, filled.includes(k))));
    };
    const face = (n: number, facing: Facing) => FACINGS.forEach((f) => show(faces.current[n][f], f === facing));
    /** The page as it stands this frame: where the factory is, how big it is drawn, and where the bottom of the bar along the top is. */
    const view = { left: 0, top: 0, scale: 1, nav: 0 };
    const header = document.querySelector("header");
    const measure = () => {
      const box = stage.current?.getBoundingClientRect();
      if (box) Object.assign(view, { left: box.left, top: box.top, scale: box.width / VB.w });
      view.nav = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    };
    const moveTruck = (n: number, dx: number, dy: number, opacity: number) => {
      const svg = trucks.current[n];
      if (!svg) return;
      svg.style.translate = move(dx, dy);
      svg.style.opacity = String(opacity);
      // whatever of it is higher than the bottom of the bar along the top of the page has gone under the bar, out of sight
      const under = view.nav - (view.top + ((dx + dy) / 2) * view.scale);
      svg.style.clipPath = under > 0 ? `polygon(-9000px ${under.toFixed(1)}px, 9000px ${under.toFixed(1)}px, 9000px 9000px, -9000px 9000px)` : "";
    };
    /** Where the truck stands at the dock, and where it turns off the road for it, from the bay. */
    const home = { x: DOCK.x - BAY.x, y: DOCK.y - BAY.y };
    const turn = { x: DOCK.x - BAY.x, y: ROAD_Y - BAY.y };
    const showStacks = () => {
      staged.current.forEach((g, k) => show(g, staging[k] === "full" || staging[k] === "out"));
      stored.current.forEach((g, k) => show(g, store[k] === "full" || store[k] === "out"));
    };
    /** Where a place in a stack is, as the bottom of the box in it. */
    const stagedAt = (k: number) => v3(STAGE.xs[k % STAGE.xs.length], STAGE.y, STAGE.table + BOX_H * Math.floor(k / STAGE.xs.length));
    const storedAt = (k: number) => v3(STORE.xs[k % STORE.xs.length], STORE.y, STORE.floor + BOX_H * Math.floor(k / STORE.xs.length));
    /** Where a gripper's wrist is to hold a box standing at p. */
    const grip = (p: V3) => above(p, GRIP);
    /** The first place in a stack with room, on the floor or on a box. */
    const room = (slots: Slot[], cols: number) => slots.findIndex((s, k) => s === "empty" && (k < cols || slots[k - cols] === "full"));
    /** The boxes on top of a stack, with nothing on them or coming. */
    const tops = (slots: Slot[], cols: number) => slots.flatMap((s, k) => (s === "full" && (k + cols >= slots.length || slots[k + cols] === "empty") ? [k] : []));

    // ── the robots, and the places only one of them may work in at a time ──
    const arms = {
      stacker: rigDrawing(stackerLayers.current, STACKER),
      shelver: rigDrawing(shelverLayers.current, SHELVER),
      rover: rigDrawing([roverArmLayer.current], ROVER_ARM),
      bot: rigDrawing([botArmLayer.current], BOT_ARM),
    };
    const robot = <T,>(at: T): Robot<T> => ({ at, from: at, moves: [], t: 0, going: false });
    const stacker = robot<V3>(STACKER_REST);
    const shelver = robot<V3>(SHELVER_REST);
    const rover = robot<RoverAt>({ x: ROVER.x, ...CARRY });
    let roverHolds = false;
    const bot = robot<RoverAt>({ x: BOT.x, ...CARRY });
    let botHolds = false;
    let deploys: number = SEED.deploys;
    const botShoulder = (x: number) => v3(x, BOT.y, BOT.shoulder);
    /** A move of the server robot's wrist to a point in the scene, with the robot standing at x. */
    const botReach = (x: number, p: V3): RoverAt => ({ x, wx: p.x - x, wy: p.y - BOT.y, wz: p.z - BOT.shoulder });
    const drawBot = () => {
      const { x, wx, wy, wz } = bot.at;
      if (botLayer.current) botLayer.current.style.translate = move(x - BOT.x, 0);
      const s = botShoulder(x);
      arms.bot.draw(s, plus(s, v3(wx, wy, wz)));
      // in front of the truck while it stands at the dock (the robot is between it and the viewer), behind it otherwise
      const front = lorries.some((l) => l.state === "docked");
      if (botLayer.current) botLayer.current.style.zIndex = front ? "32" : "27";
      if (botArmLayer.current) botArmLayer.current.style.zIndex = front ? "33" : "28";
    };
    /** A box goes into slot k of the racks: a blade lights up there, the count goes up, and the antenna sends. */
    const deploy = (k: number) => {
      deploys++;
      if (counter.current) counter.current.textContent = `${deploys} DEPLOYS`;
      show(blades.current[k], true);
      pulse(blades.current[k]);
      pulse(badge.current);
      pulse(signal.current);
    };
    const locks: Record<"stage" | "store", string | null> = { stage: null, store: null };
    const take = (zone: "stage" | "store", who: string) => () => {
      if (locks[zone] && locks[zone] !== who) return false;
      locks[zone] = who;
      return true;
    };
    const free = (zone: "stage" | "store", who: string) => () => {
      if (locks[zone] === who) locks[zone] = null;
    };
    const roverShoulder = (x: number) => v3(x, LANE, ROVER.shoulder);
    /** A move of the rover's wrist to a point in the scene, with the rover standing at x. */
    const reach = (x: number, p: V3): RoverAt => ({ x, wx: p.x - x, wy: p.y - LANE, wz: p.z - ROVER.shoulder });
    const drawStacker = () => arms.stacker.draw(STACKER_AT, stacker.at);
    const drawShelver = () => arms.shelver.draw(SHELVER_AT, shelver.at);
    const drawRover = () => {
      const { x, wx, wy, wz } = rover.at;
      if (roverLayer.current) roverLayer.current.style.translate = move(x - ROVER.x, 0);
      const s = roverShoulder(x);
      const w = plus(s, v3(wx, wy, wz));
      arms.rover.draw(s, w);
      // over the trucks while it reaches into one, under them otherwise
      if (roverArmLayer.current) roverArmLayer.current.style.zIndex = w.y > BAY.y - 30 ? "31" : "29";
    };
    const run = <T extends Record<string, number>>(bot: Robot<T>, dt: number, apply: () => void) => {
      const next = bot.moves[0];
      if (!next) return;
      if (!bot.going) {
        if (next.wait && !next.wait()) return;
        next.start?.(next);
        bot.from = { ...bot.at };
        bot.going = true;
        bot.t = 0;
      }
      bot.t += dt;
      const k = smooth(Math.min(1, bot.t / Math.max(1, next.ms)));
      bot.at = Object.fromEntries(Object.keys(next.to).map((key) => [key, bot.from[key] + (next.to[key] - bot.from[key]) * k])) as T;
      apply();
      if (bot.t >= next.ms) {
        bot.moves.shift();
        bot.going = false;
        next.then?.();
      }
    };
    const away = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > 1;

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

    // the line as it stands when built: things along the belt, boxes stacked, in the warehouse and in the first truck
    SEED.belt.forEach(seed);
    for (let k = 0; k < SEED.staged; k++) staging[k] = "full";
    for (let k = 0; k < SEED.stored; k++) store[k] = "full";
    lorries[0].loaded = SEED.loaded;
    measure();
    blades.current.forEach((g, k) => show(g, k < SEED.live));
    lorries.forEach((l, n) => {
      face(n, "x");
      moveTruck(n, 0, 0, 1);
      showCargo(n, l.loaded);
    });
    showStacks();
    drawStacker();
    drawShelver();
    drawRover();
    drawBot();
    if (reduced) return;

    let scanning = false;
    let clock = SPAWN_EVERY - 600;
    drop.current = () => {
      if (spawn()) clock = 0;
    };

    /** A run of a truck's way. */
    const run_ = (from: { x: number; y: number }, dx: number, dy: number, length: number, facing: Facing): Run => ({ from, dx, dy, length: Math.max(0, length), facing });
    /** The truck's way from the bay to the dock at the server, as the page stands now. */
    const toServer = (): Route => {
      measure();
      const s = view.scale;
      const [bx, by] = at(BAY.x, BAY.y, 0);
      const bayX = view.left + (bx - VB.x) * s;
      const bayY = view.top + (by - VB.y) * s;
      const wide = window.innerWidth >= 1024 && view.nav > 0;
      // out of sight: under the bar along the top of the page, or above the top of the page when the bar has gone
      const hide = (wide ? view.nav : 0) - 70 * s;
      // along −x behind the words, or on a narrow page off its left edge; then along −y up under the bar
      const l1 = wide ? Math.max(160, (bayX - Math.max(24, window.innerWidth * 0.14)) / (COS * s)) : (bayX + 140 * s) / (COS * s);
      const l2 = wide ? (2 * (bayY - (s * l1) / 2 - hide)) / s : 0;
      // then, out of sight, on to the road in front of the server at the point that is just out of sight: along it to
      // the turn for the dock, and up into it
      const x3 = 2 * ((hide - view.top) / s + VB.y - CY) - ROAD_Y;
      const l3 = DOCK.x - x3;
      const l4 = ROAD_Y - DOCK.y;
      const runs = [run_({ x: 0, y: 0 }, -1, 0, l1, "x"), run_({ x: -l1, y: 0 }, 0, -1, l2, "y"), run_({ x: x3 - BAY.x, y: ROAD_Y - BAY.y }, 1, 0, l3, "X"), run_(turn, 0, -1, l4, "y")];
      return { runs, total: runs.reduce((sum, r) => sum + r.length, 0) };
    };
    /** Its way from the dock: back on to the road, and along it off the right of the page. */
    const fromServer = (): Route => {
      measure();
      const s = view.scale;
      const roadX = view.left + (at(DOCK.x, ROAD_Y, 0)[0] - VB.x) * s;
      const runs = [run_(home, 0, 1, ROAD_Y - DOCK.y, "y"), run_(turn, 1, 0, (window.innerWidth - roadX + 200 * s) / (COS * s), "X")];
      return { runs, total: runs.reduce((sum, r) => sum + r.length, 0) };
    };
    /** Where a truck is, and which way it faces, `p` along its way. */
    const along = (route: Route, p: number): { x: number; y: number; facing: Facing } => {
      let left = p;
      for (const [k, r] of route.runs.entries()) {
        if (left <= r.length || k === route.runs.length - 1) {
          const d = Math.min(left, r.length);
          return { x: r.from.x + r.dx * d, y: r.from.y + r.dy * d, facing: r.facing };
        }
        left -= r.length;
      }
      return { x: 0, y: 0, facing: "x" };
    };
    /** How far along its way a truck is when it has driven d: pulling away gently, and slowing to a stop at the end. */
    const eased = (d: number, total: number) => (d < 40 ? (d * d) / 80 : d < total ? d - 20 : total - (Math.max(0, total + 40 - d) ** 2) / 80);

    const step = (dt: number) => {
      // read the page before anything is moved this frame
      measure();
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
              pulse(smoke.current[n]);
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

      // the first arm: when a box waits at the end of the belt and there is room on the stack, it lifts it across
      if (!stacker.moves.length) {
        const i = state.findIndex((it) => it.on && it.state === "belt" && it.y >= PICK_Y - 0.5);
        const k = room(staging, STAGE.xs.length);
        if (i >= 0 && k >= 0) {
          staging[k] = "in";
          const pick = grip(v3(0, PICK_Y, BELT.z));
          const put = grip(stagedAt(k));
          stacker.moves = [
            { to: above(pick, 26), ms: 300 },
            {
              to: pick,
              ms: 180,
              then: () => {
                state[i].on = false;
                items.current[i]?.removeAttribute("data-on");
                arms.stacker.hold(true);
              },
            },
            { to: above(pick, 36), ms: 200 },
            { to: above(put, 30), ms: 360, wait: take("stage", "stacker") },
            {
              to: put,
              ms: 200,
              then: () => {
                arms.stacker.hold(false);
                staging[k] = "full";
                showStacks();
              },
            },
            { to: above(put, 30), ms: 170 },
            { to: STACKER_REST, ms: 300, then: free("stage", "stacker") },
          ];
        } else if (away(stacker.at, STACKER_REST)) {
          stacker.moves = [{ to: STACKER_REST, ms: 400 }];
        }
      }
      run(stacker, dt, drawStacker);

      // the second arm: when there is a box on top of the stack and room in the warehouse, it carries it in
      if (!shelver.moves.length) {
        const from = tops(staging, STAGE.xs.length).at(-1);
        const k = room(store, STORE.xs.length);
        if (from !== undefined && k >= 0) {
          staging[from] = "out";
          store[k] = "in";
          const pick = grip(stagedAt(from));
          const put = grip(storedAt(k));
          shelver.moves = [
            { to: above(pick, 30), ms: 340, wait: take("stage", "shelver") },
            {
              to: pick,
              ms: 180,
              then: () => {
                staging[from] = "empty";
                showStacks();
                arms.shelver.hold(true);
              },
            },
            { to: above(pick, 34), ms: 200 },
            { to: above(put, 34), ms: 420, wait: take("store", "shelver"), start: free("stage", "shelver") },
            {
              to: put,
              ms: 200,
              then: () => {
                arms.shelver.hold(false);
                store[k] = "full";
                showStacks();
              },
            },
            { to: above(put, 30), ms: 170 },
            { to: SHELVER_REST, ms: 320, then: free("store", "shelver") },
          ];
        } else if (away(shelver.at, SHELVER_REST)) {
          shelver.moves = [{ to: SHELVER_REST, ms: 400 }];
        }
      }
      run(shelver, dt, drawShelver);

      // the robot on wheels: it takes the box nearest the truck out of the warehouse, and when a truck has room, drives it over and packs it
      if (!rover.moves.length) {
        const k = tops(store, STORE.xs.length).sort((a, b) => (a % STORE.xs.length) - (b % STORE.xs.length))[0];
        if (k !== undefined) {
          store[k] = "out";
          const pick = grip(storedAt(k));
          const x = pick.x;
          let lorry = -1;
          let into = v3(0, 0, 0);
          const driving = (on: boolean, back = false) => {
            if (on) roverLayer.current?.setAttribute("data-driving", back ? "back" : "on");
            else roverLayer.current?.removeAttribute("data-driving");
          };
          rover.moves = [
            {
              to: { x, ...CARRY },
              ms: 0,
              start: (m) => {
                m.ms = Math.max(260, (Math.abs(x - rover.at.x) / ROVER.speed) * 1000);
                driving(true, x < rover.at.x);
              },
              then: () => driving(false),
            },
            { to: reach(x, above(pick, 26)), ms: 240, wait: take("store", "rover") },
            {
              to: reach(x, pick),
              ms: 180,
              then: () => {
                store[k] = "empty";
                showStacks();
                arms.rover.hold(true);
                roverHolds = true;
              },
            },
            { to: reach(x, above(pick, 30)), ms: 180 },
            { to: { x, ...CARRY }, ms: 220, then: free("store", "rover") },
            {
              to: { x, ...CARRY },
              ms: 0,
              // it waits here, box in hand, for a truck with room
              wait: () => {
                lorry = lorries.findIndex((l) => l.state === "loading" && l.loaded < SLOTS.length);
                return lorry >= 0;
              },
              start: (m) => {
                const p = slotAt(SLOTS[FILL[lorries[lorry].loaded]], "x");
                into = grip(v3(p.x, p.y, 16));
                m.to = { x: into.x, ...CARRY };
                m.ms = Math.max(260, (Math.abs(into.x - rover.at.x) / ROVER.speed) * 1000);
                driving(true, into.x < rover.at.x);
              },
              then: () => driving(false),
            },
            {
              to: { x, ...CARRY },
              ms: 260,
              start: (m) => {
                m.to = reach(into.x, above(into, 30));
              },
            },
            {
              to: { x, ...CARRY },
              ms: 200,
              start: (m) => {
                m.to = reach(into.x, into);
              },
              then: () => {
                arms.rover.hold(false);
                roverHolds = false;
                lorries[lorry].loaded++;
                showCargo(lorry, lorries[lorry].loaded);
              },
            },
            {
              to: { x, ...CARRY },
              ms: 180,
              start: (m) => {
                m.to = reach(into.x, above(into, 30));
              },
            },
            {
              to: { x, ...CARRY },
              ms: 220,
              start: (m) => {
                m.to = { x: into.x, ...CARRY };
              },
            },
          ];
        }
      }
      run(rover, dt, drawRover);

      // at the live server: while the truck stands at the dock with boxes in it, the robot on wheels drives to its tail,
      // lifts a box out, drives it to the next slot in the racks and deploys it there
      if (!bot.moves.length) {
        const n = lorries.findIndex((l) => l.state === "docked" && l.loaded > 0);
        const driveBot = (x: number): Move<RoverAt> => ({
          to: { x, ...CARRY },
          ms: 0,
          start: (m) => {
            m.ms = Math.max(240, (Math.abs(x - bot.at.x) / BOT.speed) * 1000);
            if (Math.abs(x - bot.at.x) > 1) botLayer.current?.setAttribute("data-driving", x < bot.at.x ? "back" : "on");
          },
          then: () => botLayer.current?.removeAttribute("data-driving"),
        });
        if (n >= 0) {
          const lorry = lorries[n];
          const p = slotAt(SLOTS[FILL[lorry.loaded - 1]], "y");
          const box = grip(v3(p.x + home.x, p.y + home.y, 16));
          const into = deploys % DEPLOY_SLOTS;
          const slot = deploySlot(into);
          const front = grip(v3(slot.x, RACK.y1 + 13, slot.z));
          const inside = grip(v3(slot.x, RACK.y1 + 3, slot.z));
          bot.moves = [
            driveBot(box.x),
            { to: botReach(box.x, above(box, 36)), ms: 260 },
            {
              to: botReach(box.x, box),
              ms: 180,
              then: () => {
                lorry.loaded--;
                showCargo(n, lorry.loaded);
                arms.bot.hold(true);
                botHolds = true;
              },
            },
            { to: botReach(box.x, above(box, 40)), ms: 200 },
            { to: { x: box.x, ...CARRY }, ms: 220 },
            driveBot(slot.x),
            { to: botReach(slot.x, above(front, 8)), ms: 260 },
            { to: botReach(slot.x, front), ms: 140 },
            {
              to: botReach(slot.x, inside),
              ms: 200,
              then: () => {
                arms.bot.hold(false);
                botHolds = false;
                deploy(into);
              },
            },
            { to: botReach(slot.x, front), ms: 150 },
            { to: { x: slot.x, ...CARRY }, ms: 220 },
          ];
        } else if (Math.abs(bot.at.x - BOT.x) > 1 && !lorries.some((l) => l.state === "docked")) {
          bot.moves = [driveBot(BOT.x)];
        }
      }
      run(bot, dt, drawBot);

      // the truck: to the server when it is full, unloaded there, off the page, and back to the bay for more
      lorries.forEach((lorry, n) => {
        lorry.t += dt;
        if (lorry.state === "loading" && lorry.loaded >= SLOTS.length && !roverHolds) {
          Object.assign(lorry, { state: "leaving", route: toServer(), go: -DRIVE * 0.3 });
        } else if (lorry.state === "arriving") {
          const k = Math.min(1, lorry.t / ARRIVE);
          const e = 1 - (1 - k) * (1 - k);
          face(n, "x");
          showCargo(n, 0);
          moveTruck(n, 220 * (1 - e), 0, Math.min(1, k * 3));
          if (k >= 1) Object.assign(lorry, { state: "loading", t: 0 });
        } else if (lorry.state === "leaving" || lorry.state === "exiting") {
          const r = lorry.route;
          lorry.go = Math.min(lorry.go + (DRIVE * dt) / 1000, r.total + 40);
          const spot = along(r, eased(Math.max(0, lorry.go), r.total));
          if (spot.facing !== lorry.facing) {
            lorry.facing = spot.facing;
            face(n, spot.facing);
          }
          moveTruck(n, spot.x, spot.y, 1);
          if (lorry.go >= r.total + 40) {
            if (lorry.state === "leaving") {
              Object.assign(lorry, { state: "docked", t: 0 });
            } else {
              // off the page: the same truck comes back round to the bay, empty, for the next load
              Object.assign(lorry, { state: "arriving", t: 0, loaded: 0, facing: "x" });
              face(n, "x");
              showCargo(n, 0);
              moveTruck(n, 220, 0, 0);
            }
          }
        } else if (lorry.state === "docked") {
          moveTruck(n, home.x, home.y, 1);
          if (lorry.loaded === 0 && !botHolds) {
            // empty: it backs out on to the road and drives off the right of the page
            Object.assign(lorry, { state: "exiting", route: fromServer(), go: -DRIVE * 0.25 });
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
  /** The plate each arm is bolted down on. */
  const plate = (s: V3) => <Block x0={s.x - 13} x1={s.x + 13} y0={s.y - 13} y1={s.y + 13} z={0} h={8} tone={TONES.dark} r={6} />;
  const hopperY = SPAWN_Y;

  return (
    <div className={`${styles.root} ${className ?? ""}`} onClick={() => drop.current()}>
      <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""}`} aria-hidden="true">
        {/* ── the live server, at the top right, beyond the far end of the line ── */}
        <Layer z={LAYER.server}>
          <Part arrival={{ lift: 50, from: 0.62, span: 0.12 }} style={drawn(0.6, 0.7)}>
            <ServerRoom
              blade={(k) => (el) => {
                blades.current[k] = el;
              }}
              counter={(el) => {
                counter.current = el;
              }}
              badge={(el) => {
                badge.current = el;
              }}
              signal={(el) => {
                signal.current = el;
              }}
            />
          </Part>
        </Layer>

        {/* ── the floor, the belt, and everything that stands behind the line ── */}
        <svg viewBox={VIEW} className={styles.base} style={{ zIndex: LAYER.base * 100 }} focusable="false">
          <g style={drawn(0, 0.1)} filter="url(#desk-card)">
            <Block x0={FLOOR.x0} x1={FLOOR.x1} y0={FLOOR.y0} y1={FLOOR.y1} z={-8} h={8} tone={FLOOR_TONE} r={26} />
          </g>
          {/* a walkway painted on the floor, the robot's lane, and the loading bay */}
          <g style={drawn(0.08, 0.12)}>
            <Detail d={line(at(66, FLOOR.y0 + 24, 0), at(66, 60, 0))} stroke="#b8bcb5" width={1.6} />
            <Detail d={line(at(104, FLOOR.y0 + 24, 0), at(104, 60, 0))} stroke="#b8bcb5" width={1.6} />
          </g>
          <g className={deskStyles.fade} style={between(0.4, 0.1)} fill="none" strokeLinecap="round">
            <path d={line(at(-56, LANE, 0), at(STORE.x1 + 6, LANE, 0))} stroke="#de9372" strokeWidth={1.4} strokeDasharray="7 6" />
            <path d={rounded(topFace(BAY.x - 52, BAY.x + 64, BAY.y - 32, BAY.y + 32, 0), 6)} stroke="#9a9f98" strokeWidth={1.4} strokeDasharray="5 5" />
          </g>
          <g style={drawn(0.02, 0.12)} filter="url(#desk-card)">
            <Block x0={-FRAME.half} x1={FRAME.half} y0={BELT.y0} y1={BELT.y1} z={0} h={FRAME.h} tone={TONES.concrete} r={10} />
          </g>
          <g style={drawn(0.08, 0.16)} filter="url(#desk-ink)">
            <Block x0={-BELT.half} x1={BELT.half} y0={BELT.y0} y1={BELT.y1} z={FRAME.h} h={BELT.z - FRAME.h} tone={BELT_TONE} r={7} width={1.2} />
          </g>
          {/* rollers along the frame */}
          <g style={drawn(0.14, 0.18, 0.05)}>
            {Array.from({ length: Math.floor((BELT.y1 - BELT.y0 - 30) / 44) + 1 }, (_, i) => (
              <Detail key={i} d={rounded(sideFace(FRAME.half, BELT.y0 + 26 + i * 44, BELT.y0 + 30 + i * 44, 12, 16), 2)} fill="#9a9f98" width={0.8} />
            ))}
          </g>
          {/* the hopper's post, a lamp, and the robot arm's column at TEST: all behind the belt */}
          <g style={drawn(0.16, 0.22)} filter="url(#desk-chip)">
            <Block x0={-44} x1={-36} y0={hopperY - 18} y1={hopperY - 10} z={0} h={96} tone={TONES.concrete} r={3} width={1.1} />
          </g>
          <g style={drawn(0.18, 0.24)}>{postLamp(-58, -160)}</g>
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
              <Block x0={-6} x1={6} y0={hopperY - 12} y1={hopperY} z={124} h={40} tone={STEEL} r={3} width={1.1} />
            </g>
            <g filter="url(#desk-card)">
              <Block x0={-30} x1={30} y0={hopperY - 32} y1={hopperY + 20} z={96} h={28} tone={TONES.paper} r={8} />
            </g>
            <text transform={onSide(at(30, hopperY + 12, 116))} y={2} fontSize={9.5} fontWeight={700} letterSpacing={1.2} fill="#3b3d39">
              IDEAS
            </text>
            <g transform={`translate(${at(0, hopperY - 6, 176)[0].toFixed(1)} ${at(0, hopperY - 6, 176)[1].toFixed(1)})`} filter="url(#desk-chip)">
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
                {/* the pipe the smoke comes out of, with a band round its top */}
                <g filter="url(#desk-chip)">
                  <Block x0={PIPES[n].x - PIPES[n].w / 2} x1={PIPES[n].x + PIPES[n].w / 2} y0={PIPES[n].y - PIPES[n].w / 2} y1={PIPES[n].y + PIPES[n].w / 2} z={ROOF + 16} h={PIPES[n].h} tone={TONES.concrete} r={PIPES[n].w / 3} width={1.1} />
                  <Block x0={PIPES[n].x - PIPES[n].w / 2 - 1} x1={PIPES[n].x + PIPES[n].w / 2 + 1} y0={PIPES[n].y - PIPES[n].w / 2 - 1} y1={PIPES[n].y + PIPES[n].w / 2 + 1} z={ROOF + 12 + PIPES[n].h} h={4} tone={STEEL} r={PIPES[n].w / 3} width={1} />
                </g>
                {n === 0 && (
                  // on DESIGN's roof, a big pencil
                  <g filter="url(#desk-chip)">
                    <Block x0={-5} x1={5} y0={mid - 5} y1={mid + 5} z={ROOF + 16} h={34} tone={PENCIL} r={2} width={1.1} />
                    <Block x0={-5} x1={5} y0={mid - 5} y1={mid + 5} z={ROOF + 50} h={6} tone={TONES.concrete} r={2} width={1} />
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

        {/* smoke, puffing up out of each machine's pipe the whole time, and a big puff each time the machine works */}
        <Layer z={LAYER.smoke}>
          {PIPES.map((pipe, n) => {
            const [x, y] = at(pipe.x, pipe.y, ROOF + 18 + pipe.h);
            const fill = n === 1 ? "#b9bdb6" : "#cfd2cb";
            return (
              <g
                key={n}
                ref={(el) => {
                  smoke.current[n] = el;
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <g key={k} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.95 + (k % 2) * 0.22).toFixed(2)})`}>
                    <path className={styles.puff} d={PUFF} fill={fill} style={{ animationDelay: `${-(k * 0.7 + n * 0.4).toFixed(2)}s` }} />
                  </g>
                ))}
                <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.2)`}>
                  <path className={styles.burst} d={PUFF} fill={fill} />
                </g>
              </g>
            );
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

        {/* ── the floor beside the line: the control desk, the tank piped into BUILD, and a pallet of boxes ── */}
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
              <Block x0={150} x1={194} y0={-60} y1={-16} z={0} h={6} tone={WOOD} r={2} width={1.1} />
            </g>
            {[
              [162, -48, 6],
              [182, -48, 6],
              [162, -28, 6],
              [182, -28, 6],
              [172, -38, 24],
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

        {/* ── the end of the line. The two arms stand behind the row they work over: first their plates and the back half of each ── */}
        <Layer z={LAYER.armsBack}>
          <Part arrival={{ lift: 40, from: 0.5, span: 0.12 }} style={drawn(0.48, 0.58)}>
            <g filter="url(#desk-card)">
              {plate(STACKER_AT)}
              {plate(SHELVER_AT)}
            </g>
          </Part>
        </Layer>
        {(
          [
            [STACKER, STACKER_AT, STACKER_REST, stackerLayers],
            [SHELVER, SHELVER_AT, SHELVER_REST, shelverLayers],
          ] as const
        ).map(([rig, s, w, layers], n) => (
          <svg
            key={n}
            ref={(el) => {
              layers.current[0] = el;
            }}
            viewBox={VIEW}
            className={`${styles.layer} ${deskStyles.fade}`}
            style={{ zIndex: LAYER.armsBack * 100 + 1 + n, ...between(0.56, 0.06) }}
            aria-hidden="true"
            focusable="false"
          >
            <RigShape rig={rig} s={s} w={w} only={(key) => BACK_PARTS.includes(key)} />
          </svg>
        ))}

        {/* the stack at the right side of the belt */}
        <Layer z={LAYER.stage}>
          <Part arrival={{ lift: 40, from: 0.5, span: 0.12 }} style={drawn(0.48, 0.58)}>
            <g filter="url(#desk-card)">
              <Block x0={STAGE.x0} x1={STAGE.x1} y0={STAGE.y - 14} y1={STAGE.y + 14} z={0} h={STAGE.table} tone={WOOD} r={3} />
            </g>
            <Stack
              xs={STAGE.xs}
              y={STAGE.y}
              z={STAGE.table}
              groupRef={(k) => (el) => {
                staged.current[k] = el;
              }}
            />
          </Part>
        </Layer>

        {/* the warehouse: a floor with its bays marked out, a post at each corner, its sign, and the boxes stacked in it */}
        <Layer z={LAYER.store}>
          <Part arrival={{ lift: 40, from: 0.52, span: 0.12 }} style={drawn(0.5, 0.6)}>
            <g filter="url(#desk-card)">
              <Block x0={STORE.x0} x1={STORE.x1} y0={STORE.y0} y1={STORE.y1} z={0} h={STORE.floor} tone={TONES.concrete} r={4} />
            </g>
            {STORE.xs.slice(1).map((x) => (
              <Detail key={x} d={line(at(x - 11, STORE.y0 + 3, STORE.floor), at(x - 11, STORE.y1 - 3, STORE.floor))} stroke="#7c817a" width={1.2} />
            ))}
            <g filter="url(#desk-chip)">
              {[
                [STORE.x0, STORE.y0],
                [STORE.x1 - 4, STORE.y0],
              ].map(([x, y]) => (
                <Block key={`${x}-${y}`} x0={x} x1={x + 4} y0={y} y1={y + 4} z={0} h={62} tone={SIENNA} r={1.5} width={1} />
              ))}
            </g>
            <Stack
              xs={STORE.xs}
              y={STORE.y}
              z={STORE.floor}
              groupRef={(k) => (el) => {
                stored.current[k] = el;
              }}
            />
            <g filter="url(#desk-chip)">
              {[
                [STORE.x0, STORE.y1 - 4],
                [STORE.x1 - 4, STORE.y1 - 4],
              ].map(([x, y]) => (
                <Block key={`${x}-${y}`} x0={x} x1={x + 4} y0={y} y1={y + 4} z={0} h={62} tone={SIENNA} r={1.5} width={1} />
              ))}
              <Block x0={STORE.x1 - 4} x1={STORE.x1} y0={STORE.y0} y1={STORE.y1} z={62} h={16} tone={TONES.paper} r={2} width={1.1} />
            </g>
            <text transform={onSide(at(STORE.x1, STORE.y1 - 3, 66))} fontSize={8} fontWeight={700} letterSpacing={0.5} fill="#2d2f2b" textLength={27} lengthAdjust="spacingAndGlyphs">
              WAREHOUSE
            </text>
          </Part>
        </Layer>

        {/* the front half of each arm, over the stacks it reaches into */}
        {(
          [
            [STACKER, STACKER_AT, STACKER_REST, stackerLayers],
            [SHELVER, SHELVER_AT, SHELVER_REST, shelverLayers],
          ] as const
        ).map(([rig, s, w, layers], n) => (
          <svg
            key={n}
            ref={(el) => {
              layers.current[1] = el;
            }}
            viewBox={VIEW}
            className={`${styles.layer} ${deskStyles.fade}`}
            style={{ zIndex: LAYER.armsFront * 100 + n, ...between(0.56, 0.06) }}
            aria-hidden="true"
            focusable="false"
          >
            <RigShape rig={rig} s={s} w={w} only={(key) => !BACK_PARTS.includes(key)} />
          </svg>
        ))}

        {/* ── the robot on wheels: its body, moved along its lane; its arm is drawn over it, outside the factory's stacking ── */}
        <Layer z={LAYER.rover} className={`${styles.moving} ${styles.rover}`} layerRef={(el) => void (roverLayer.current = el)}>
          <Part arrival={{ lift: 40, from: 0.56, span: 0.1 }} style={drawn(0.54, 0.62)}>
            {[-10, 10].map((x) => (
              <Wheel key={x} x={ROVER.x + x} y={LANE - 12} />
            ))}
            <g filter="url(#desk-card)">
              <Block x0={ROVER.x - 17} x1={ROVER.x + 17} y0={LANE - 11} y1={LANE + 11} z={4} h={12} tone={SIENNA} r={4} />
              <Block x0={ROVER.x - 18} x1={ROVER.x + 18} y0={LANE - 12} y1={LANE + 12} z={16} h={ROVER.deck - 16} tone={TONES.concrete} r={3} />
            </g>
            <g filter="url(#desk-chip)">
              <Block x0={ROVER.x + 10} x1={ROVER.x + 15} y0={LANE - 9} y1={LANE - 4} z={ROVER.deck} h={6} tone={SAGE} r={2} width={1} />
            </g>
            <Detail d={rounded(frontFace(ROVER.x - 13, ROVER.x + 13, 7, 13, LANE + 11), 1.5)} fill="#fafaf7" />
            <text transform={onFront(at(ROVER.x - 11, LANE + 11, 8.2))} fontSize={5} fontWeight={700} letterSpacing={0.8} fill="#2d2f2b">
              BOT-1
            </text>
            {[-10, 10].map((x) => (
              <Wheel key={x} x={ROVER.x + x} y={LANE + 12} />
            ))}
          </Part>
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
          style={{ zIndex: 30 }}
          aria-hidden="true"
          focusable="false"
        >
          <Part arrival={{ lift: 30, from: 0.6, span: 0.12 }} style={drawn(0.58, 0.66)}>
            {FACINGS.map((f) => (
              <g
                key={f}
                ref={(el) => {
                  faces.current[n][f] = el;
                }}
                display={f === "x" ? "inline" : "none"}
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

      {/* the robot on wheels at the live server, and its arm: behind the truck as it goes by, in front of it at the dock */}
      <svg ref={botLayer} viewBox={VIEW} className={`${styles.layer} ${styles.moving} ${styles.rover}`} style={{ zIndex: 27 }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 40, from: 0.66, span: 0.1 }} style={drawn(0.64, 0.72)}>
          <ServerBot />
        </Part>
      </svg>
      <svg ref={botArmLayer} viewBox={VIEW} className={`${styles.layer} ${deskStyles.fade}`} style={{ zIndex: 28, ...between(0.7, 0.06) }} aria-hidden="true" focusable="false">
        <RigShape rig={BOT_ARM} s={v3(BOT.x, BOT.y, BOT.shoulder)} w={plus(v3(BOT.x, BOT.y, BOT.shoulder), v3(CARRY.wx, CARRY.wy, CARRY.wz))} />
      </svg>

      {/* the robot's arm: under the trucks, or over them while it reaches into one */}
      <svg ref={roverArmLayer} viewBox={VIEW} className={`${styles.layer} ${deskStyles.fade}`} style={{ zIndex: 29, ...between(0.62, 0.06) }} aria-hidden="true" focusable="false">
        <RigShape rig={ROVER_ARM} s={v3(ROVER.x, LANE, ROVER.shoulder)} w={plus(v3(ROVER.x, LANE, ROVER.shoulder), v3(CARRY.wx, CARRY.wy, CARRY.wz))} />
      </svg>
    </div>
  );
}
