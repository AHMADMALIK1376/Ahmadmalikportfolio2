import type { ReactNode } from "react";
import { at, Block, Detail, frontFace, line, onFront, onTop, poly, rounded, sideFace, TONES, type Point, type Tone } from "@/components/desk/iso";

/**
 * The 3D pictures on the experience map, in the same hand as the factory in
 * the hero: soft blocks in paper and pastel with a wobbling ink edge and a
 * hard shadow (the chip filter), lit from the top left. Each place stands on
 * its own slab of grass, in a box 220 wide and 170 tall, and is set down on
 * the map across the road from its stop's card; the mountains and trees stand
 * about the map around them.
 */

export const SCENE = { w: 220, h: 170 };

const INK = "#2d2f2b";
const GRASS: Tone = { top: "#dfe6d3", left: "#cbd7bd", right: "#b1c29f" };
const PAPER = TONES.paper;
const PALE: Tone = { top: "#f4f4f0", left: "#e6e8e3", right: "#cfd2cb" };
const SAGE: Tone = { top: "#e2e9da", left: "#cbd7bd", right: "#b1c29f" };
const ROOF: Tone = { top: "#ecbea9", left: "#de9372", right: "#d0714c" };
const SIENNA: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const WOOD: Tone = { top: "#e2b5a1", left: "#d0a58f", right: "#c0947f" };
const STONE: Tone = { top: "#d2d5cf", left: "#b9bdb6", right: "#9a9f98" };
const DARK: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
const GLASS = "#e2e9da";
const LIT = "#f5dfd5";

/** Iso drawings are made about the kit's own origin; this sets that origin down in the middle of a picture's box. */
function Iso({ children }: { children: ReactNode }) {
  return <g transform="translate(-250 -292)">{children}</g>;
}

/** The slab of grass a picture stands on. */
function Slab() {
  return <Block x0={-62} x1={62} y0={-40} y1={40} z={-5} h={5} tone={GRASS} r={14} width={1.2} />;
}

/** A pitched roof, its ridge along x at height z + rise: its back slope, the gable end facing right, and its front slope. */
function Gable({ x0, x1, y0, y1, z, rise, tone, wall }: { x0: number; x1: number; y0: number; y1: number; z: number; rise: number; tone: Tone; wall: string }) {
  const ym = (y0 + y1) / 2;
  return (
    <>
      <Detail d={poly(at(x0, y0, z), at(x1, y0, z), at(x1, ym, z + rise), at(x0, ym, z + rise))} fill={tone.top} />
      <Detail d={poly(at(x1, y0, z), at(x1, y1, z), at(x1, ym, z + rise))} fill={wall} />
      <Detail d={poly(at(x0, ym, z + rise), at(x1, ym, z + rise), at(x1, y1, z), at(x0, y1, z))} fill={tone.left} />
    </>
  );
}

/** A grid of windows on a face: on the front (facing +y, at `at_` y) or the side (facing +x, at `at_` x). */
function Windows({ face, at: fixed, from, cols, rows, z0, step, lit = [] }: { face: "front" | "side"; at: number; from: number; cols: number; rows: number; z0: number; step: number; lit?: number[] }) {
  return (
    <>
      {Array.from({ length: cols * rows }, (_, k) => {
        const c = k % cols;
        const r = Math.floor(k / cols);
        const a = from + c * 9;
        const z = z0 + r * step;
        const d = face === "front" ? rounded(frontFace(a, a + 5.5, z, z + 7, fixed), 1) : rounded(sideFace(fixed, a, a + 5.5, z, z + 7), 1);
        return <Detail key={k} d={d} fill={lit.includes(k) ? LIT : GLASS} width={0.8} />;
      })}
    </>
  );
}

// ── trees ───────────────────────────────────────────────────────────────

/**
 * A tree standing at (x, y) on the page, r its size: a round one, its crown a ball lit from the top left; or a pine,
 * each tier a cone lit on its left and shaded on its right. Each casts a little shadow to the right.
 */
export function Tree({ x, y, r = 9, pine = false }: { x: number; y: number; r?: number; pine?: boolean }) {
  const shadow = <ellipse cx={x + r * 0.45} cy={y + 0.5} rx={r * 0.95} ry={r * 0.32} fill={INK} fillOpacity={0.14} />;
  const trunk = <path d={`M${x - 1.5} ${y}V${y - r * 1.05}h3V${y}Z`} fill="#7c817a" stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />;
  if (pine) {
    const tier = (base: number, half: number, top: number) => {
      const apex = `${x} ${y - top}`;
      return (
        <g key={base}>
          <path d={`M${apex}L${x - half} ${y - base}Q${x} ${y - base + half * 0.42} ${x + half} ${y - base}Z`} fill="#9caf88" stroke={INK} strokeOpacity={0.55} strokeWidth={1.1} strokeLinejoin="round" />
          <path d={`M${apex}L${x + r * 0.08} ${y - base + half * 0.21}Q${x + half * 0.55} ${y - base + half * 0.18} ${x + half} ${y - base}Z`} fill="#80966b" />
        </g>
      );
    };
    return (
      <g>
        {shadow}
        {trunk}
        {tier(r * 0.75, r * 1.2, r * 2.8)}
        {tier(r * 1.75, r * 0.9, r * 3.75)}
      </g>
    );
  }
  const cy = y - r * 1.9;
  return (
    <g>
      {shadow}
      {trunk}
      <circle cx={x} cy={cy} r={r} fill="#9caf88" stroke={INK} strokeOpacity={0.55} strokeWidth={1.1} />
      <circle cx={x - r * 0.2} cy={cy - r * 0.22} r={r * 0.76} fill={r % 2 ? "#b1c29f" : "#cbd7bd"} />
      <circle cx={x - r * 0.38} cy={cy - r * 0.44} r={r * 0.22} fill="#e2e9da" />
    </g>
  );
}

/** A tree standing at (x, y) in a picture's own iso space. */
function IsoTree({ x, y, r = 10, pine = false }: { x: number; y: number; r?: number; pine?: boolean }) {
  const [gx, gy] = at(x, y, 0);
  return <Tree x={gx} y={gy} r={r} pine={pine} />;
}

/** Puffs of smoke from a chimney top at p. */
function Puffs({ p }: { p: Point }) {
  return (
    <g fill="#fafaf7" stroke={INK} strokeOpacity={0.35} strokeWidth={1}>
      <circle cx={p[0] + 3} cy={p[1] - 8} r={4.5} />
      <circle cx={p[0] + 10} cy={p[1] - 17} r={6} />
      <circle cx={p[0] + 19} cy={p[1] - 28} r={7.5} />
    </g>
  );
}

// ── the places ──────────────────────────────────────────────────────────

/** Freelance: a home office, the lamp on at the desk in the side window, smoke from the chimney. */
function Home() {
  return (
    <Iso>
      <Slab />
      <IsoTree x={-50} y={-28} r={10} pine />
      <Block x0={0} x1={7} y0={-16} y1={-9} z={30} h={30} tone={STONE} r={1.5} width={1.1} />
      <Block x0={-34} x1={14} y0={-22} y1={16} z={0} h={30} tone={PAPER} r={3} />
      <Gable x0={-38} x1={18} y0={-26} y1={20} z={30} rise={20} tone={ROOF} wall={PAPER.right} />
      <Detail d={rounded(frontFace(-11, -1, 0, 18, 16), 1.5)} fill="#d0714c" />
      <Detail d={rounded(frontFace(-29, -18, 11, 22, 16), 1.5)} fill={GLASS} />
      <Detail d={line(at(-23.5, 16, 11), at(-23.5, 16, 22))} width={0.8} />
      <Detail d={rounded(frontFace(4, 11, 11, 22, 16), 1.5)} fill={GLASS} />
      <Detail d={rounded(sideFace(14, -15, -3, 11, 22), 1.5)} fill={LIT} />
      <Block x0={-13} x1={1} y0={16} y1={21} z={0} h={2} tone={STONE} r={1} width={0.9} />
      <Puffs p={at(3.5, -12.5, 60)} />
      <IsoTree x={36} y={24} r={10} />
    </Iso>
  );
}

/** Iqra University: a hall with a portico of columns under a pediment, steps up to it, and a flag on the roof. */
function University() {
  const columns = [-38, -19, 0, 19, 38];
  return (
    <Iso>
      <Slab />
      <IsoTree x={52} y={-32} r={9} pine />
      <Detail d={line(at(-28, -14, 40), at(-28, -14, 74))} width={1.6} />
      <path d={`M${at(-28, -14, 74)[0]} ${at(-28, -14, 74)[1]}c7-3 11 2 19-1v10c-8 3-12-2-19 1Z`} fill="#9caf88" stroke={INK} strokeOpacity={0.55} strokeWidth={1} />
      <Block x0={-46} x1={46} y0={-20} y1={10} z={0} h={36} tone={PAPER} r={3} />
      <Detail d={rounded(frontFace(-8, 8, 3, 24, 10), 5)} fill="#9a9f98" />
      <Block x0={-48} x1={48} y0={10} y1={26} z={0} h={3} tone={STONE} r={2} width={1.1} />
      <Block x0={-40} x1={40} y0={26} y1={30} z={0} h={1.5} tone={STONE} r={1.5} width={1} />
      {columns.map((c) => (
        <Block key={c} x0={c - 3} x1={c + 3} y0={17} y1={22} z={3} h={31} tone={PALE} r={2.5} width={1} />
      ))}
      <Block x0={-49} x1={49} y0={-22} y1={25} z={34} h={6} tone={PAPER} r={2} width={1.2} />
      <Detail d={poly(at(0, -22, 58), at(0, 25, 58), at(49, 25, 40), at(49, -22, 40))} fill={STONE.right} />
      <Detail d={poly(at(-49, 25, 40), at(49, 25, 40), at(0, 25, 58))} fill={PALE.left} />
      <Detail d={rounded(frontFace(-4, 4, 44, 52, 25), 4)} fill="#cbd7bd" width={0.9} />
    </Iso>
  );
}

/** The Git workshop: a tree whose crown is a Git history, a branch going off and merging back, and a signpost. */
function GitTree() {
  const [cx, cy] = at(0, 0, 64);
  const nodes: [number, number, string][] = [
    [0, 22, "#d0714c"],
    [0, 6, "#f4f4f0"],
    [0, -10, "#f4f4f0"],
    [0, -24, "#d0714c"],
    [14, 0, "#9caf88"],
    [14, -16, "#9caf88"],
    [-14, -10, "#9caf88"],
  ];
  return (
    <Iso>
      <Slab />
      <Block x0={-5} x1={5} y0={-5} y1={5} z={0} h={36} tone={WOOD} r={2} />
      <circle cx={cx} cy={cy} r={34} fill="#9caf88" stroke={INK} strokeOpacity={0.55} strokeWidth={1.3} />
      <circle cx={cx - 7} cy={cy - 7} r={27} fill="#b1c29f" />
      <circle cx={cx - 14} cy={cy - 15} r={7} fill="#cbd7bd" />
      <g transform={`translate(${cx} ${cy})`} fill="none" strokeLinecap="round">
        <path d="M0 28V-30" stroke="#5e625c" strokeWidth={3} />
        <path d="M0 14c10-2 14-8 14-14V-16c0-6-6-8-14-12" stroke="#5e625c" strokeWidth={2.2} />
        <path d="M0 0c-8-2-14-6-14-10" stroke="#5e625c" strokeWidth={2} />
        {nodes.map(([x, y, fill]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={4.2} fill={fill} stroke={INK} strokeOpacity={0.6} strokeWidth={1} />
        ))}
      </g>
      <Block x0={30} x1={33} y0={16} y1={19} z={0} h={30} tone={WOOD} r={1} width={1} />
      <Block x0={20} x1={46} y0={19} y1={21} z={22} h={12} tone={PAPER} r={2} width={1.1} />
      <text transform={onFront(at(26, 21, 25))} fontSize={8} fontWeight={700} fill={INK}>
        git
      </text>
      <IsoTree x={-48} y={26} r={8} pine />
    </Iso>
  );
}

/** UI/UX: an easel with a wireframe on the canvas, a palette on a stool, and pots of paint. */
function Easel() {
  const [ax, ay] = at(0, 2, 62);
  const legs: Point[] = [at(-14, 8, 0), at(14, 8, 0), at(0, -10, 0)];
  return (
    <Iso>
      <Slab />
      <IsoTree x={-46} y={-30} r={9} />
      <path d={`M${legs[2][0]} ${legs[2][1]}L${ax} ${ay}`} stroke="#c0947f" strokeWidth={3.2} strokeLinecap="round" />
      <path d={`M${legs[2][0]} ${legs[2][1]}L${ax} ${ay}`} stroke={INK} strokeOpacity={0.35} strokeWidth={0.8} strokeLinecap="round" />
      <Block x0={-22} x1={22} y0={6} y1={11} z={16} h={2.5} tone={WOOD} r={1.5} width={1} />
      <Block x0={-20} x1={20} y0={8} y1={10} z={18} h={34} tone={PAPER} r={2} width={1.2} />
      <g transform={onFront(at(-18, 10, 50))} fill="none" stroke="#5e625c" strokeWidth={0.9} strokeLinecap="round">
        <rect x={1} y={1} width={34} height={5} rx={1} fill="#cbd7bd" />
        <rect x={1} y={9} width={15} height={18} rx={1} />
        <path d="M1 9 16 27M16 9 1 27" strokeWidth={0.6} />
        <rect x={19} y={9} width={16} height={7} rx={1} fill="#f5dfd5" />
        <path d="M19 20H35M19 24H30" />
      </g>
      {legs.slice(0, 2).map(([x, y], k) => (
        <g key={k}>
          <path d={`M${x} ${y}L${ax} ${ay}`} stroke="#d0a58f" strokeWidth={3.4} strokeLinecap="round" />
          <path d={`M${x} ${y}L${ax} ${ay}`} stroke={INK} strokeOpacity={0.35} strokeWidth={0.8} strokeLinecap="round" />
        </g>
      ))}
      <Block x0={28} x1={42} y0={6} y1={20} z={0} h={16} tone={WOOD} r={2} />
      <g transform={onTop(at(35, 13, 16))}>
        <path d="M-9 1c0-6 6-9 12-8s9 5 7 8-5 2-7 3c-1 2 0 4-4 4-6 0-8-3-8-7Z" fill="#fafaf7" stroke={INK} strokeOpacity={0.55} strokeWidth={1} />
        <circle cx={-4} cy={-2} r={1.8} fill="#d0714c" />
        <circle cx={1} cy={-4} r={1.8} fill="#9caf88" />
        <circle cx={5} cy={-1} r={1.8} fill="#5e625c" />
      </g>
      {[
        [-44, 14, SIENNA],
        [-34, 22, SAGE],
        [-44, 26, STONE],
      ].map(([x, y, tone]) => (
        <Block key={`${x}-${y}`} x0={(x as number) - 3.5} x1={(x as number) + 3.5} y0={(y as number) - 3.5} y1={(y as number) + 3.5} z={0} h={7} tone={tone as Tone} r={2.5} width={0.9} />
      ))}
    </Iso>
  );
}

/** Growstep: an office built in three steps, each taller than the last, and an arrow climbing them. */
function Steps() {
  const towers = [
    { x0: -46, x1: -18, y0: -8, y1: 20, h: 36, tone: PAPER },
    { x0: -14, x1: 14, y0: -16, y1: 12, h: 62, tone: SAGE },
    { x0: 18, x1: 46, y0: -24, y1: 4, h: 92, tone: PAPER },
  ];
  const climb: Point[] = [at(-32, 6, 46), at(0, -2, 72), at(32, -10, 102)];
  return (
    <Iso>
      <Slab />
      {towers.map((t) => (
        <g key={t.x0}>
          <Block x0={t.x0} x1={t.x1} y0={t.y0} y1={t.y1} z={0} h={t.h} tone={t.tone} r={3} />
          <Windows face="front" at={t.y1} from={t.x0 + 4} cols={3} rows={Math.floor((t.h - 8) / 12)} z0={6} step={12} lit={[1, 5]} />
          <Windows face="side" at={t.x1} from={t.y0 + 4} cols={3} rows={Math.floor((t.h - 8) / 12)} z0={6} step={12} lit={[3]} />
        </g>
      ))}
      <path d={`M${climb.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}`} fill="none" stroke="#bc4e26" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 7" />
      <path d={`M${climb[2][0] - 4} ${climb[2][1] - 12}l12 1-5 11`} fill="none" stroke="#bc4e26" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <IsoTree x={-52} y={30} r={8} />
    </Iso>
  );
}

/** CUST: a hackathon in a striped tent, a screen on the stage in front of it, and a trophy. */
function Hackathon() {
  const stripes = [-44, -26, -8, 10, 28];
  return (
    <Iso>
      <Slab />
      <Detail d={poly(at(-44, -22, 0), at(44, -22, 0), at(44, 0, 44), at(-44, 0, 44))} fill="#f5dfd5" />
      <Detail d={poly(at(44, -22, 0), at(44, 22, 0), at(44, 0, 44))} fill="#ecc9b9" />
      <Detail d={poly(at(44, 10, 0), at(44, 22, 0), at(44, 0, 44), at(44, 4, 30))} fill="#5e625c" />
      <Detail d={poly(at(-44, 0, 44), at(44, 0, 44), at(44, 22, 0), at(-44, 22, 0))} fill={PAPER.left} />
      {stripes.map((x) => (
        <path key={x} d={poly(at(x, 0, 44), at(x + 9, 0, 44), at(x + 9, 22, 0), at(x, 22, 0))} fill="#de9372" fillOpacity={0.9} />
      ))}
      <Detail d={line(at(0, 0, 44), at(0, 0, 58))} width={1.4} />
      <path d={`M${at(0, 0, 58)[0]} ${at(0, 0, 58)[1]}l10 3-10 3Z`} fill="#9caf88" stroke={INK} strokeOpacity={0.55} strokeWidth={0.9} />
      <Block x0={-32} x1={32} y0={26} y1={40} z={0} h={6} tone={STONE} r={2} />
      <Block x0={-24} x1={24} y0={24} y1={27} z={6} h={24} tone={DARK} r={2} width={1.1} />
      <text transform={onFront(at(-20, 27, 16))} fontSize={7.5} fontWeight={700} letterSpacing={1} fill="#cbd7bd">
        HACK 2026
      </text>
      <Block x0={24} x1={30} y0={31} y1={37} z={6} h={4} tone={STONE} r={1} width={0.9} />
      <Block x0={23.5} x1={30.5} y0={30.5} y1={37.5} z={10} h={9} tone={SIENNA} r={3} width={1} />
    </Iso>
  );
}

/** Atom Camp: two tents, a campfire between them, and a flag with an atom on it. */
function Camp() {
  const [fx, fy] = at(12, 24, 2);
  const [px, py] = at(48, 18, 62);
  return (
    <Iso>
      <Slab />
      <Gable x0={4} x1={40} y0={-28} y1={-2} z={0} rise={28} tone={ROOF} wall="#d0714c" />
      <Detail d={poly(at(40, -18, 0), at(40, -10, 0), at(40, -15, 14))} fill="#5e625c" />
      <Gable x0={-46} x1={-10} y0={-16} y1={12} z={0} rise={30} tone={SAGE} wall="#9caf88" />
      <Detail d={poly(at(-10, -6, 0), at(-10, 3, 0), at(-10, -2, 15))} fill="#5e625c" />
      <path d={`M${fx - 10} ${fy + 3}l20-6M${fx - 10} ${fy - 3}l20 6`} stroke="#9a6b55" strokeWidth={3.2} strokeLinecap="round" />
      <path d={`M${fx} ${fy - 2}c-7-5-4-13 0-19 1 6 7 6 6 12 3-2 3-5 3-8 5 6 4 13-2 16Z`} fill="#de9372" stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />
      <Detail d={line(at(48, 18, 0), at(48, 18, 62))} width={1.5} />
      <path d={`M${px} ${py}c9-4 14 3 24 0v15c-10 3-15-4-24 0Z`} fill="#fafaf7" stroke={INK} strokeOpacity={0.55} strokeWidth={1} />
      <g transform={`translate(${px + 12} ${py + 8})`} fill="none" stroke="#bc4e26" strokeWidth={1.1}>
        <ellipse rx={6} ry={2.6} />
        <ellipse rx={6} ry={2.6} transform="rotate(60)" />
        <ellipse rx={6} ry={2.6} transform="rotate(-60)" />
      </g>
    </Iso>
  );
}

/** Anma Tech: a tower with its lights on, a star on its mast, an annex beside it, and a flag that says now. */
function Tower() {
  const [sx, sy] = at(0, 0, 150);
  const [fx, fy] = at(-46, 26, 52);
  return (
    <Iso>
      <Slab />
      <Block x0={-14} x1={14} y0={-14} y1={14} z={0} h={112} tone={PAPER} r={3} />
      <Windows face="front" at={14} from={-10} cols={3} rows={8} z0={8} step={12.5} lit={[1, 4, 8, 13, 19]} />
      <Windows face="side" at={14} from={-10} cols={3} rows={8} z0={8} step={12.5} lit={[2, 6, 11, 16, 22]} />
      <Block x0={-15} x1={15} y0={-15} y1={15} z={110} h={10} tone={SIENNA} r={3} width={1.2} />
      <Detail d={line(at(0, 0, 120), at(0, 0, 146))} width={1.5} />
      <path d={`M${sx} ${sy - 5}l2 4 4.5 1-3.3 3 1 4.5-4.2-2.3-4.2 2.3 1-4.5-3.3-3 4.5-1Z`} fill="#de9372" stroke={INK} strokeOpacity={0.55} strokeWidth={0.9} />
      <Block x0={18} x1={46} y0={-6} y1={18} z={0} h={44} tone={SAGE} r={3} />
      <Windows face="front" at={18} from={22} cols={3} rows={3} z0={8} step={12} lit={[4]} />
      <Windows face="side" at={46} from={-2} cols={2} rows={3} z0={8} step={12} />
      <Detail d={line(at(-46, 26, 0), at(-46, 26, 52))} width={1.5} />
      <path d={`M${fx} ${fy}c8-3 13 3 22 0v13c-9 3-14-3-22 0Z`} fill="#bc4e26" stroke={INK} strokeOpacity={0.55} strokeWidth={1} />
      <text x={fx + 11} y={fy + 9} fontSize={6} fontWeight={700} textAnchor="middle" fill="#f4f4f0">
        NOW
      </text>
    </Iso>
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

/** The picture of the stop `id`, on its slab of grass. */
export function Scene({ id }: { id: string }) {
  const Picture = PICTURES[id];
  return <g filter="url(#desk-chip)">{Picture && <Picture />}</g>;
}

// ── mountains ───────────────────────────────────────────────────────────

/** Peaks in a range, in iso space: where each stands, how wide its base, how tall, and its stone. */
const PEAKS = [
  { x: -8, y: -24, b: 44, h: 78, tone: { left: "#d9dcd5", right: "#b9bdb6" } },
  { x: 58, y: -6, b: 30, h: 50, tone: { left: "#dfe2db", right: "#c3c7c0" } },
  { x: -66, y: 12, b: 34, h: 54, tone: { left: "#dfe2db", right: "#c3c7c0" } },
  { x: 24, y: 30, b: 36, h: 60, tone: { left: "#d2d5cf", right: "#aeb3ab" } },
  { x: 96, y: 26, b: 22, h: 34, tone: { left: "#e3e5e0", right: "#c9cdc6" } },
];

/**
 * A range of mountains, about 250 wide, standing on y = 0 with its middle at x = 118: each peak a pyramid, lit on its
 * left face and shaded on its right, with snow on its top, painted furthest first.
 */
export function Mountains({ variant = 0 }: { variant?: number }) {
  // each range a little different: turned about, and its peaks taller or lower
  const peaks = PEAKS.map((p, k) => ({ ...p, x: variant % 2 ? 30 - p.x : p.x, h: p.h * (1 + 0.2 * Math.sin(k * 2.1 + variant * 1.7)) })).sort((a, b) => a.x + a.y - (b.x + b.y));
  const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const snow = 0.36;
  return (
    <g transform="translate(-228 -470)" filter="url(#desk-chip)">
      {peaks.map((p) => {
        const apex = at(p.x, p.y, p.h);
        const back = at(p.x - p.b, p.y + p.b, 0);
        const front = at(p.x + p.b, p.y + p.b, 0);
        const right = at(p.x + p.b, p.y - p.b, 0);
        // snow down each face to a ragged line
        const l = [lerp(apex, back, snow), lerp(apex, front, snow * 0.9), lerp(apex, right, snow)];
        const dip = (a: Point, b: Point, k: number): Point => {
          const m = lerp(a, b, 0.5);
          return [m[0], m[1] + k];
        };
        return (
          <g key={`${p.x}-${p.y}`}>
            <Detail d={poly(back, front, apex)} fill={p.tone.left} />
            <Detail d={poly(front, right, apex)} fill={p.tone.right} />
            <path d={poly(apex, l[0], dip(l[0], l[1], 5), l[1])} fill="#fafaf7" stroke={INK} strokeOpacity={0.4} strokeWidth={0.9} strokeLinejoin="round" />
            <path d={poly(apex, l[1], dip(l[1], l[2], 4), l[2])} fill="#e6e8e3" stroke={INK} strokeOpacity={0.4} strokeWidth={0.9} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}
