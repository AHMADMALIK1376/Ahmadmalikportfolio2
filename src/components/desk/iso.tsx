import type { CSSProperties, ReactNode } from "react";
import styles from "./Desk.module.css";

/**
 * The isometric drawing kit the desk is built with, in the language of the
 * site's cards and buttons: soft rounded blocks with a paper or pastel face, a
 * thin ink edge at the cards' own strength, and — added by the filters the desk
 * puts them through — the same wobble and the same hard offset shadow.
 *
 * Points are given in the scene's own space — x across the desk, y towards the
 * viewer and z up — and projected onto the view box. Outlines draw themselves
 * and colour fills in from the timing a group gives them (see `drawn`), driven
 * by --p, the scene's progress from 0 to 1.
 */

export type Point = [number, number];
export type Tone = { top: string; left: string; right: string };

/** The ink every edge is drawn in: the cards' border, not solid black. */
export const EDGE = "rgba(45, 47, 43, 0.55)";
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

// ── rounded corners ─────────────────────────────────────────────────────

/**
 * One rounded corner: where the curve leaves the edge before it (p1), the
 * corner it bends round (P), where it joins the edge after (p2), the middle
 * of the curve (m), and the control points of its two halves (c1, c2).
 */
type Corner = { p1: Point; P: Point; p2: Point; m: Point; c1: Point; c2: Point };

const mix = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const down = ([x, y]: Point, by: number): Point => [x, y + by];

function round(points: Point[], radius: number): Corner[] {
  const n = points.length;
  return points.map((P, i) => {
    const before = points[(i + n - 1) % n];
    const after = points[(i + 1) % n];
    const lb = Math.hypot(before[0] - P[0], before[1] - P[1]);
    const la = Math.hypot(after[0] - P[0], after[1] - P[1]);
    const r = Math.min(radius, lb * 0.45, la * 0.45);
    const p1 = lb ? mix(P, before, r / lb) : P;
    const p2 = la ? mix(P, after, r / la) : P;
    const c1 = mix(p1, P, 0.5);
    const c2 = mix(P, p2, 0.5);
    return { p1, P, p2, m: mix(c1, c2, 0.5), c1, c2 };
  });
}

/** A polygon with its corners rounded, as a closed path. */
export function rounded(points: Point[], radius: number) {
  const corners = round(points, radius);
  return `M${xy(corners[0].p2)}${[...corners.slice(1), corners[0]].map((c) => `L${xy(c.p1)}Q${xy(c.P)} ${xy(c.p2)}`).join("")}Z`;
}

/** Along a rounded polygon, from the middle of corner i's curve to the middle of its neighbour j's, `by` lower down. */
function walk(corners: Corner[], i: number, j: number, by = 0) {
  const X = corners[i];
  const Y = corners[j];
  const s = (p: Point) => xy(down(p, by));
  return j === (i + 1) % corners.length ? `Q${s(X.c2)} ${s(X.p2)}L${s(Y.p1)}Q${s(Y.c1)} ${s(Y.m)}` : `Q${s(X.c1)} ${s(X.p1)}L${s(Y.p2)}Q${s(Y.c2)} ${s(Y.m)}`;
}

// ── timing ──────────────────────────────────────────────────────────────

/** Timing for the shapes in a group: outline drawn from `draw`, colour in from `colour`. */
export const drawn = (draw: number, colour: number, length = 0.1) => ({ "--ds": draw, "--dl": length, "--fs": colour, "--fl": 0.08 }) as CSSProperties;
/** Timing for anything that simply fades in. */
export const between = (start: number, length: number) => ({ "--s": start, "--l": length }) as CSSProperties;

// ── shapes ──────────────────────────────────────────────────────────────

type BlockProps = { x0: number; x1: number; y0: number; y1: number; z: number; h: number; tone: Tone; r?: number; width?: number };

/**
 * A soft block standing on the desk: its top a rounded parallelogram, and its
 * sides the top swept straight down, so every vertical edge is rounded too. The
 * side towards the viewer on the left and the one on the right take their own
 * tones, split where the front corner comes down.
 */
export function Block({ x0, x1, y0, y1, z, h, tone, r = 8, width = 1.5 }: BlockProps) {
  const t = z + h;
  // back, right, front and left corners of the top
  const c = round([at(x0, y0, t), at(x1, y0, t), at(x1, y1, t), at(x0, y1, t)], r);
  const [, right, front, left] = c;
  const faceLeft = `M${xy(left.m)}L${xy(down(left.m, h))}${walk(c, 3, 2, h)}L${xy(front.m)}${walk(c, 2, 3)}Z`;
  const faceRight = `M${xy(front.m)}L${xy(down(front.m, h))}${walk(c, 2, 1, h)}L${xy(right.m)}${walk(c, 1, 2)}Z`;
  const top = rounded(c.map((corner) => corner.P), r);
  // one stroke: round the top, then down the left, along the bottom and up the right
  const outline = `M${xy(left.m)}${walk(c, 3, 0)}${walk(c, 0, 1)}${walk(c, 1, 2)}${walk(c, 2, 3)}L${xy(down(left.m, h))}${walk(c, 3, 2, h)}${walk(c, 2, 1, h)}L${xy(right.m)}`;
  return (
    <>
      {h > 0 && <path d={faceLeft} fill={tone.left} className={styles.fill} />}
      {h > 0 && <path d={faceRight} fill={tone.right} className={styles.fill} />}
      <path d={top} fill={tone.top} className={styles.fill} />
      <path d={outline} pathLength={1} fill="none" stroke={EDGE} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={styles.part} />
    </>
  );
}

type DetailProps = { d: string; fill?: string; stroke?: string; width?: number; style?: CSSProperties };

/** A small shape — a panel, a dot, a vent — drawn and filled with the rest. */
export function Detail({ d, fill = "none", stroke = EDGE, width = 1.2, style }: DetailProps) {
  return <path d={d} pathLength={1} fill={fill} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={styles.part} style={style} />;
}

type WireProps = { d: string; width?: number; colour?: string; light?: string; style?: CSSProperties };

/** A cable: a soft edge, its colour, and a highlight along its upper side. */
export function Wire({ d, width = 4, colour = "#7c817a", light = "#b8bcb5", style }: WireProps) {
  const path = { d, pathLength: 1, fill: "none", strokeLinecap: "round", strokeLinejoin: "round", className: styles.part } as const;
  return (
    <g style={style}>
      <path {...path} stroke={EDGE} strokeWidth={width + 2.2} />
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

/**
 * The filters the desk is drawn through, matching the site's own: `desk-card`
 * wobbles an edge slowly along its length like a card's and throws the cards'
 * hard shadow, 5 across and 5 down with a unit of spread; `desk-chip` has the
 * finer grain and smaller shadow of a chip or a button.
 */
export function DeskFilters() {
  const filter = (id: string, frequency: number, octaves: number, scale: number, offset: number, spread: number) => (
    <filter id={id} x="-15%" y="-15%" width="135%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={octaves} result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" result="ink" />
      <feMorphology in="ink" operator="dilate" radius={spread} result="spread" />
      <feOffset in="spread" dx={offset} dy={offset} result="moved" />
      <feFlood floodColor={INK} floodOpacity={0.4} />
      <feComposite in2="moved" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="ink" />
      </feMerge>
    </filter>
  );
  return (
    <defs>
      {filter("desk-card", 0.035, 2, 4, 5, 1)}
      {filter("desk-chip", 0.1, 3, 2.5, 2.5, 0.8)}
      {/* a wobble with no shadow, for the parts laid flat on something else */}
      <filter id="desk-ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency={0.1} numOctaves={3} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={2} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
}
