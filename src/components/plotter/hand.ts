/**
 * The plotter's handwriting: a single-stroke letter set, and the layout of a
 * letter on its sheet.
 *
 * Each character is a few pen strokes on a small grid: capitals and figures
 * four wide and six tall, lowercase three wide with its x-height from 3 to 6,
 * descenders down to 8. Anything it has no strokes for (an emoji, say) is left
 * as a gap. The sheet is 300 by 200 in its own units: u across from the left,
 * v down from the top, with the contact form printed on it (FORM): a box for
 * the name and one for the email side by side, a big one for the message,
 * "— yours," and a send button. What is typed is written into its box.
 */

type Stroke = [number, number][];
type Glyph = { w: number; s: Stroke[] };

const O: Stroke = [[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]];
const BOWL: Stroke = [[3, 3.9], [2.3, 3], [0.8, 3], [0, 3.9], [0, 5.1], [0.8, 6], [2.3, 6], [3, 5.1]];
const HUMP: Stroke = [[0, 3.9], [0.7, 3], [2.2, 3], [3, 3.9]];

const G = (w: number, ...s: Stroke[]): Glyph => ({ w, s });

const GLYPHS: Record<string, Glyph> = {
  // capitals
  A: G(4, [[0, 6], [2, 0], [4, 6]], [[0.7, 4], [3.3, 4]]),
  B: G(4, [[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]),
  C: G(4, [[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]),
  D: G(4, [[0, 0], [0, 6], [3, 6], [4, 5], [4, 1], [3, 0], [0, 0]]),
  E: G(4, [[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]),
  F: G(4, [[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]),
  G: G(4, [[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3], [2, 3]]),
  H: G(4, [[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]),
  I: G(2, [[0, 0], [2, 0]], [[1, 0], [1, 6]], [[0, 6], [2, 6]]),
  J: G(4, [[4, 0], [4, 5], [3, 6], [1, 6], [0, 5]]),
  K: G(4, [[0, 0], [0, 6]], [[4, 0], [0, 4]], [[1.5, 2.8], [4, 6]]),
  L: G(4, [[0, 0], [0, 6], [4, 6]]),
  M: G(4.4, [[0, 6], [0, 0], [2.2, 3.4], [4.4, 0], [4.4, 6]]),
  N: G(4, [[0, 6], [0, 0], [4, 6], [4, 0]]),
  O: G(4, O),
  P: G(4, [[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]),
  Q: G(4, O, [[2.6, 4.6], [4.2, 6.4]]),
  R: G(4, [[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[2, 3], [4, 6]]),
  S: G(4, [[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]),
  T: G(4, [[0, 0], [4, 0]], [[2, 0], [2, 6]]),
  U: G(4, [[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]),
  V: G(4, [[0, 0], [2, 6], [4, 0]]),
  W: G(4.8, [[0, 0], [1.2, 6], [2.4, 2.6], [3.6, 6], [4.8, 0]]),
  X: G(4, [[0, 0], [4, 6]], [[4, 0], [0, 6]]),
  Y: G(4, [[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]),
  Z: G(4, [[0, 0], [4, 0], [0, 6], [4, 6]]),
  // lowercase
  a: G(3, [[3, 3], [3, 6]], BOWL),
  b: G(3, [[0, 0], [0, 6]], [[0, 3.9], [0.7, 3], [2.2, 3], [3, 3.9], [3, 5.1], [2.2, 6], [0.7, 6], [0, 5.1]]),
  c: G(3, [[3, 3.7], [2.3, 3], [0.8, 3], [0, 3.9], [0, 5.1], [0.8, 6], [2.3, 6], [3, 5.3]]),
  d: G(3, [[3, 0], [3, 6]], BOWL),
  e: G(3, [[0, 4.5], [3, 4.5], [3, 3.8], [2.3, 3], [0.8, 3], [0, 3.9], [0, 5.1], [0.8, 6], [2.3, 6], [3, 5.4]]),
  f: G(2.4, [[2.4, 0.3], [1.8, 0], [1.2, 0], [0.6, 0.6], [0.6, 6]], [[0, 3], [2, 3]]),
  g: G(3, [[3, 3], [3, 7.2], [2.3, 8], [0.8, 8], [0.1, 7.4]], BOWL),
  h: G(3, [[0, 0], [0, 6]], [...HUMP, [3, 6]]),
  i: G(1, [[0.5, 3], [0.5, 6]], [[0.5, 1.3], [0.5, 1.7]]),
  j: G(1.4, [[1.3, 3], [1.3, 7.3], [0.6, 8], [0, 7.7]], [[1.3, 1.3], [1.3, 1.7]]),
  k: G(3, [[0, 0], [0, 6]], [[2.8, 3], [0, 5]], [[1.1, 4.2], [3, 6]]),
  l: G(1.2, [[0.5, 0], [0.5, 5.3], [1.2, 6]]),
  m: G(4, [[0, 3], [0, 6]], [[0, 3.8], [0.6, 3], [1.4, 3], [2, 3.8], [2, 6]], [[2, 3.8], [2.6, 3], [3.4, 3], [4, 3.8], [4, 6]]),
  n: G(3, [[0, 3], [0, 6]], [...HUMP, [3, 6]]),
  o: G(3, [[0.8, 3], [2.2, 3], [3, 3.9], [3, 5.1], [2.2, 6], [0.8, 6], [0, 5.1], [0, 3.9], [0.8, 3]]),
  p: G(3, [[0, 3], [0, 8]], [[0, 3.9], [0.7, 3], [2.2, 3], [3, 3.9], [3, 5.1], [2.2, 6], [0.7, 6], [0, 5.1]]),
  q: G(3, [[3, 3], [3, 8]], BOWL),
  r: G(2.2, [[0, 3], [0, 6]], [[0, 4.1], [0.9, 3.1], [2.2, 3]]),
  s: G(2.9, [[2.7, 3.5], [2.1, 3], [0.8, 3], [0.1, 3.5], [0.2, 4.2], [2.7, 4.8], [2.9, 5.5], [2.2, 6], [0.8, 6], [0.1, 5.6]]),
  t: G(2.2, [[0.8, 1], [0.8, 5.3], [1.4, 6], [2.2, 6]], [[0, 3], [2.1, 3]]),
  u: G(3, [[0, 3], [0, 5.1], [0.8, 6], [2.3, 6], [3, 5.1]], [[3, 3], [3, 6]]),
  v: G(3, [[0, 3], [1.5, 6], [3, 3]]),
  w: G(4, [[0, 3], [1, 6], [2, 3.8], [3, 6], [4, 3]]),
  x: G(3, [[0, 3], [3, 6]], [[3, 3], [0, 6]]),
  y: G(3, [[0, 3], [1.5, 6]], [[3, 3], [1.2, 7.1], [0.6, 8], [0, 8]]),
  z: G(3, [[0, 3], [3, 3], [0, 6], [3, 6]]),
  // figures
  "0": G(4, O, [[3.4, 0.8], [0.6, 5.2]]),
  "1": G(2.4, [[0.6, 1.2], [1.8, 0], [1.8, 6]]),
  "2": G(4, [[0, 1], [1, 0], [3, 0], [4, 1], [4, 2.2], [0, 6], [4, 6]]),
  "3": G(4, [[0, 0.8], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [1.6, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5.2]]),
  "4": G(4, [[3, 6], [3, 0], [0, 4], [4, 4]]),
  "5": G(4, [[4, 0], [0.5, 0], [0.3, 2.8], [1.2, 2.4], [3, 2.4], [4, 3.4], [4, 5], [3, 6], [1, 6], [0, 5.2]]),
  "6": G(4, [[3.6, 0.5], [2.8, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1, 3], [0, 4]]),
  "7": G(4, [[0, 0], [4, 0], [1.6, 6]]),
  "8": G(4, [[1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3]]),
  "9": G(4, [[4, 2], [3, 3], [1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0.4, 5.5]]),
  // marks
  ".": G(0.8, [[0.4, 5.6], [0.4, 6]]),
  ",": G(0.8, [[0.6, 5.5], [0.6, 6.2], [0.1, 7]]),
  "!": G(1, [[0.5, 0], [0.5, 4.2]], [[0.5, 5.6], [0.5, 6]]),
  "?": G(4, [[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [2, 3.4], [2, 4.2]], [[2, 5.5], [2, 6]]),
  "'": G(0.8, [[0.4, 0], [0.4, 1.5]]),
  "’": G(0.8, [[0.6, 0], [0.6, 0.8], [0.1, 1.6]]),
  '"': G(1.6, [[0.3, 0], [0.3, 1.5]], [[1.3, 0], [1.3, 1.5]]),
  "-": G(3, [[0.3, 4], [2.7, 4]]),
  "–": G(4, [[0, 4], [4, 4]]),
  "—": G(5, [[0, 4], [5, 4]]),
  _: G(4, [[0, 6.4], [4, 6.4]]),
  ":": G(0.8, [[0.4, 3.4], [0.4, 3.8]], [[0.4, 5.6], [0.4, 6]]),
  ";": G(0.8, [[0.6, 3.4], [0.6, 3.8]], [[0.6, 5.5], [0.6, 6.2], [0.1, 7]]),
  "@": G(4.2, [[2.9, 2.6], [2.2, 2.2], [1.4, 2.5], [1.1, 3.6], [1.7, 4.4], [2.6, 4.1], [2.9, 2.6], [2.9, 3.9], [3.4, 4.5], [4.1, 3.9], [4.2, 2.4], [3.3, 1.2], [1.6, 1.1], [0.3, 2.2], [0.1, 4], [0.9, 5.4], [2.6, 5.8], [3.8, 5.4]]),
  "&": G(4, [[4, 6], [1.2, 2.3], [1, 1.2], [1.6, 0.3], [2.4, 0.4], [2.7, 1.3], [0.2, 4.1], [0.2, 5.2], [1, 6], [2.4, 6], [3.8, 4]]),
  "/": G(3, [[3, 0], [0, 6.4]]),
  "\\": G(3, [[0, 0], [3, 6.4]]),
  "|": G(1, [[0.5, -0.4], [0.5, 7]]),
  "(": G(1.6, [[1.4, -0.2], [0.4, 1.6], [0.4, 4.6], [1.4, 6.4]]),
  ")": G(1.6, [[0.2, -0.2], [1.2, 1.6], [1.2, 4.6], [0.2, 6.4]]),
  "[": G(1.6, [[1.4, -0.2], [0.2, -0.2], [0.2, 6.4], [1.4, 6.4]]),
  "]": G(1.6, [[0.2, -0.2], [1.4, -0.2], [1.4, 6.4], [0.2, 6.4]]),
  "<": G(3, [[3, 2.4], [0, 4], [3, 5.6]]),
  ">": G(3, [[0, 2.4], [3, 4], [0, 5.6]]),
  "+": G(3, [[0, 4], [3, 4]], [[1.5, 2.5], [1.5, 5.5]]),
  "=": G(3, [[0, 3.4], [3, 3.4]], [[0, 5], [3, 5]]),
  "*": G(3, [[1.5, 1], [1.5, 4]], [[0.2, 1.8], [2.8, 3.2]], [[2.8, 1.8], [0.2, 3.2]]),
  "#": G(4, [[1.2, 1.2], [0.8, 6]], [[3.2, 1.2], [2.8, 6]], [[0, 2.8], [4, 2.8]], [[0, 4.6], [4, 4.6]]),
  $: G(4, [[3.6, 1.2], [2.8, 0.8], [1, 0.8], [0.2, 1.6], [0.4, 2.6], [3.4, 3.6], [3.8, 4.6], [3, 5.4], [1, 5.4], [0.2, 4.8]], [[2, 0], [2, 6.2]]),
  "%": G(4, [[0, 6], [4, 0]], [[0.6, 0.4], [1.4, 0.4], [1.4, 1.6], [0.6, 1.6], [0.6, 0.4]], [[2.6, 4.4], [3.4, 4.4], [3.4, 5.6], [2.6, 5.6], [2.6, 4.4]]),
  "~": G(3, [[0, 4.2], [0.8, 3.6], [2.2, 4.4], [3, 3.8]]),
  "^": G(3, [[0, 2], [1.5, 0.4], [3, 2]]),
};

/** The gap after each character, and a space, in grid units. */
const GAP = 1.3;
const SPACE = 2.6;
/** The advance of a character we have no strokes for. */
const UNKNOWN = 3;

const advance = (ch: string) => (ch === " " ? SPACE : (GLYPHS[ch]?.w ?? UNKNOWN) + GAP);

/** How wide `text` is, in sheet units, at scale `k`. */
export const measure = (text: string, k: number) => [...text].reduce((w, ch) => w + advance(ch) * k, 0);

/** The pen strokes of `ch` with its top left at (u, v), at scale `k`, as SVG paths. */
function strokes(ch: string, u: number, v: number, k: number): string[] {
  const glyph = GLYPHS[ch];
  if (!glyph) return [];
  return glyph.s.map((stroke) => `M${stroke.map(([x, y]) => `${(u + x * k).toFixed(2)} ${(v + y * k).toFixed(2)}`).join("L")}`);
}

// ── the form on the sheet, and the letter written into it ───────────────

export type Letter = { name: string; email: string; message: string };
/** The parts of the form that are typed into. */
export type Input = keyof Letter;
/** Everything the pen writes: what is typed, and the name signed again after "yours,". */
export type Field = Input | "sign";
/** One character, placed: its key says what and where, so a character that moves is written again. */
export type Mark = { key: string; strokes: string[] };
/** Where a character starts on the sheet: across, and the baseline it sits on. */
export type Spot = [number, number];
/** A box on the form, in sheet units. */
export type Box = { u0: number; u1: number; v0: number; v1: number };

/** The form printed on the sheet: its boxes, and where its labels and the rest of it are. */
export const FORM = {
  name: { u0: 14, u1: 143, v0: 22, v1: 44 },
  email: { u0: 157, u1: 286, v0: 22, v1: 44 },
  message: { u0: 14, u1: 286, v0: 62, v1: 160 },
  send: { u0: 204, u1: 286, v0: 168, v1: 190 },
  /** "— yours," at the foot, and where the name is signed after it */
  yours: { u: 16, v: 184 },
  sign: { u: 62, v: 185 },
} as const;

/** The size of the writing: the grid unit, in sheet units; and how small it may get to fit a long name or email. */
const K = 1.45;
const SMALLEST = 0.85;
/** The lines in the message box: their baselines. */
const MESSAGE_LINES = [79, 97, 115, 133, 151];
/** How far in from a box's sides the writing keeps. */
const INSET = { left: 7, right: 6 };

/** One run of writing from `left` along `baseline`: its marks, and where each character starts (and the next would). */
function write(field: Field, text: string, from: number, left: number, baseline: number, k: number) {
  const marks: Mark[] = [];
  const spots: Spot[] = [];
  let u = left;
  const top = baseline - 6 * k;
  [...text].forEach((ch, i) => {
    spots.push([u, baseline]);
    if (ch !== " ") {
      const drawn = strokes(ch, u, top, k);
      if (drawn.length) marks.push({ key: `${field}:${from + i}:${ch}:${u.toFixed(1)}:${baseline}:${k.toFixed(2)}`, strokes: drawn });
    }
    u += advance(ch) * k;
  });
  spots.push([u, baseline]);
  return { marks, spots };
}

/** Text with dots on the end, cut down until it fits `width` at `k`. */
function trail(text: string, width: number, k: number) {
  let out = text;
  while (out && measure(`${out}...`, k) > width) out = out.slice(0, -1);
  return `${out}...`;
}

/** Text as it is if it fits `width` at `k`, or cut short with dots on the end. */
const cut = (text: string, width: number, k: number) => (measure(text, k) <= width ? text : trail(text, width, k));

/** A one-line box: the writing shrinks a little to fit, and is cut short if it still does not. */
function oneLine(field: Field, text: string, box: Box) {
  const left = box.u0 + INSET.left;
  const width = box.u1 - INSET.right - left;
  const wide = measure(text, 1);
  const k = wide * K > width ? Math.max(SMALLEST, width / wide) : K;
  const shown = cut(text, width, k);
  const { marks, spots } = write(field, shown, 0, left, box.v0 + 15.5, k);
  // a caret past what fits waits at the end of it
  return { marks, spots: Array.from({ length: text.length + 1 }, (_, i) => spots[Math.min(i, spots.length - 1)]) };
}

/** Where each line of a message starts and ends in it: word by word, a word broken only if it is too long for a line. */
function lines(text: string, width: number) {
  const spans: { start: number; end: number }[] = [];
  let base = 0;
  for (const paragraph of text.split("\n")) {
    let start = base;
    let end = base;
    let at = base;
    for (const word of paragraph.split(" ")) {
      const wordEnd = at + word.length;
      if (measure(text.slice(start, wordEnd), K) <= width) {
        end = wordEnd;
      } else {
        if (end > start) spans.push({ start, end });
        let from = at;
        while (measure(text.slice(from, wordEnd), K) > width) {
          let to = wordEnd;
          while (to > from + 1 && measure(text.slice(from, to), K) > width) to--;
          spans.push({ start: from, end: to });
          from = to;
        }
        start = from;
        end = wordEnd;
      }
      at = wordEnd + 1;
    }
    spans.push({ start, end });
    base += paragraph.length + 1;
  }
  return spans;
}

/** The message, in its box: as many lines as fit, the last cut short with dots if there is more. */
function message(text: string) {
  const box = FORM.message;
  const left = box.u0 + INSET.left;
  const width = box.u1 - INSET.right - left;
  const all = lines(text, width);
  const spans = all.slice(0, MESSAGE_LINES.length);
  const marks: Mark[] = [];
  const spots: Spot[] = Array.from({ length: text.length + 1 }, () => [left, MESSAGE_LINES[0]] as Spot);
  let last: Spot = [left, MESSAGE_LINES[0]];
  spans.forEach((span, n) => {
    let line = text.slice(span.start, span.end);
    if (n === spans.length - 1 && all.length > spans.length) line = trail(line, width, K);
    const run = write("message", line, span.start, left, MESSAGE_LINES[n], K);
    marks.push(...run.marks);
    run.spots.forEach((spot, i) => {
      if (span.start + i <= text.length) spots[span.start + i] = spot;
    });
    last = run.spots[run.spots.length - 1];
  });
  // characters past what fits: the caret waits at the end of the writing
  const shownTo = spans.length ? spans[spans.length - 1].end : 0;
  for (let i = shownTo + 1; i <= text.length; i++) spots[i] = last;
  return { marks, spots };
}

/** Everything written on the form for this letter, part by part, and where each character of what is typed stands. */
export function layout(letter: Letter): { marks: Record<Field, Mark[]>; spots: Record<Input, Spot[]> } {
  const name = oneLine("name", letter.name, FORM.name);
  const email = oneLine("email", letter.email, FORM.email);
  const body = message(letter.message);
  const signed = letter.name.trim();
  const sign = signed ? write("sign", cut(signed, FORM.send.u0 - 10 - FORM.sign.u, 1.5), 0, FORM.sign.u, FORM.sign.v, 1.5).marks : [];
  return {
    marks: { name: name.marks, email: email.marks, message: body.marks, sign },
    spots: { name: name.spots, email: email.spots, message: body.spots },
  };
}
