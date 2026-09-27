import type { CSSProperties, ReactNode } from "react";
import styles from "./Desk.module.css";

/**
 * The isometric drawing kit the desk is built with, in the sketchbook's hand.
 *
 * Points are given in the scene's own space — x across the desk, y towards the
 * viewer and z up — and projected onto the view box. Every outline is drawn the
 * way a pen draws it: each edge bowed a little, every corner a little off, and
 * the line running on past where it closed. The colour goes in like marker, a
 * hair out of register with the line. All of it is worked out from the shape's
 * own coordinates, so the server and the browser draw exactly the same wobble,
 * and none of it costs anything while the scene animates.
 *
 * Outlines draw themselves and colour fills in from the timing a group gives
 * them (see `drawn`), driven by --p, the scene's progress from 0 to 1.
 */

export type Point = [number, number];
export type Tone = { top: string; left: string; right: string };

export const INK = "#2d2f2b";
export const CX = 360;
export const CY = 402;
export const COS = Math.cos(Math.PI / 6);

/** Where a point in the scene lands on screen. */
export const at = (x: number, y: number, z: number): Point => [CX + (x - y) * COS, CY + (x + y) / 2 - z];
export const xy = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;
export const poly = (...points: Point[]) => `M${points.map(xy).join("L")}Z`;
export const line = (...points: Point[]) => `M${points.map(xy).join("L")}`;

/** A small circle lying flat on a top face. */
export const dot = ([x, y]: Point, r: number) =>
  `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${(r * 0.58).toFixed(2)} 0 1 0 ${2 * r} 0a${r} ${(r * 0.58).toFixed(2)} 0 1 0 ${-2 * r} 0Z`;

/** A transform that lays text flat on a top face, starting at `origin`. */
export const onTop = (origin: Point) => `matrix(${COS} 0.5 ${-COS} 0.5 ${xy(origin)})`;
/** A transform that stands text on a face turned towards the viewer, starting at `origin`. */
export const onFront = (origin: Point) => `matrix(${COS} 0.5 0 1 ${xy(origin)})`;
/** A transform that stands text on a face turned to the right, starting at `origin`. */
export const onSide = (origin: Point) => `matrix(${COS} -0.5 0 1 ${xy(origin)})`;

/** An open path through `points` with each corner bent round by up to `radius`, the way a cable bends. */
export function bend(points: Point[], radius: number) {
  const toward = (from: Point, to: Point): Point => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
    const r = Math.min(radius, length / 2);
    return [from[0] + ((to[0] - from[0]) / length) * r, from[1] + ((to[1] - from[1]) / length) * r];
  };
  const corners = points.slice(1, -1).map((corner, i) => `L${xy(toward(corner, points[i]))}Q${xy(corner)} ${xy(toward(corner, points[i + 2]))}`);
  return `M${xy(points[0])}${corners.join("")}L${xy(points[points.length - 1])}`;
}

// ── the hand ────────────────────────────────────────────────────────────

/** A small, fast random number source, seeded, so the same shape always wobbles the same way. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (points: Point[]) => points.reduce((h, [x, y]) => Math.imul(h ^ Math.round(x * 7) ^ (Math.round(y * 13) << 9), 16777619), 2166136261);

/**
 * An outline through `points` as a pen would draw it in one stroke: every edge
 * bowed, every corner nudged, and, if it is closed, the line running on a
 * little way past where it started.
 */
export function sketch(points: Point[], closed = true, wobble = 1) {
  const rand = random(seedOf(points));
  const jitter = (amount: number) => (rand() * 2 - 1) * amount * wobble;
  const pts = points.map(([x, y]): Point => [x + jitter(0.8), y + jitter(0.8)]);
  const n = pts.length;
  let d = `M${xy(pts[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < 0.05) continue;
    const bow = Math.min(2.2, length * 0.04) * (rand() * 2 - 1) * wobble;
    const mid: Point = [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / length) * bow, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / length) * bow];
    d += `Q${xy(mid)} ${xy(b)}`;
  }
  if (closed && n > 1) {
    const [a, b] = pts;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const run = Math.min(5, length * 0.18) * (0.4 + rand() * 0.6);
    d += `L${xy([a[0] + ((b[0] - a[0]) / length) * run, a[1] + ((b[1] - a[1]) / length) * run + jitter(0.4)])}`;
  }
  return d;
}

// ── timing ──────────────────────────────────────────────────────────────

/** Timing for the shapes in a group: outline drawn from `draw`, colour in from `colour`. */
export const drawn = (draw: number, colour: number, length = 0.1) => ({ "--ds": draw, "--dl": length, "--fs": colour, "--fl": 0.08 }) as CSSProperties;
/** Timing for anything that simply fades in. */
export const between = (start: number, length: number) => ({ "--s": start, "--l": length }) as CSSProperties;

// ── shapes ──────────────────────────────────────────────────────────────

type Face = { points: Point[]; fill: string; hatch?: boolean };

/**
 * Flat faces, in the order given: all their colour first, a hair out of
 * register, then pencil hatching on any that are in shade, then every outline
 * over the top, so the lines stay on top of the colour.
 */
export function Faces({ faces, width = 1.3 }: { faces: Face[]; width?: number }) {
  return (
    <>
      {faces.map((face, i) => (
        <path key={`c${i}`} d={poly(...face.points)} fill={face.fill} transform="translate(0.7 0.5)" className={styles.fill} />
      ))}
      {faces.map((face, i) => face.hatch && <path key={`h${i}`} d={poly(...face.points)} fill="url(#desk-hatch)" className={styles.fill} />)}
      {faces.map((face, i) => (
        <path key={`o${i}`} d={sketch(face.points)} pathLength={1} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={styles.part} />
      ))}
    </>
  );
}

type BoxProps = { x0: number; x1: number; y0: number; y1: number; z: number; h: number; tone: Tone; hatch?: boolean; width?: number };

/** The three faces of a box you can see: front left, front right and top. */
export function Box({ x0, x1, y0, y1, z, h, tone, hatch = false, width }: BoxProps) {
  const t = z + h;
  return (
    <Faces
      width={width}
      faces={[
        { points: [at(x0, y1, z), at(x1, y1, z), at(x1, y1, t), at(x0, y1, t)], fill: tone.left },
        { points: [at(x1, y0, z), at(x1, y1, z), at(x1, y1, t), at(x1, y0, t)], fill: tone.right, hatch },
        { points: [at(x0, y0, t), at(x1, y0, t), at(x1, y1, t), at(x0, y1, t)], fill: tone.top },
      ]}
    />
  );
}

/** A flat shape of any outline, sketched and coloured like a face. */
export function Shape({ points, fill, width = 1.1 }: { points: Point[]; fill: string; width?: number }) {
  return <Faces faces={[{ points, fill }]} width={width} />;
}

type DetailProps = { d: string; fill?: string; stroke?: string; width?: number; style?: CSSProperties };

/** A small exact shape — a dot, a vent, a trace — drawn and filled with the rest. */
export function Detail({ d, fill = "none", stroke = INK, width = 1.1, style }: DetailProps) {
  return <path d={d} pathLength={1} fill={fill} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={styles.part} style={style} />;
}

type WireProps = { d: string; width?: number; colour?: string; light?: string; style?: CSSProperties };

/** A cable with thickness to it: an ink outline, its colour, and a highlight along its upper edge. */
export function Wire({ d, width = 4, colour = "#333532", light = "#7c817a", style }: WireProps) {
  const path = { d, pathLength: 1, fill: "none", strokeLinecap: "round", strokeLinejoin: "round", className: styles.part } as const;
  return (
    <g style={style}>
      <path {...path} stroke={INK} strokeWidth={width + 2.4} />
      <path {...path} stroke={colour} strokeWidth={width} />
      <path {...path} stroke={light} strokeWidth={Math.max(0.8, width * 0.3)} transform={`translate(0 ${(-width * 0.22).toFixed(2)})`} />
    </g>
  );
}

/**
 * A part that arrives from above: held `lift` view-box units up, and brought
 * down into place as --p passes from `from` over `span`. With `fall` it drops
 * like something let go of — slowly at first, then fast — instead of being
 * lowered.
 */
export type Arrival = { lift: number; from: number; span: number; fall?: boolean };

export function Part({ arrival, style, className, children }: { arrival: Arrival; style?: CSSProperties; className?: string; children: ReactNode }) {
  const { lift, from, span, fall = false } = arrival;
  return (
    <g className={`${fall ? styles.fall : styles.lower} ${className ?? ""}`} style={{ "--lift": lift, "--from": from, "--span": span, ...style } as CSSProperties}>
      {children}
    </g>
  );
}
