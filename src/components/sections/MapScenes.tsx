import type { ReactNode } from "react";

/**
 * Little pictures of each place on the experience road, drawn the way the
 * site's cards are: pastel fills, soft ink edges and (through the chip filter)
 * the hard offset shadow. Each stands on its own patch of grass, in a box 220
 * wide and 170 tall with the ground along the bottom, and is set down on the
 * map beside its stop, on the side of the road the stop's card is not.
 */

export const SCENE = { w: 220, h: 170 };

const INK = "#2d2f2b";
const edge = { stroke: INK, strokeOpacity: 0.55, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const thin = { ...edge, strokeWidth: 1.1 } as const;
const PAPER = "#f4f4f0";

/** A patch of grass for a picture to stand on. */
function Ground() {
  return <path d="M18 152c22-9 58-12 92-12s72 3 94 12c-20 8-58 11-94 11s-72-3-92-11Z" fill="#dfe6d3" {...thin} strokeOpacity={0.35} />;
}

export function Tree({ x, y, r = 9, pine = false }: { x: number; y: number; r?: number; pine?: boolean }) {
  if (pine) {
    return (
      <g>
        <path d={`M${x},${y} V${y - r}`} {...edge} />
        <path d={`M${x},${y - r * 3.2} L${x + r * 1.05},${y - r} L${x - r * 1.05},${y - r} Z`} fill="#9caf88" {...edge} />
        <path d={`M${x},${y - r * 3.9} L${x + r * 0.75},${y - r * 2.2} L${x - r * 0.75},${y - r * 2.2} Z`} fill="#9caf88" {...edge} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M${x},${y} V${y - r * 1.1}`} {...edge} />
      <circle cx={x} cy={y - r * 1.9} r={r} fill={r % 2 ? "#b1c29f" : "#cbd7bd"} {...edge} />
    </g>
  );
}

/** Freelance: a home office, a light on at the desk in the window. */
function Home() {
  return (
    <>
      <rect x={128} y={40} width={14} height={30} rx={2} fill="#b8bcb5" {...edge} />
      <path d="M52 86 110 36l58 50Z" fill="#ecbea9" {...edge} />
      <rect x={60} y={84} width={100} height={64} rx={4} fill={PAPER} {...edge} />
      <rect x={100} y={112} width={20} height={36} rx={3} fill="#d0714c" {...edge} />
      <rect x={70} y={98} width={22} height={20} rx={2} fill="#e2e9da" {...thin} />
      <path d="M75 112h12M77 108h8v4" {...thin} fill="none" />
      <rect x={128} y={98} width={22} height={20} rx={2} fill="#e2e9da" {...thin} />
      <path d="M139 98v20M128 108h22" {...thin} />
      <circle cx={138} cy={30} r={5} fill={PAPER} {...thin} strokeOpacity={0.4} />
      <circle cx={146} cy={20} r={7} fill={PAPER} {...thin} strokeOpacity={0.4} />
      <Tree x={36} y={150} r={11} />
      <Tree x={188} y={150} r={8} pine />
    </>
  );
}

/** Iqra University: columns under a pediment, and a flag. */
function University() {
  return (
    <>
      <path d="M110 30V8" {...edge} />
      <path d="M111 9c8-3 13 3 22 0v12c-9 3-14-3-22 0Z" fill="#9caf88" {...thin} />
      <path d="M30 74 110 30l80 44Z" fill="#d9dcd5" {...edge} />
      <path d="M96 56l14-7 14 7-14 7Z M101 58v6c6 4 12 4 18 0v-6" fill="none" {...thin} />
      <rect x={40} y={72} width={140} height={68} rx={3} fill={PAPER} {...edge} />
      {[52, 80, 128, 156].map((x) => (
        <rect key={x} x={x} y={80} width={12} height={56} rx={2} fill="#e3e5e0" {...thin} />
      ))}
      <rect x={98} y={104} width={24} height={36} rx={10} fill="#b8bcb5" {...edge} />
      <rect x={30} y={138} width={160} height={8} rx={2} fill="#d2d5cf" {...edge} />
      <rect x={24} y={144} width={172} height={7} rx={2} fill="#e3e5e0" {...edge} />
    </>
  );
}

/** The Git workshop: a tree that grows like a Git history, a branch going off and merging back. */
function GitTree() {
  return (
    <>
      <circle cx={110} cy={70} r={46} fill="#e2e9da" {...edge} strokeOpacity={0.3} />
      <path d="M110 150V36" stroke="#7c817a" strokeWidth={6} strokeLinecap="round" />
      <path d="M110 118c24-4 40-16 40-36s-16-30-40-40" fill="none" stroke="#80966b" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M110 96c-18-2-30-10-32-24" fill="none" stroke="#80966b" strokeWidth={4} strokeLinecap="round" />
      {[
        [110, 134, "#d0714c"],
        [110, 104, "#f4f4f0"],
        [110, 72, "#f4f4f0"],
        [110, 40, "#d0714c"],
        [148, 96, "#9caf88"],
        [148, 66, "#9caf88"],
        [78, 70, "#9caf88"],
      ].map(([x, y, fill]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={7} fill={fill as string} {...edge} />
      ))}
      <rect x={146} y={124} width={50} height={20} rx={4} fill={PAPER} {...edge} />
      <text x={171} y={138} fontSize={10} fontWeight={700} textAnchor="middle" fill={INK}>
        git
      </text>
      <path d="M171 144v8" {...edge} />
    </>
  );
}

/** UI/UX: an easel with a wireframe on it, a palette at its foot. */
function Easel() {
  return (
    <>
      <path d="M110 34v116" {...edge} strokeWidth={4} stroke="#9a9f98" />
      <path d="M86 150 104 38M134 150 116 38" {...edge} strokeWidth={4} stroke="#7c817a" />
      <rect x={62} y={46} width={96} height={72} rx={3} fill={PAPER} {...edge} />
      <rect x={70} y={54} width={80} height={10} rx={2} fill="#cbd7bd" {...thin} />
      <rect x={70} y={70} width={36} height={40} rx={2} fill="none" {...thin} />
      <path d="M70 70l36 40M106 70l-36 40" {...thin} strokeWidth={0.8} />
      <rect x={112} y={70} width={38} height={14} rx={2} fill="#f5dfd5" {...thin} />
      <path d="M112 92h38M112 100h26" {...thin} />
      <rect x={58} y={116} width={104} height={6} rx={2} fill="#b8bcb5" {...edge} />
      <path d="M22 142c0-10 12-16 26-16s24 6 24 13-8 8-14 8c-4 0-6 4-12 4-14 0-24-3-24-9Z" fill="#fafaf7" {...edge} />
      {[
        [36, 136, "#d0714c"],
        [48, 132, "#9caf88"],
        [60, 136, "#7c817a"],
      ].map(([x, y, fill]) => (
        <circle key={`${x}`} cx={x} cy={y} r={3.5} fill={fill as string} {...thin} />
      ))}
      <path d="M160 146l34-10" stroke="#d0714c" strokeWidth={5} strokeLinecap="round" />
      <path d="M194 136l6-2" stroke="#2d2f2b" strokeWidth={3} strokeLinecap="round" />
    </>
  );
}

/** Growstep: an office built in steps, and an arrow climbing them. */
function Steps() {
  const windows = (x: number, y: number, rows: number) =>
    Array.from({ length: rows * 2 }, (_, k) => <rect key={k} x={x + (k % 2) * 16} y={y + Math.floor(k / 2) * 16} width={10} height={10} rx={1.5} fill="#e2e9da" {...thin} />);
  return (
    <>
      <rect x={34} y={108} width={48} height={42} rx={3} fill={PAPER} {...edge} />
      {windows(44, 116, 2)}
      <rect x={82} y={82} width={48} height={68} rx={3} fill="#e2e9da" {...edge} />
      {windows(92, 90, 3)}
      <rect x={130} y={54} width={48} height={96} rx={3} fill={PAPER} {...edge} />
      {windows(140, 62, 5)}
      <path d="M40 94l40-24 40-18 44-28" fill="none" stroke="#bc4e26" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M150 20l16 3-8 13" fill="none" stroke="#bc4e26" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** CUST: a hackathon under a striped tent, a trophy on the stage. */
function Hackathon() {
  return (
    <>
      <path d="M26 84 110 30l84 54Z" fill="#f5dfd5" {...edge} />
      <path d="M68 57 58 84M110 30v54M152 57l10 27" {...thin} />
      <rect x={36} y={82} width={148} height={56} rx={3} fill={PAPER} {...edge} />
      <rect x={52} y={92} width={116} height={18} rx={3} fill="#3b3d39" {...thin} />
      <text x={110} y={105} fontSize={10} fontWeight={700} textAnchor="middle" letterSpacing={1.4} fill="#cbd7bd">
        HACK 2026
      </text>
      <path d="M98 118h24v5c0 8-5 12-12 12s-12-4-12-12Z" fill="#de9372" {...edge} />
      <path d="M98 121h-5c0 5 3 7 6 7M122 121h5c0 5-3 7-6 7" fill="none" {...thin} />
      <rect x={30} y={136} width={160} height={10} rx={2} fill="#d2d5cf" {...edge} />
      <path d="M186 40l-10 16h8l-4 14 12-18h-8l4-12Z" fill="#de9372" {...edge} />
    </>
  );
}

/** Atom Camp: two tents, a campfire, and a flag with an atom on it. */
function Camp() {
  return (
    <>
      <path d="M20 146 60 70l40 76Z" fill="#cbd7bd" {...edge} />
      <path d="M60 146 60 104 72 146" fill="#9caf88" {...thin} />
      <path d="M104 146 142 80l38 66Z" fill="#f5dfd5" {...edge} />
      <path d="M142 146v-38l10 38" fill="#de9372" {...thin} />
      <path d="M186 146V40" {...edge} />
      <path d="M187 41c10-4 16 4 27 0v18c-11 4-17-4-27 0Z" fill={PAPER} {...thin} />
      <g transform="translate(200 50)" fill="none" stroke="#bc4e26" strokeWidth={1.2}>
        <ellipse rx={7} ry={3} />
        <ellipse rx={7} ry={3} transform="rotate(60)" />
        <ellipse rx={7} ry={3} transform="rotate(-60)" />
      </g>
      <path d="M92 150l22-8M92 142l22 8" stroke="#7c817a" strokeWidth={4} strokeLinecap="round" />
      <path d="M103 142c-8-6-4-14 0-20 1 6 7 6 6 12 4-2 4-6 3-9 6 6 4 14-2 17Z" fill="#de9372" {...thin} />
    </>
  );
}

/** Anma Tech: a tower with its lights on, a star on its mast, and a flag that says now. */
function Tower() {
  return (
    <>
      <path d="M102 20V6" {...edge} />
      <path d="M102 0l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z" fill="#de9372" {...thin} />
      <rect x={76} y={20} width={52} height={130} rx={4} fill={PAPER} {...edge} />
      <rect x={76} y={20} width={52} height={14} rx={4} fill="#d0714c" {...edge} />
      {Array.from({ length: 18 }, (_, k) => (
        <rect key={k} x={84 + (k % 3) * 13} y={42 + Math.floor(k / 3) * 17} width={9} height={11} rx={1.5} fill={k % 4 === 1 ? "#f5dfd5" : "#e2e9da"} {...thin} />
      ))}
      <rect x={128} y={86} width={48} height={64} rx={3} fill="#e2e9da" {...edge} />
      {Array.from({ length: 6 }, (_, k) => (
        <rect key={k} x={136 + (k % 2) * 18} y={96 + Math.floor(k / 2) * 17} width={12} height={10} rx={1.5} fill={PAPER} {...thin} />
      ))}
      <path d="M44 150V92" {...edge} />
      <path d="M45 93c9-4 15 4 25 0v16c-10 4-16-4-25 0Z" fill="#bc4e26" {...thin} />
      <text x={57} y={104} fontSize={7} fontWeight={700} textAnchor="middle" fill={PAPER}>
        NOW
      </text>
      <Tree x={24} y={150} r={8} pine />
    </>
  );
}

const PICTURES: Record<string, () => ReactNode> = {
  freelance: Home,
  iqra: University,
  workshop: GitTree,
  uiux: Easel,
  growstep: Steps,
  cust: Hackathon,
  atom: Camp,
  anma: Tower,
};

/** The picture of the stop `id`, standing on its grass. */
export function Scene({ id }: { id: string }) {
  const Picture = PICTURES[id];
  return (
    <g filter="url(#desk-chip)">
      <Ground />
      {Picture && <Picture />}
    </g>
  );
}

/** A range of hills with snow on top, `w` wide, standing on y = 0. */
export function Mountains() {
  const peaks = [
    { x0: 40, x1: 150, ax: 94, ay: -86, fill: "#c9cdc6" },
    { x0: 0, x1: 84, ax: 40, ay: -58, fill: "#d9dcd5" },
    { x0: 110, x1: 196, ax: 152, ay: -62, fill: "#d9dcd5" },
    { x0: 172, x1: 232, ax: 202, ay: -38, fill: "#d2d5cf" },
  ];
  return (
    <g filter="url(#desk-chip)">
      {peaks.map((p) => {
        const k = 0.14;
        const f = 0.34;
        const l = [p.ax - (p.ax - p.x0) * k, p.ay * (1 - k)];
        const r = [p.ax + (p.x1 - p.ax) * k, p.ay * (1 - k)];
        const s = [p.ax - (p.ax - p.x0) * f, p.ay * (1 - f)];
        const e = p.ax + (p.x1 - p.ax) * f;
        return (
          <g key={p.ax}>
            <path d={`M${p.x0},0 L${l[0]},${l[1]} Q${p.ax},${p.ay - 3} ${r[0]},${r[1]} L${p.x1},0 Q${(p.x0 + p.x1) / 2},5 ${p.x0},0 Z`} fill={p.fill} {...edge} />
            <path d={`M${p.ax + 2},${s[1]} L${p.x1 - 3},0 L${p.ax + (p.x1 - p.ax) * 0.2},2 Z`} fill="#b8bcb5" fillOpacity={0.7} />
            <path d={`M${s[0]},${s[1]} L${l[0]},${l[1]} Q${p.ax},${p.ay - 3} ${r[0]},${r[1]} L${e},${s[1]} L${(p.ax + e) / 2},${s[1] - 5} L${p.ax},${s[1] + 2} L${(s[0] + p.ax) / 2},${s[1] - 5} Z`} fill={PAPER} {...thin} />
          </g>
        );
      })}
    </g>
  );
}
