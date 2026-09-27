import styles from "./Map.module.css";

/**
 * The land the experience map is drawn on, in the site's own hand: pastel
 * fills, soft ink edges and the cards' hard offset shadow. A river runs down
 * from the hills to the sea in the corner; there are trees, a compass, a title
 * and a scale. Almost all of it stands still — only the waves, a boat and the
 * clouds move — and the road, the places on it and the van belong to CareerMap.
 */

export const W = 800;
export const H = 440;

/** The road, from its start through each place on it in turn: freelance, Iqra, UI/UX, Growstep, Anma Tech. */
export const ROAD =
  "M56,392 C74,378 92,364 110,350 C160,312 200,284 250,262 C300,240 340,316 400,320 C460,324 470,230 520,200 C570,170 630,146 690,130";
/** Where the road crosses the river. */
export const BRIDGE = { x: 334.7, y: 290.8 };
/** Where it goes next, pencilled in. */
export const FUTURE = "M690,130 C730,119 760,96 784,72 C796,60 812,52 840,46";

const RIVER = "M410,116 C400,150 364,172 358,210 C352,250 326,282 336,320 C346,360 420,378 480,388 C524,396 556,402 580,414";
const SEA = "M800,236 C760,248 724,274 732,314 C740,356 692,376 640,370 C590,364 560,392 568,440 L800,440 Z";

const INK = "#2d2f2b";
export const LAND = "#e8ebe1";
const PAPER = "#f4f4f0";
const edge = { stroke: INK, strokeOpacity: 0.55, strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;

// ── the hills ──────────────────────────────────────────────────────────────

const BASE = 116;
/** back to front */
const PEAKS = [
  { x0: 330, x1: 440, ax: 384, ay: 34, fill: "#c9cdc6" },
  { x0: 286, x1: 368, ax: 326, ay: 56, fill: "#d9dcd5" },
  { x0: 398, x1: 478, ax: 438, ay: 60, fill: "#d9dcd5" },
  { x0: 456, x1: 512, ax: 484, ay: 80, fill: "#d2d5cf" },
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
  [34, 134, 7, false],
  [50, 146, 8, false],
  [22, 158, 6, true],
  [66, 252, 6, true],
  [82, 242, 7, false],
  [150, 418, 7, false],
  [168, 428, 6, true],
  [132, 430, 6, false],
  [176, 186, 6, true],
  [192, 176, 7, false],
  [446, 256, 7, false],
  [462, 246, 6, true],
  [300, 410, 7, false],
  [318, 420, 6, true],
  [340, 414, 8, false],
  [540, 92, 6, true],
  [556, 82, 7, false],
  [572, 96, 6, true],
  [758, 176, 7, true],
  [774, 166, 6, false],
  [236, 346, 7, false],
  [252, 358, 6, true],
  [612, 300, 6, false],
  [520, 318, 6, true],
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
  [160, 232],
  [488, 292],
  [612, 110],
  [48, 306],
  [690, 232],
  [262, 404],
  [226, 122],
];

/** the sea's small waves */
const WAVES: [number, number][] = [
  [690, 344],
  [772, 300],
  [736, 424],
  [620, 420],
  [786, 408],
  [768, 262],
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
        {[100, 200, 300, 400, 500, 600, 700].map((x) => (
          <path key={`x${x}`} d={`M${x},14 V${H - 14}`} />
        ))}
        {[88, 176, 264, 352].map((y) => (
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
        <rect x={16} y={14} width={190} height={54} rx={12} fill={PAPER} {...edge} />
      </g>
      <text x={30} y={37} fontSize={13} fontWeight={700} letterSpacing={1.4} fill={INK}>
        THE ROAD SO FAR
      </text>
      <path d="M30,44 C74,42 128,43 192,41" stroke="#bc4e26" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <text x={30} y={58} fontSize={8.5} fontWeight={700} fill="#5e625c">
        2023 → today · Rawalpindi
      </text>

      {/* the compass, out at sea */}
      <g transform="translate(756 384)" filter="url(#desk-chip)">
        <circle r={23} fill={PAPER} {...edge} />
        <circle r={17.5} fill="none" stroke="#9a9f98" strokeWidth={1} strokeDasharray="2 3" />
        <path d="M0,-21 L4.5,-4.5 L0,0 Z" fill="#bc4e26" {...edge} strokeWidth={1} />
        <path d="M0,-21 L-4.5,-4.5 L0,0 Z" fill="#de9372" {...edge} strokeWidth={1} />
        <path d="M0,21 L4.5,4.5 L0,0 Z M0,21 L-4.5,4.5 L0,0 Z" fill={PAPER} {...edge} strokeWidth={1} />
        <path d="M21,0 L4.5,4.5 L0,0 Z M-21,0 L-4.5,-4.5 L0,0 Z" fill="#b8bcb5" {...edge} strokeWidth={1} />
        <path d="M21,0 L4.5,-4.5 L0,0 Z M-21,0 L-4.5,4.5 L0,0 Z" fill={PAPER} {...edge} strokeWidth={1} />
      </g>
      <text x={756} y={355} fontSize={9} fontWeight={700} textAnchor="middle" fill="#9c3f1d">
        N
      </text>

      {/* the scale, which owns up */}
      <g transform="translate(22 424)">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 20} y={0} width={20} height={5} fill={i % 2 ? PAPER : "#5e625c"} {...edge} strokeWidth={1} />
        ))}
        <text x={0} y={-5} fontSize={7} fontWeight={700} fill="#5e625c">
          not to scale
        </text>
      </g>

      {/* a boat, bobbing */}
      <g transform="translate(662 424)">
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

/** The clouds, drifting over it all: drawn in a layer of their own, so the land under them is not redrawn as they pass. */
export function Sky() {
  return (
    <g aria-hidden="true">
      {[
        { y: 16, t: "80s", delay: "-8s", s: 1 },
        { y: 150, t: "104s", delay: "-60s", s: 0.8 },
      ].map((c) => (
        <g key={c.y} className={styles.cloud} style={{ animationDuration: c.t, animationDelay: c.delay }}>
          <path d={CLOUD} transform={`translate(0 ${c.y}) scale(${c.s})`} fill={PAPER} fillOpacity={0.94} stroke={INK} strokeOpacity={0.4} strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
}
