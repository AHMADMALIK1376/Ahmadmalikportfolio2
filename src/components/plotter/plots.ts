/**
 * What the plotter draws: a few of Ahmad's projects, as the diagrams he would
 * sketch of them, each a list of pen strokes in the order the pen takes them.
 *
 * Everything is in the paper's own units: u across the sheet from its left
 * edge, v down it from the top, on a sheet 300 by 200. The pen writes its own
 * labels, in a single-stroke letter set drawn on a grid four wide and six tall.
 */

type Stroke = [number, number][];

const LETTERS: Record<string, Stroke[]> = {
  A: [[[0, 6], [2, 0], [4, 6]], [[0.7, 4], [3.3, 4]]],
  B: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]],
  D: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 1], [3, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  G: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3], [2, 3]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [[[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]]],
  P: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]],
  R: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[2, 3], [4, 6]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
  "?": [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [2, 3.4], [2, 4.2]], [[2, 5.5], [2, 6]]],
  "-": [[[0.6, 3], [3.4, 3]]],
};

const f = (n: number) => n.toFixed(1);
const path = (points: Stroke) => `M${points.map(([u, v]) => `${f(u)} ${f(v)}`).join("L")}`;

/** Words, `size` tall with their top left at (u, v): one stroke for each stroke of each letter. */
function words(text: string, u: number, v: number, size: number): string[] {
  const k = size / 6;
  let x = u;
  const out: string[] = [];
  for (const ch of text) {
    if (ch === " ") {
      x += 3.6 * k;
      continue;
    }
    for (const stroke of LETTERS[ch] ?? []) out.push(path(stroke.map(([a, b]) => [x + a * k, v + b * k])));
    x += 5.6 * k;
  }
  return out;
}

/** How wide `words` will be. */
const wide = (text: string, size: number) => ([...text].reduce((w, ch) => w + (ch === " " ? 3.6 : 5.6), 0) - 1.6) * (size / 6);

const line = (...points: Stroke) => path(points);

/** A box with rounded corners, drawn in one stroke from the middle of its top. */
function box(u0: number, v0: number, u1: number, v1: number, r: number) {
  const m = (u0 + u1) / 2;
  return `M${f(m)} ${f(v0)}L${f(u1 - r)} ${f(v0)}Q${f(u1)} ${f(v0)} ${f(u1)} ${f(v0 + r)}L${f(u1)} ${f(v1 - r)}Q${f(u1)} ${f(v1)} ${f(u1 - r)} ${f(v1)}L${f(u0 + r)} ${f(v1)}Q${f(u0)} ${f(v1)} ${f(u0)} ${f(v1 - r)}L${f(u0)} ${f(v0 + r)}Q${f(u0)} ${f(v0)} ${f(u0 + r)} ${f(v0)}Z`;
}

/** A circle, drawn round from its right. */
const circle = (u: number, v: number, r: number) => `M${f(u + r)} ${f(v)}A${r} ${r} 0 1 1 ${f(u - r)} ${f(v)}A${r} ${r} 0 1 1 ${f(u + r)} ${f(v)}`;

/** An arrow from a to b: its shaft, then its head. */
function arrow(a: [number, number], b: [number, number], head = 5) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const [dx, dy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const back: [number, number] = [b[0] - dx * head, b[1] - dy * head];
  return [line(a, b), line([back[0] - dy * head * 0.8, back[1] + dx * head * 0.8], b, [back[0] + dy * head * 0.8, back[1] - dx * head * 0.8])];
}

/** A line between two circles, from edge to edge. */
function link(a: [number, number], b: [number, number], r: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [dx, dy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  return line([a[0] + dx * r, a[1] + dy * r], [b[0] - dx * r, b[1] - dy * r]);
}

/** Words centred on u. */
const centred = (text: string, u: number, v: number, size: number) => words(text, u - wide(text, size) / 2, v, size);

export type Plot = {
  /** what the machine's display calls it */
  name: string;
  /** the pen it is drawn with */
  ink: string;
  strokes: string[];
};

// ── Folium: the editor, with two people writing in it at once ────────────
const folium = (): string[] => {
  const text: [number, number][] = [
    [74, 250],
    [88, 268],
    [102, 214],
    [116, 258],
    [130, 236],
    [144, 262],
    [158, 190],
  ];
  return [
    ...words("FOLIUM", 20, 14, 13),
    box(20, 40, 280, 186, 8),
    line([20, 58], [280, 58]),
    circle(32, 49, 3.2),
    circle(43, 49, 3.2),
    circle(54, 49, 3.2),
    box(206, 44, 220, 54, 2),
    box(226, 44, 240, 54, 2),
    box(246, 44, 270, 54, 3),
    line([78, 58], [78, 186]),
    line([30, 72], [66, 72]),
    line([30, 86], [60, 86]),
    line([30, 100], [64, 100]),
    line([30, 114], [56, 114]),
    ...text.map(([v, end]) => line([92, v], [end, v])),
    // two cursors, each with its writer's flag
    line([216, 96], [216, 108]),
    box(216, 86, 232, 96, 1.5),
    ...words("A", 221, 88, 6),
    line([192, 152], [192, 164]),
    box(192, 142, 208, 152, 1.5),
    ...words("M", 197, 144, 6),
  ];
};

// ── NeuraCache: a small network, built forward layer by layer ───────────
const neuracache = (): string[] => {
  const R = 10;
  const input: [number, number][] = [62, 102, 142].map((v) => [62, v + 16]);
  const hidden: [number, number][] = [62, 98, 134, 170].map((v) => [150, v]);
  const output: [number, number][] = [96, 144].map((v) => [238, v]);
  return [
    ...words("NEURACACHE", 20, 14, 12),
    ...input.map(([u, v]) => circle(u, v, R)),
    ...input.flatMap((a) => hidden.map((b) => link(a, b, R))),
    ...hidden.map(([u, v]) => circle(u, v, R)),
    ...hidden.flatMap((a) => output.map((b) => link(a, b, R))),
    ...output.map(([u, v]) => circle(u, v, R)),
    ...centred("IN", 62, 184, 8),
    ...centred("OUT", 238, 164, 8),
  ];
};

// ── GraphForge: bars, a line through them, and one bar hatched ───────────
const graphforge = (): string[] => {
  const base = 178;
  const bars = [46, 84, 64, 112, 94].map((h, i) => ({ u: 52 + i * 44, h }));
  const tops: [number, number][] = bars.map(({ u, h }) => [u + 14, base - h - 14]);
  const tall = bars[3];
  return [
    ...words("GRAPHFORGE", 20, 14, 12),
    line([36, 40], [36, base], [284, base]),
    line([31, 48], [36, 40], [41, 48]),
    line([276, base - 5], [284, base], [276, base + 5]),
    ...bars.map(({ u }) => line([u + 14, base], [u + 14, base + 6])),
    ...bars.map(({ u, h }) => line([u, base], [u, base - h], [u + 28, base - h], [u + 28, base])),
    ...[106, 124, 142, 160, 178].map((v) => line([tall.u, v], [tall.u + 28, v - 28])),
    line(...tops),
    ...tops.map(([u, v]) => circle(u, v, 3.5)),
  ];
};

// ── the Bid & Proposal Engine: a tender in, a GO or a NO-GO out ──────────
const bids = (): string[] => [
  ...words("BID ENGINE", 20, 14, 12),
  box(20, 50, 102, 80, 6),
  ...centred("TENDER", 61, 61, 9),
  ...arrow([102, 65], [128, 65]),
  box(128, 50, 210, 80, 6),
  ...centred("CLAUDE", 169, 61, 9),
  ...arrow([169, 80], [169, 100]),
  line([169, 100], [199, 124], [169, 148], [139, 124], [169, 100]),
  ...centred("GO?", 169, 119, 9),
  ...arrow([199, 124], [226, 124]),
  ...words("Y", 207, 111, 7),
  box(226, 109, 284, 139, 6),
  ...centred("DOCX", 255, 120, 9),
  ...arrow([169, 148], [169, 168]),
  ...words("N", 176, 152, 7),
  ...centred("NO-GO", 169, 174, 8),
];

export const PLOTS: Plot[] = [
  { name: "FOLIUM", ink: "#2d2f2b", strokes: folium() },
  { name: "NEURACACHE", ink: "#9c3f1d", strokes: neuracache() },
  { name: "GRAPHFORGE", ink: "#4c5e3e", strokes: graphforge() },
  { name: "BID ENGINE", ink: "#2d2f2b", strokes: bids() },
];

/** The sheet's size, in its own units. */
export const SHEET = { w: 300, h: 200 };
