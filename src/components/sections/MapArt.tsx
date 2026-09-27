import styles from "./Map.module.css";

/**
 * The land the experience map is drawn on, in the site's own hand: pastel
 * fills, soft ink edges and the cards' hard offset shadow. A river runs down
 * from the hills to the sea in the corner; there are trees, a compass, a title
 * and a scale. Almost all of it stands still — only the clouds, the waves and a
 * boat move — and the road and the places on it belong to CareerMap.
 */

export const W = 640;
export const H = 400;

/** The road, from its start through each place on it in turn: freelance, Iqra, UI/UX, Growstep, Anma Tech. */
export const ROAD = "M62,323 C69,315.5 76.5,308 84,300 C120,262 150,236 196,214 C236,196 262,258 316,268 C362,276 372,200 404,170 C436,140 488,126 534,112";
/** Where the road crosses the river, and the way it runs there. */
export const BRIDGE = { x: 256, y: 234.7 };
/** Where it goes next, pencilled in. */
export const FUTURE = "M534,112 C566,103 586,88 602,70 C614,57 630,48 656,42";

const RIVER = "M300,100 C290,132 250,160 256,200 C262,236 244,262 262,296 C282,332 352,330 400,342 C424,348 440,352 452,360";
const SEA = "M640,178 C602,190 572,214 578,252 C584,292 546,310 504,304 C462,298 436,324 446,356 C452,378 440,394 432,400 L640,400 Z";

const INK = "#2d2f2b";
const LAND = "#e8ebe1";
const PAPER = "#f4f4f0";
const edge = { stroke: INK, strokeOpacity: 0.55, strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;

// ── the hills ──────────────────────────────────────────────────────────────

const BASE = 106;
/** back to front */
const PEAKS = [
  { x0: 236, x1: 338, ax: 288, ay: 32, fill: "#c9cdc6" },
  { x0: 194, x1: 274, ax: 232, ay: 52, fill: "#d9dcd5" },
  { x0: 298, x1: 372, ax: 336, ay: 58, fill: "#d9dcd5" },
  { x0: 352, x1: 404, ax: 378, ay: 76, fill: "#d2d5cf" },
];

type Peak = (typeof PEAKS)[number];

/** a point part of the way down one side of a peak */
const down = ({ x0, x1, ax, ay }: Peak, side: -1 | 1, f: number) => [ax + ((side < 0 ? x0 : x1) - ax) * f, ay + (BASE - ay) * f] as const;

function peak(p: Peak) {
  const [lx, ly] = down(p, -1, 0.14);
  const [rx, ry] = down(p, 1, 0.14);
  return `M${p.x0},${BASE} L${lx},${ly} Q${p.ax},${p.ay - 3} ${rx},${ry} L${p.x1},${BASE} Q${(p.x0 + p.x1) / 2},${BASE + 5} ${p.x0},${BASE} Z`;
}

function snow(p: Peak) {
  const [lx, ly] = down(p, -1, 0.14);
  const [rx, ry] = down(p, 1, 0.14);
  const [sx, sy] = down(p, -1, 0.34);
  const [ex] = down(p, 1, 0.34);
  return `M${sx},${sy} L${lx},${ly} Q${p.ax},${p.ay - 3} ${rx},${ry} L${ex},${sy} L${(p.ax + ex) / 2},${sy - 5} L${p.ax},${sy + 2} L${(sx + p.ax) / 2},${sy - 5} Z`;
}

function shade(p: Peak) {
  const [, sy] = down(p, 1, 0.34);
  return `M${p.ax + 2},${sy} L${p.x1 - 3},${BASE} L${p.ax + (p.x1 - p.ax) * 0.2},${BASE + 2} Z`;
}

// ── the trees: [x, y, size, pine?] with y at the foot of the trunk ─────────

const TREES: [number, number, number, boolean][] = [
  [34, 112, 7, false],
  [50, 124, 8, false],
  [22, 136, 6, true],
  [66, 200, 6, true],
  [82, 190, 7, false],
  [150, 354, 8, false],
  [168, 366, 6, true],
  [134, 374, 6, false],
  [338, 206, 7, false],
  [354, 196, 6, true],
  [302, 380, 7, false],
  [320, 388, 6, true],
  [342, 382, 8, false],
  [598, 154, 7, true],
  [614, 144, 6, false],
  [412, 76, 6, true],
  [448, 84, 7, false],
  [462, 72, 6, true],
  [476, 88, 7, false],
  [150, 120, 6, true],
  [164, 110, 7, false],
  [560, 236, 6, false],
];

function Tree({ x, y, r, pine, i }: { x: number; y: number; r: number; pine: boolean; i: number }) {
  if (pine) {
    return (
      <g>
        <path d={`M${x},${y} V${y - r * 0.9}`} {...edge} strokeWidth={1.6} />
        <path d={`M${x},${y - r * 3} L${x + r},${y - r * 0.9} L${x - r},${y - r * 0.9} Z`} fill="#9caf88" {...edge} />
        <path d={`M${x},${y - r * 3.6} L${x + r * 0.72},${y - r * 2} L${x - r * 0.72},${y - r * 2} Z`} fill="#9caf88" {...edge} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M${x},${y} V${y - r}`} {...edge} strokeWidth={1.6} />
      <circle cx={x} cy={y - r * 1.7} r={r} fill={i % 2 ? "#b1c29f" : "#cbd7bd"} {...edge} />
    </g>
  );
}

/** a little rise in the land: two bumps */
const HILLS: [number, number][] = [
  [140, 190],
  [420, 300],
  [372, 118],
  [44, 226],
  [540, 190],
  [236, 350],
];

/** the sea's small waves */
const WAVES: [number, number][] = [
  [536, 330],
  [610, 262],
  [566, 390],
  [474, 386],
  [622, 392],
  [590, 214],
];

/** Everything under the road: the land, its grid, the river and the sea. */
export function Ground({ clip }: { clip: string }) {
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={SEA} />
        </clipPath>
      </defs>
      <rect width={W} height={H} rx={18} fill={LAND} />

      {/* the grid of a map, faint */}
      <g stroke="#9a9f98" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="1 6" strokeLinecap="round">
        {[80, 160, 240, 320, 400, 480, 560].map((x) => (
          <path key={`x${x}`} d={`M${x},14 V${H - 14}`} />
        ))}
        {[80, 160, 240, 320].map((y) => (
          <path key={`y${y}`} d={`M14,${y} H${W - 14}`} />
        ))}
      </g>

      {/* the sea: a sandy shore, the water, and a ripple along the coast */}
      <path d={SEA} fill="none" stroke="#dcded8" strokeWidth={14} />
      <path d={SEA} fill="#cbd7bd" {...edge} filter="url(#desk-ink)" />
      <g clipPath={`url(#${clip})`}>
        <path d={SEA} transform="translate(9 9)" fill="none" stroke="#9caf88" strokeWidth={1.3} strokeDasharray="6 5" />
        <path d={SEA} transform="translate(20 20)" fill="none" stroke="#9caf88" strokeOpacity={0.5} strokeWidth={1.1} strokeDasharray="3 7" />
      </g>
      <g className={styles.waves} stroke="#80966b" strokeWidth={1.5} fill="none" strokeLinecap="round">
        {WAVES.map(([x, y], i) => (
          <path key={i} d={`M${x - 8},${y} q4,-4 8,0 t8,0`} style={{ animationDelay: `${i * -0.7}s` }} />
        ))}
      </g>

      {/* the river, down from the hills */}
      <g filter="url(#desk-ink)" fill="none" strokeLinecap="round">
        <path d={RIVER} stroke={INK} strokeOpacity={0.55} strokeWidth={9} />
        <path d={RIVER} stroke="#cbd7bd" strokeWidth={6.4} />
        <path d={RIVER} stroke="#f0f3ec" strokeWidth={1.2} strokeDasharray="4 9" />
      </g>

      <g stroke="#9a9f98" strokeWidth={1.3} fill="none" strokeLinecap="round">
        {HILLS.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x - 12},${y} q6,-7 12,0 q6,-7 12,0`} />
        ))}
      </g>
    </>
  );
}

/** Everything that stands up off the land: hills, trees, and the map's furniture. */
export function Scenery() {
  return (
    <>
      <g filter="url(#desk-chip)">
        {PEAKS.map((p) => (
          <g key={p.ax}>
            <path d={peak(p)} fill={p.fill} {...edge} />
            <path d={shade(p)} fill="#b8bcb5" fillOpacity={0.7} />
            <path d={snow(p)} fill={PAPER} {...edge} strokeWidth={1.1} />
          </g>
        ))}
      </g>

      <g filter="url(#desk-chip)">
        {TREES.map(([x, y, r, pine], i) => (
          <Tree key={`${x}-${y}`} x={x} y={y} r={r} pine={pine} i={i} />
        ))}
      </g>

      {/* the title, in its cartouche */}
      <g filter="url(#desk-chip)">
        <rect x={16} y={14} width={178} height={52} rx={12} fill={PAPER} {...edge} />
      </g>
      <text x={30} y={36} fontSize={12.5} fontWeight={700} letterSpacing={1.4} fill={INK}>
        THE ROAD SO FAR
      </text>
      <path d="M30,43 C70,41 120,42 180,40" stroke="#bc4e26" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <text x={30} y={56} fontSize={8} fontWeight={700} fill="#5e625c">
        2023 → today · Rawalpindi
      </text>

      {/* the compass, out at sea */}
      <g transform="translate(600 338)" filter="url(#desk-chip)">
        <circle r={23} fill={PAPER} {...edge} />
        <circle r={17.5} fill="none" stroke="#9a9f98" strokeWidth={1} strokeDasharray="2 3" />
        <path d="M0,-21 L4.5,-4.5 L0,0 Z" fill="#bc4e26" {...edge} strokeWidth={1} />
        <path d="M0,-21 L-4.5,-4.5 L0,0 Z" fill="#de9372" {...edge} strokeWidth={1} />
        <path d="M0,21 L4.5,4.5 L0,0 Z M0,21 L-4.5,4.5 L0,0 Z" fill={PAPER} {...edge} strokeWidth={1} />
        <path d="M21,0 L4.5,4.5 L0,0 Z M-21,0 L-4.5,-4.5 L0,0 Z" fill="#b8bcb5" {...edge} strokeWidth={1} />
        <path d="M21,0 L4.5,-4.5 L0,0 Z M-21,0 L-4.5,4.5 L0,0 Z" fill={PAPER} {...edge} strokeWidth={1} />
      </g>
      <text x={600} y={309} fontSize={9} fontWeight={700} textAnchor="middle" fill="#9c3f1d">
        N
      </text>

      {/* the scale, which owns up */}
      <g transform="translate(22 384)">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 20} y={0} width={20} height={5} fill={i % 2 ? PAPER : "#5e625c"} {...edge} strokeWidth={1} />
        ))}
        <text x={0} y={-5} fontSize={7} fontWeight={700} fill="#5e625c">
          not to scale
        </text>
      </g>

      {/* a boat, bobbing */}
      <g transform="translate(508 378)">
        <g className={styles.boat}>
          <path d="M0,-3 V-22" {...edge} strokeWidth={1.4} />
          <path d="M1.5,-21 L1.5,-5 L13,-5 Z" fill={PAPER} {...edge} strokeWidth={1.1} />
          <path d="M-1.5,-17 L-10,-5 L-1.5,-5 Z" fill="#e2e9da" {...edge} strokeWidth={1.1} />
          <path d="M-15,-3 L15,-3 L10,4 L-10,4 Z" fill="#de9372" {...edge} strokeWidth={1.2} />
        </g>
      </g>
    </>
  );
}

const CLOUD = "M0,12 C0,6 6,3 11,5 C13,-1 23,-2 27,4 C31,1 38,3 38,9 C43,9 45,12 44,14 L2,14 C0,14 0,13 0,12 Z";

/** The clouds, drifting over it all. */
export function Sky() {
  return (
    <g aria-hidden="true">
      {[
        { y: 18, t: "74s", delay: "-8s", s: 1 },
        { y: 118, t: "96s", delay: "-52s", s: 0.8 },
      ].map((c) => (
        <g key={c.y} className={styles.cloud} style={{ animationDuration: c.t, animationDelay: c.delay }}>
          <path d={CLOUD} transform={`translate(0 ${c.y}) scale(${c.s})`} fill={PAPER} fillOpacity={0.94} stroke={INK} strokeOpacity={0.4} strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
}
