/**
 * The plotter's handwriting: a single-stroke letter set, and the layout of a
 * letter on its sheet.
 *
 * Each character is a few pen strokes on a small grid: capitals and figures
 * four wide and six tall, lowercase three wide with its x-height from 3 to 6,
 * descenders down to 8. Anything it has no strokes for (an emoji, say) is left
 * as a gap. The sheet is 300 by 200 in its own units: u across from the left,
 * v down from the top, ruled like the notebook page the contact form is on.
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

// ── the letter on the sheet ─────────────────────────────────────────────

export type Letter = { name: string; email: string; message: string };
export type Field = "greeting" | "message" | "sign" | "email";
/** One character, placed: its key says what and where, so a character that moves is written again. */
export type Mark = { key: string; strokes: string[] };

/** The rules on the sheet: the baseline of each line of writing. */
export const RULES = [30, 52, 74, 96, 118, 140, 162, 184];
/** The red margin, and where the writing starts and must end. */
export const MARGIN = 28;
const LEFT = 34;
const RIGHT = 292;
/** The size of the writing: the grid unit, in sheet units. */
const K = 1.8;
const GREETING = "Dear Ahmad,";
/** Which lines each part of the letter is written on. */
const MESSAGE_LINES = RULES.slice(1, 6);
const SIGN_LINE = RULES[6];
const EMAIL_LINE = RULES[7];

/** Breaks text into lines no wider than the page, word by word, breaking a word only if it is too long for a line of its own. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (measure(next, K) <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      let rest = word;
      while (measure(rest, K) > width) {
        let n = rest.length;
        while (n > 1 && measure(rest.slice(0, n), K) > width) n--;
        lines.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

/** The marks for one line of writing, its baseline at `line`, numbered on from `from`. */
function write(field: Field, text: string, line: number, from = 0): Mark[] {
  const marks: Mark[] = [];
  let u = LEFT;
  const top = line - 6 * K;
  [...text].forEach((ch, i) => {
    if (ch !== " ") marks.push({ key: `${field}:${from + i}:${ch}:${u.toFixed(1)}:${line}`, strokes: strokes(ch, u, top, K) });
    u += advance(ch) * K;
  });
  return marks.filter((m) => m.strokes.length);
}

/** Everything written on the sheet for this letter, part by part, in the order the pen writes it. */
export function layout(letter: Letter, greeted: boolean): Record<Field, Mark[]> {
  const width = RIGHT - LEFT;
  let lines = wrap(letter.message, width);
  // a message too long for the page: as much as fits, and an ellipsis
  if (lines.length > MESSAGE_LINES.length) {
    lines = lines.slice(0, MESSAGE_LINES.length);
    let last = lines[lines.length - 1];
    while (last && measure(`${last}...`, K) > width) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}...`;
  }
  let count = 0;
  const message = lines.flatMap((text, i) => {
    const marks = write("message", text, MESSAGE_LINES[i], count);
    count += text.length + 1;
    return marks;
  });
  const fit = (text: string) => {
    let out = text;
    while (out && measure(out, K) > width) out = out.slice(0, -1);
    return out;
  };
  const name = letter.name.trim();
  return {
    greeting: greeted ? write("greeting", GREETING, RULES[0]) : [],
    message,
    sign: name ? write("sign", fit(`yours, ${name}`), SIGN_LINE) : [],
    email: write("email", fit(letter.email.trim()), EMAIL_LINE),
  };
}
