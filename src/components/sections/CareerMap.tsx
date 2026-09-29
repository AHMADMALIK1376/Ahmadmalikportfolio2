"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CERTIFICATIONS, EDUCATION, EXPERIENCE, type Ink, type Role } from "@/lib/content";
import { ArrowUpRight } from "@/components/sketch/Icons";
import { Mountains, Scene, SCENE, Tree } from "./MapScenes";
import styles from "./Map.module.css";

/**
 * Experience, as a journey down a map: a long hand-drawn map laid across the
 * whole width of the page — mountains, forests, a river, the sea — with every
 * role, in order, as a stop on one road that flows down it in long, smooth
 * curves, swinging gently from one side of the middle to the other. The
 * workshop and hackathons are flags beside the road.
 *
 * As the page scrolls down, a little robot drone flies down the road with it,
 * leaning into the bends, hovering on waves that ripple out over the road
 * under it; and each stop's card pops up
 * on the map beside the stop as the drone reaches it (and folds away again if
 * it goes back up). While the map is on the screen, a hard flick of the wheel
 * or trackpad only scrolls it at a walking pace. The road behind it is inked in; the road ahead is still in
 * pencil. Each card opens on the outside of its bend, and across the road from
 * it stands the place in 3D, with mountains behind it.
 *
 * The road is drawn through wherever the stops fall on the page, so the map
 * fits any width; below a laptop's width it runs straight down the left with
 * the cards beside it.
 */

type Stop = {
  id: string;
  /** its name on the map */
  name: string;
  kind: "Role" | "Education" | "Workshop" | "Hackathon";
  /** on the road itself, or a landmark just off it */
  road: boolean;
  ink: Ink;
  title: string;
  org: string;
  url?: string;
  period?: string;
  detail: string;
  points: string[];
  /** the passport stamp: a word above, the date, a word below */
  stamp: [string, string, string];
};

function role(title: string): Role {
  const found = EXPERIENCE.find((r) => r.title === title);
  if (!found) throw new Error(`No role called ${title}`);
  return found;
}

function badge(title: string) {
  const found = CERTIFICATIONS.find((c) => c.title === title);
  if (!found) throw new Error(`No badge called ${title}`);
  return found;
}

const fromRole = (r: Role) => ({ title: r.title, org: r.company, url: r.url, period: r.period, detail: r.detail, points: r.points, ink: r.ink });

const WORKSHOP = badge("GitHub Open Source Collaboration");
const CUST = badge("CUST Hackathon 2026");
const ATOM = badge("Atom Camp Hackathon");

/** In the order they happened, which is also their order down the road. */
const STOPS: Stop[] = [
  { id: "freelance", name: "Freelance", kind: "Role", road: true, ...fromRole(role("Freelance Full-Stack Developer")), stamp: ["since", "2023", "freelance"] },
  {
    id: "iqra",
    name: "Iqra Uni",
    kind: "Education",
    road: true,
    ink: "concrete",
    title: EDUCATION.degree,
    org: EDUCATION.school,
    period: EDUCATION.period,
    detail: "Undergraduate · in progress",
    points: [EDUCATION.note],
    stamp: ["since", "dec 23", "bs cs"],
  },
  { id: "workshop", name: "Git workshop", kind: "Workshop", road: false, ink: "sage", title: WORKSHOP.title, org: WORKSHOP.where, detail: "Workshop", points: [WORKSHOP.note], stamp: ["iqra", "git", "workshop"] },
  { id: "uiux", name: "UI/UX", kind: "Role", road: true, ...fromRole(role("UI/UX Designer")), stamp: ["since", "nov 25", "design"] },
  { id: "growstep", name: "Growstep", kind: "Role", road: true, ...fromRole(role("Website Development Intern")), stamp: ["jan–apr", "2026", "intern"] },
  { id: "cust", name: "CUST", kind: "Hackathon", road: false, ink: "sage", title: CUST.title, org: CUST.where, period: "2026", detail: "Hackathon", points: [CUST.note], stamp: ["cust", "2026", "hackathon"] },
  { id: "atom", name: "Atom Camp", kind: "Hackathon", road: false, ink: "sage", title: ATOM.title, org: "Atom Camp", period: "16–17 Jun 2026", detail: "Agentic AI", points: [ATOM.note], stamp: ["jun 16–17", "2026", "hackathon"] },
  { id: "anma", name: "Anma Tech", kind: "Role", road: true, ...fromRole(role("Full Stack AI Engineer")), stamp: ["jul", "2026", "now"] },
];

const LAST = STOPS.length - 1;
const ROAD_COUNT = STOPS.filter((s) => s.road).length;
/** each stop's number on the road, or 0 for the landmarks */
const NUMBER = STOPS.reduce<number[]>((acc, stop) => [...acc, stop.road ? acc.filter(Boolean).length + 1 : 0], []);
/**
 * Across the page, where each stop's pin stands on a wide screen, in percent: the road swings gently from one side of
 * the middle to the other, each stop at the outside of a bend. Each card opens on the outside of its bend, away from
 * the road, and the picture of the place stands across the road from it.
 */
const ACROSS = [36, 64, 36, 64, 36, 64, 36, 64];
const sideOf = (i: number) => (i % 2 ? "right" : "left");
/** How wide a page must be for the road to swing; narrower, it runs straight down the left. */
const WIDE = "(min-width: 64rem)";

/** How far down the screen the ball keeps: about level with the middle of what is being read. */
const EYE = 0.55;

type Point = { x: number; y: number };
type Box = { left: number; right: number; top: number; bottom: number };
type Geo = {
  w: number;
  h: number;
  wide: boolean;
  /** the column the stops are set in, across the map */
  column: { left: number; right: number };
  pins: Point[];
  rows: Box[];
  cards: Box[];
  road: string;
  future: string;
  river: string;
  bridge: Point | null;
  /** the road, sampled every few pixels down its length, for the ball */
  track: { x: number; y: number }[];
};

// ── geometry ────────────────────────────────────────────────────────────

const f1 = (n: number) => n.toFixed(1);
type Curve = readonly [Point, Point, Point, Point];

/** A road down through `points`: each bend leaves and arrives heading straight down, so the road never turns back up. */
function downward(points: Point[]) {
  const segments: Curve[] = points.slice(1).map((b, i) => {
    const a = points[i];
    const k = (b.y - a.y) * 0.5;
    return [a, { x: a.x, y: a.y + k }, { x: b.x, y: b.y - k }, b];
  });
  return { d: pathOf(points[0], segments), segments };
}

/** A smooth curve through `points` (Catmull–Rom, as cubic curves). */
function through(points: Point[]) {
  const segments: Curve[] = points.slice(0, -1).map((p1, i) => {
    const p0 = points[Math.max(0, i - 1)];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    return [p1, { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }, p2];
  });
  return { d: pathOf(points[0], segments), segments };
}

const pathOf = (start: Point, segments: Curve[]) => `M${f1(start.x)} ${f1(start.y)}` + segments.map(([, c1, c2, b]) => `C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(b.x)} ${f1(b.y)}`).join("");

const cubic = (p: Curve, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
    y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y,
  };
};

/** Points along a chain of curves, about every `step` pixels. */
function sample(segments: Curve[], step: number): Point[] {
  return segments.flatMap((s, n) => {
    const count = Math.max(4, Math.ceil((Math.hypot(s[3].x - s[0].x, s[3].y - s[0].y) * 1.2) / step));
    return Array.from({ length: count + (n === segments.length - 1 ? 1 : 0) }, (_, i) => cubic(s, i / count));
  });
}

/** The same scatter every time: a number between 0 and 1 for each `n`. */
const scatter = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ── the land ────────────────────────────────────────────────────────────

const LAND = "#e3e9da";
const INK = "#2d2f2b";
const edge = { stroke: INK, strokeOpacity: 0.5, strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** A clump of trees about (x, y), `n` of them, the same every time for the same `seed`. */
function Forest({ x, y, n, seed, spread = 60 }: { x: number; y: number; n: number; seed: number; spread?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, k) => (
        <Tree key={k} x={x + (scatter(seed + k * 3) - 0.5) * spread} y={y + (scatter(seed + k * 7) - 0.5) * spread * 0.6} r={6 + Math.round(scatter(seed + k) * 4)} pine={scatter(seed + k * 5) > 0.5} />
      ))}
    </>
  );
}

/** The map sheet: its land (with torn top and bottom edges), grid, river, road, hills, forests and sea, and a picture of each place. */
function Land({ geo, ids }: { geo: Geo; ids: string }) {
  const { w, h, wide, column } = geo;
  // the band the road swings across
  const road = { left: Math.min(...geo.pins.map((p) => p.x)), right: Math.max(...geo.pins.map((p) => p.x)) };
  // the torn edges of the sheet, top and bottom
  const tear = (y: number) => Array.from({ length: Math.ceil(w / 60) + 1 }, (_, i): Point => ({ x: i * 60, y: y + (scatter(i + y) - 0.5) * 10 }));
  const line = (points: Point[]) => points.map((p, i) => `${i ? "L" : "M"}${f1(p.x)} ${f1(p.y)}`).join("");
  const topEdge = tear(10);
  const bottomEdge = tear(h - 10);
  const top = line(topEdge);
  const bottom = line(bottomEdge);
  const sheet = `${top}${line([...bottomEdge].reverse()).replace(/^M/, "L")}Z`;
  const gridX = Array.from({ length: Math.floor(w / 140) }, (_, i) => 70 + i * 140);
  const gridY = Array.from({ length: Math.floor(h / 140) }, (_, i) => 90 + i * 140);
  // trees and hills in the margins either side of the column, where there is room
  const margins: { x: number; y: number; kind: number }[] = [];
  if (wide) {
    for (let y = 160, n = 0; y < h - 200; y += 120, n++) {
      if (column.left > 90) margins.push({ x: 20 + scatter(n * 3) * (column.left - 50), y: y + scatter(n * 5) * 40, kind: n % 4 });
      if (w - column.right > 90) margins.push({ x: column.right + 30 + scatter(n * 7) * (w - column.right - 60), y: y + 50 + scatter(n * 11) * 40, kind: (n + 2) % 4 });
    }
  }
  return (
    <svg className={styles.land} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${ids}-bridge`}>{geo.bridge && <circle cx={geo.bridge.x} cy={geo.bridge.y} r={20} />}</clipPath>
        <clipPath id={`${ids}-sheet`}>
          <path d={sheet} />
        </clipPath>
      </defs>

      {/* the sheet of land, laid across the page */}
      <path d={sheet} fill={LAND} />
      <path d={top} fill="none" {...edge} strokeOpacity={0.4} />
      <path d={bottom} fill="none" {...edge} strokeOpacity={0.4} />

      <g clipPath={`url(#${ids}-sheet)`}>
        <g stroke="#9a9f98" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="1 7" strokeLinecap="round">
          {gridX.map((x) => (
            <path key={`x${x}`} d={`M${x} 0V${h}`} />
          ))}
          {gridY.map((y) => (
            <path key={`y${y}`} d={`M0 ${y}H${w}`} />
          ))}
        </g>

        {/* the river, right across the land, under the road on a bridge */}
        <g filter="url(#desk-ink)" fill="none" strokeLinecap="round">
          <path d={geo.river} stroke={INK} strokeOpacity={0.55} strokeWidth={wide ? 16 : 11} />
          <path d={geo.river} stroke="#cbd7bd" strokeWidth={wide ? 12.5 : 8} />
          <path d={geo.river} stroke="#f0f3ec" strokeWidth={1.3} strokeDasharray="5 11" />
        </g>

        {/* hills and trees in the margins */}
        <g filter="url(#desk-chip)">
          {margins.map((m, i) =>
            m.kind === 3 ? (
              <g key={i} transform={`translate(${f1(m.x - 50)} ${f1(m.y + 20)}) scale(0.45)`}>
                <Mountains variant={i + 3} />
              </g>
            ) : m.kind === 2 ? (
              <path key={i} d={`M${f1(m.x - 14)} ${f1(m.y)}q7-8 14 0q7-8 14 0`} fill="none" stroke="#9a9f98" strokeWidth={1.4} strokeLinecap="round" />
            ) : (
              <Forest key={i} x={m.x} y={m.y} n={3} seed={i * 13} spread={40} />
            ),
          )}
        </g>

        {/* the road, in pencil: its edges, its bed, and a line down its middle; and its bridge over the river */}
        <path d={geo.future} fill="none" stroke="#7c817a" strokeWidth={2.4} strokeDasharray="1.5 8" strokeLinecap="round" />
        {geo.bridge && (
          <g clipPath={`url(#${ids}-bridge)`} fill="none">
            <path d={geo.road} stroke={INK} strokeOpacity={0.75} strokeWidth={wide ? 34 : 28} />
            <path d={geo.road} stroke={LAND} strokeWidth={wide ? 29 : 23} />
          </g>
        )}
        {/* (the wobble is left off a road that runs almost straight down a phone: its filter, sized from the road's own
            narrow bounds, would cut the road's edges off) */}
        <g filter={wide ? "url(#desk-ink)" : undefined} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={geo.road} stroke={INK} strokeOpacity={0.55} strokeWidth={wide ? 23 : 17} />
          <path d={geo.road} stroke="#f7f7f3" strokeWidth={wide ? 19 : 13.5} />
          {wide && <path d={geo.road} stroke="#dcded8" strokeWidth={15} />}
          {wide && <path d={geo.road} stroke="#f7f7f3" strokeWidth={13} />}
        </g>
        <path d={geo.road} fill="none" stroke="#b8bcb5" strokeWidth={2} strokeDasharray="8 9" strokeLinecap="round" />

        {/* the start of the road */}
        <g transform={`translate(${f1(geo.track[0].x)} ${f1(geo.track[0].y)})`}>
          <circle r={8} fill="#f4f4f0" {...edge} strokeWidth={1.6} />
          <text x={16} y={4} fontSize={10} fontWeight={700} letterSpacing={1.6} fill="#5e625c">
            START · 2023
          </text>
        </g>

        {wide &&
          STOPS.map((stop, i) => {
            const card = geo.cards[i];
            // across the road from the card: the place in 3D, with mountains behind it
            const cardLeft = sideOf(i) === "left";
            const [from, to] = cardLeft ? [road.right + 56, column.right - 8] : [column.left + 8, road.left - 56];
            const room = to - from;
            const scale = Math.min(1.25, room / (SCENE.w + 10));
            const sceneX = from + (room - SCENE.w * scale) / 2;
            const sceneY = card.bottom - SCENE.h * scale;
            const hills = Math.min(0.8, scale * 0.64);
            // below the card, on its side of the road, before the next place stands there: a forest
            const next = geo.cards[i + 2];
            const woods = next ? next.top - card.bottom : 0;
            const [wx0, wx1] = cardLeft ? [column.left + 20, road.left - 70] : [road.right + 70, column.right - 20];
            return (
              <g key={stop.id}>
                {scale >= 0.55 && (
                  <>
                    <g transform={`translate(${f1(sceneX + SCENE.w * scale * (cardLeft ? 0.7 : 0.3) - 118 * hills)} ${f1(sceneY + 66 * scale)}) scale(${hills.toFixed(3)})`}>
                      <Mountains variant={i} />
                    </g>
                    <g transform={`translate(${f1(sceneX)} ${f1(sceneY)}) scale(${scale.toFixed(3)})`}>
                      <Scene id={stop.id} />
                    </g>
                  </>
                )}
                {woods > 200 && wx1 - wx0 > 80 && (
                  <g filter="url(#desk-chip)">
                    <Forest x={(wx0 + wx1) / 2} y={card.bottom + Math.min(110, woods * 0.35)} n={5} seed={i * 31 + 5} spread={Math.min(150, wx1 - wx0)} />
                  </g>
                )}
              </g>
            );
          })}

        {/* the sea, in the corner at the foot of the map, with a boat and the compass */}
        <g transform={`translate(${f1(w)} ${f1(h)})`}>
          <path d={wide ? "M0 -330C-90 -310 -170 -270 -210 -210S-300 -90 -380 -40S-470 0 -520 0H0Z" : "M0 -170C-50 -160 -90 -130 -110 -96S-160 -20 -200 0H0Z"} fill="#cbd7bd" {...edge} filter="url(#desk-ink)" />
          <g stroke="#80966b" strokeWidth={1.5} fill="none" strokeLinecap="round" className={styles.waves}>
            <path d="M-70 -120q4-4 8 0t8 0" />
            <path d="M-120 -60q4-4 8 0t8 0" />
            <path d="M-46 -40q4-4 8 0t8 0" />
            {wide && <path d="M-200 -110q4-4 8 0t8 0" />}
            {wide && <path d="M-110 -210q4-4 8 0t8 0" />}
          </g>
          <g transform={wide ? "translate(-150 -70)" : "translate(-70 -38)"}>
            <g className={styles.boat}>
              <path d="M0,-3 V-22" {...edge} />
              <path d="M1.5,-21 L1.5,-5 L13,-5 Z" fill="#f4f4f0" {...edge} strokeWidth={1.1} />
              <path d="M-1.5,-17 L-10,-5 L-1.5,-5 Z" fill="#e2e9da" {...edge} strokeWidth={1.1} />
              <path d="M-15,-3 L15,-3 L10,4 L-10,4 Z" fill="#de9372" {...edge} strokeWidth={1.2} />
            </g>
          </g>
          {wide && (
            <g transform="translate(-70 -250)" filter="url(#desk-chip)">
              <circle r={26} fill="#f4f4f0" {...edge} />
              <circle r={20} fill="none" stroke="#9a9f98" strokeWidth={1} strokeDasharray="2 3" />
              <path d="M0,-24 L5,-5 L0,0 Z" fill="#bc4e26" {...edge} strokeWidth={1} />
              <path d="M0,-24 L-5,-5 L0,0 Z" fill="#de9372" {...edge} strokeWidth={1} />
              <path d="M0,24 L5,5 L0,0 Z M0,24 L-5,5 L0,0 Z" fill="#f4f4f0" {...edge} strokeWidth={1} />
              <path d="M24,0 L5,5 L0,0 Z M-24,0 L-5,-5 L0,0 Z" fill="#b8bcb5" {...edge} strokeWidth={1} />
              <path d="M24,0 L5,-5 L0,0 Z M-24,0 L-5,5 L0,0 Z" fill="#f4f4f0" {...edge} strokeWidth={1} />
              <text y={-31} fontSize={10} fontWeight={700} textAnchor="middle" fill="#9c3f1d">
                N
              </text>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

// ── the drone that flies the road ─────────────────────────────────────────

/** One of its legs: a curved blade from its hip on the body down to its foot, on the left; `mirror` puts it on the right. */
const leg = (hx: number, hy: number, fx: number, fy: number, mirror = false) => {
  const m = (x: number) => (mirror ? 120 - x : x);
  return `M${m(hx)} ${hy}C${m(hx - 10)} ${hy + 2} ${m(fx + 2)} ${fy - 26} ${m(fx)} ${fy}L${m(fx + 5)} ${fy + 1}C${m(fx + 8)} ${fy - 22} ${m(hx - 6)} ${hy + 9} ${m(hx + 2)} ${hy + 7}Z`;
};

/**
 * A robot drone, like a ball: a pale grey shell in panels, split open at the front on a dark core lit orange inside,
 * vents on its top, a big eye with a segmented ring round an orange iris, a status light, and four curved legs folded
 * under it; and under it all, an orange thruster pushing the air down. Its eye looks the way it is flying (--look).
 */
function Drone() {
  const ink = { stroke: "#2d2f2b", strokeOpacity: 0.6, strokeWidth: 1.4, strokeLinejoin: "round" } as const;
  const bladeBack = { fill: "#b9bdb6", ...ink };
  const blade = { fill: "#dfe1dc", ...ink };
  return (
    <svg viewBox="0 0 120 128" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="drone-shell" cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#eceee9" />
          <stop offset="0.75" stopColor="#c9cdc6" />
          <stop offset="1" stopColor="#9a9f98" />
        </radialGradient>
        <radialGradient id="drone-core" cx="42%" cy="46%" r="62%">
          <stop offset="0" stopColor="#5e625c" />
          <stop offset="1" stopColor="#1f2120" />
        </radialGradient>
        <filter id="drone-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the two legs behind it */}
      <path d={leg(44, 73, 24, 110)} {...bladeBack} />
      <path d={leg(44, 73, 24, 110, true)} {...bladeBack} />

      {/* the thruster underneath, glowing */}
      <ellipse className={styles.glow} cx={60} cy={93} rx={11} ry={4} fill="#de9372" filter="url(#drone-glow)" />

      {/* the shell */}
      <circle cx={60} cy={56} r={38} fill="url(#drone-shell)" {...ink} />
      <path d="M25 45C38 22 82 22 95 45" fill="none" stroke="#2d2f2b" strokeOpacity={0.3} strokeWidth={1.1} />
      <path d="M60 18.5V26M24 64c9 4 20 6 30 6" fill="none" stroke="#2d2f2b" strokeOpacity={0.28} strokeWidth={1.1} />
      {/* vents on its top */}
      {[
        [49, 23, 12],
        [47, 27.5, 16],
        [49, 32, 12],
      ].map(([x, y, w]) => (
        <path key={y} d={`M${x} ${y}h${w}`} stroke="#4a4d48" strokeWidth={2} strokeLinecap="round" />
      ))}

      {/* split open at the front on its core, lit orange inside */}
      <path d="M27 54C29 39 43 29 60 29C65 35 67 41 67 47C54 47 43 55 37 67C32 63 28 59 27 54Z" fill="url(#drone-core)" {...ink} />
      <g className={styles.glow} filter="url(#drone-glow)" fill="none" stroke="#de9372" strokeLinecap="round">
        <path d="M36 55C40 46 48 40 58 38" strokeWidth={2.2} />
        <path d="M42 60C45 55 49 52 54 50" strokeWidth={1.6} />
        <path d="M33 49l3-2M38 44l3-2.5M45 39.5l3.5-1.5" strokeWidth={2.4} />
      </g>
      <path d="M31 47c3-7 9-12 16-14" fill="none" stroke="#9a9f98" strokeWidth={1.4} strokeDasharray="3 2.5" strokeLinecap="round" />

      {/* a plate over its lower front */}
      <path d="M23 61C25 77 39 90 57 94L56 86C44 82 34 73 31 62Z" fill="#e6e8e3" {...ink} />
      <path d="M29 72l6-3M36 81l5-4" stroke="#2d2f2b" strokeOpacity={0.3} strokeWidth={1.1} strokeLinecap="round" />

      {/* its eye: a housing, a ring of segments, a lens with fins, and an orange iris */}
      <g className={styles.eye}>
        <circle cx={78} cy={58} r={18.5} fill="#4a4d48" {...ink} />
        <circle cx={78} cy={58} r={14.2} fill="none" stroke="#d3d6d0" strokeWidth={3.2} strokeDasharray="5.4 3" />
        <circle cx={78} cy={58} r={9.8} fill="#2d2f2b" />
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * Math.PI * 2;
          return <path key={k} d={`M${(78 + Math.cos(a) * 5.6).toFixed(1)} ${(58 + Math.sin(a) * 5.6).toFixed(1)}L${(78 + Math.cos(a) * 8.6).toFixed(1)} ${(58 + Math.sin(a) * 8.6).toFixed(1)}`} stroke="#5e625c" strokeWidth={1.2} />;
        })}
        <circle className={styles.glow} cx={78} cy={58} r={4.8} fill="#de9372" filter="url(#drone-glow)" />
        <circle cx={78} cy={58} r={2} fill="#3b3d39" />
        <ellipse cx={73.5} cy={52.5} rx={2.6} ry={1.6} fill="#fafaf7" fillOpacity={0.85} transform="rotate(-30 73.5 52.5)" />
      </g>
      <path className={styles.glow} d="M63 67A18 18 0 0 0 71 75" fill="none" stroke="#d0714c" strokeWidth={2} strokeLinecap="round" filter="url(#drone-glow)" />
      {/* a light on its crown, blinking sage */}
      <circle className={styles.status} cx={84} cy={31} r={2.4} fill="#9caf88" stroke="#2d2f2b" strokeOpacity={0.5} strokeWidth={0.8} />

      {/* the two legs in front, and their hips */}
      <path d={leg(33, 68, 6, 118)} {...blade} />
      <path d={leg(33, 68, 6, 118, true)} {...blade} />
      <circle cx={33} cy={68} r={3.2} fill="#5e625c" {...ink} strokeWidth={1} />
      <circle cx={87} cy={68} r={3.2} fill="#5e625c" {...ink} strokeWidth={1} />
    </svg>
  );
}

export default function CareerMap({ heading }: { heading: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const pins = useRef<(HTMLButtonElement | null)[]>([]);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const end = useRef<HTMLAnchorElement>(null);
  const orb = useRef<HTMLDivElement>(null);
  const drone = useRef<HTMLSpanElement>(null);
  const inked = useRef<HTMLDivElement>(null);
  const inkedIn = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [reached, setReached] = useState(-1);
  const ids = useId();

  // where everything fell on the page: the road is drawn through the stops, round their cards, and the land around them
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const w = box.width;
      const h = el.offsetHeight;
      const wide = window.matchMedia(WIDE).matches;
      const col = column.current?.getBoundingClientRect();
      const within = (r?: DOMRect): Box => (r ? { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top } : { left: 0, right: 0, top: 0, bottom: 0 });
      const bands = rows.current.map((row) => within(row?.getBoundingClientRect()));
      // the pins and cards are measured by where they are laid out, not as drawn: a card waiting to pop up is shrunk, and a
      // pin the truck has reached is grown, and neither should move the road
      const tips = pins.current.map((pin, i) => (pin ? { x: bands[i].left + pin.offsetLeft, y: bands[i].top + pin.offsetTop } : { x: 0, y: 0 }));
      const boxes = cards.current.map((card, i): Box => {
        if (!card) return { left: 0, right: 0, top: 0, bottom: 0 };
        const left = bands[i].left + card.offsetLeft;
        const top = bands[i].top + card.offsetTop;
        return { left, right: left + card.offsetWidth, top, bottom: top + card.offsetHeight };
      });
      const left = col ? col.left - box.left : 0;
      const right = col ? col.right - box.left : w;

      // the road: one smooth curve through the stops, from the start above the first (on the far side of the middle
      // from it, so the road comes in on a bend too). With the stops at either side of the middle in turn, each is at
      // the outside of a bend and the road runs straight down through it, so it only ever runs downward.
      const start = wide ? { x: tips[1].x, y: Math.max(40, tips[0].y - 230) } : { x: tips[0].x, y: Math.max(40, tips[0].y - 150) };
      const { d, segments } = through([start, ...tips]);
      const track = sample(segments, 4);
      // where the road goes next: pencilled on down to the sign at the foot of the map
      const last = tips[LAST];
      const sign = end.current?.getBoundingClientRect();
      const target = sign ? { x: sign.left + 18 - box.left, y: sign.top + sign.height / 2 - box.top } : { x: last.x, y: h - 40 };
      const future = downward([last, target]).d;

      // a river right across the land, between the fourth stop's card and the fifth stop, crossing the road on a bridge
      const y = (Math.max(tips[3].y + 40, boxes[3].bottom + 20) + tips[4].y - 50) / 2;
      const river = through([
        { x: -30, y: y - 34 },
        { x: w * 0.24, y: y + 16 },
        { x: w * 0.5, y: y - 12 },
        { x: w * 0.76, y: y + 16 },
        { x: w + 30, y: y - 30 },
      ]);
      const water = sample(river.segments, 4);
      let bridge: Point | null = null;
      let best = Infinity;
      for (const p of water) {
        for (const t of track) {
          const gap = (t.x - p.x) ** 2 + (t.y - p.y) ** 2;
          if (gap < best) {
            best = gap;
            bridge = { x: t.x, y: t.y };
          }
        }
      }
      setGeo({ w, h, wide, column: { left, right }, pins: tips, rows: bands, cards: boxes, road: d, future, river: river.d, bridge, track });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // the ball: it flies down the road as the page scrolls, keeping about level with the middle of the screen, easing
  // after the scroll so it glides rather than jumps
  useEffect(() => {
    const el = sheet.current;
    if (!geo || !el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { track, pins: tips, h } = geo;
    const first = track[0].y;
    const lastY = tips[LAST].y;
    let y = -1;
    let lean = 0;
    let shown = -2;
    let inkedTo = -1;
    let frame = 0;
    let last = 0;

    /** The point on the road level with `target`: the road only ever runs downward, so it can be looked up by height. */
    const level = (target: number) => {
      let lo = 0;
      let hi = track.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (track[mid].y < target) lo = mid;
        else hi = mid;
      }
      const a = track[lo];
      const b = track[hi];
      const k = b.y === a.y ? 0 : Math.min(1, Math.max(0, (target - a.y) / (b.y - a.y)));
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const target = Math.min(lastY, Math.max(first, window.innerHeight * EYE - el.getBoundingClientRect().top));
      y = y < 0 || reduced ? target : y + (target - y) * (1 - Math.exp(-dt * 6));
      const p = level(y);
      if (orb.current) orb.current.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
      // it leans into the bends, and looks the way it is going
      const slope = level(y + 10).x - level(y - 10).x;
      const tilt = Math.max(-10, Math.min(10, slope * 0.55));
      if (drone.current && Math.abs(tilt - lean) > 0.4) {
        lean = tilt;
        drone.current.style.rotate = `${lean.toFixed(1)}deg`;
        drone.current.style.setProperty("--look", (lean * 0.35).toFixed(2));
      }
      // the road behind the ball is inked in: a window over it slides down, and the road inside slides back up by as
      // much, so nothing is redrawn
      if (inked.current && inkedIn.current && Math.abs(y - inkedTo) > 0.3) {
        inkedTo = y;
        const shift = Math.max(0, h - y - 2);
        inked.current.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
        inkedIn.current.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
      }
      // the last stop it has reached
      let at_ = -1;
      tips.forEach((tip, i) => {
        if (y >= tip.y - 6) at_ = i;
      });
      if (at_ !== shown) {
        shown = at_;
        setReached(reduced ? LAST : at_);
      }
      frame = requestAnimationFrame(tick);
    };

    // it only drives while the map is near the screen
    const watch = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(frame);
        if (entry.isIntersecting) {
          last = 0;
          frame = requestAnimationFrame(tick);
        }
      },
      { rootMargin: "300px 0px" },
    );
    watch.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
    };
  }, [geo]);

  // while the map is on the screen, the page scrolls at a walking pace, however hard the wheel or trackpad is flicked: each
  // turn of the wheel is taken, but the page is eased towards it at no more than SLOW pixels a second, and no more than
  // half a screen is ever waiting. (Touch screens scroll as they always do.)
  useEffect(() => {
    const el = sheet.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const SLOW = 720;
    let target = 0;
    let now = 0;
    let frame = 0;
    let last = 0;
    let running = false;
    const step = (time: number) => {
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 1 / 60;
      last = time;
      const gap = target - now;
      now += Math.sign(gap) * Math.min(Math.abs(gap) * (1 - Math.exp(-dt * 9)), SLOW * dt);
      if (Math.abs(target - now) < 0.5) {
        now = target;
        running = false;
      }
      window.scrollTo({ top: now, behavior: "instant" });
      if (running) frame = requestAnimationFrame(step);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || document.body.style.overflow === "hidden") return;
      const box = el.getBoundingClientRect();
      const h = window.innerHeight;
      if (box.top > h * 0.5 || box.bottom < h * 0.5) return;
      event.preventDefault();
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? h : 1);
      if (!running) {
        now = target = window.scrollY;
        last = 0;
        running = true;
        frame = requestAnimationFrame(step);
      }
      // no more than half a screen waiting either way, and never past the top or the foot of the page
      const ahead = Math.min(now + h * 0.5, Math.max(now - h * 0.5, target + dy));
      target = Math.max(0, Math.min(document.documentElement.scrollHeight - h, ahead));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, []);

  /** Scrolls the page until the drone reaches stop `i`. */
  const jump = (i: number) => {
    const el = sheet.current;
    const tip = geo?.pins[i];
    if (!el || !tip) return;
    const top = window.scrollY + el.getBoundingClientRect().top;
    window.scrollTo({ top: top + tip.y - window.innerHeight * EYE + 12, behavior: "smooth" });
  };

  const land = useMemo(() => geo && <Land geo={geo} ids={ids} />, [geo, ids]);

  return (
    <section id="experience" aria-labelledby="experience-title" className="pt-14 sm:pt-20 md:pt-16">
      <div className="gutter">{heading}</div>

      <div ref={sheet} className={styles.sheet}>
        {land}

        {/* the road behind the ball, inked in */}
        {geo && (
          <div ref={inked} className={styles.inked} style={{ height: geo.h, transform: `translate3d(0, ${-geo.h}px, 0)` }} aria-hidden="true">
            <div ref={inkedIn} className={styles.inkedIn} style={{ transform: `translate3d(0, ${geo.h}px, 0)` }}>
              <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} focusable="false">
                <path d={geo.road} fill="none" stroke="#bc4e26" strokeWidth={2.8} strokeDasharray="9 8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        )}

        {/* the drone, flown down the road by the scroll: it hovers over its shadow and the glow of its thruster, on waves
            rippling out over the road under it, with the air it pushes down going down beneath it */}
        <div ref={orb} className={styles.orb} aria-hidden="true">
          <span className={styles.pad} />
          <span className={styles.wave} />
          <span className={styles.wave} />
          <span className={styles.wave} />
          <span className={styles.shadow} />
          <span className={styles.float}>
            <span className={styles.lift} />
            <span className={styles.lift} />
            <span className={styles.lift} />
            <span ref={drone} className={styles.drone}>
              <Drone />
            </span>
          </span>
        </div>

        <div ref={column} className={`gutter ${styles.column}`}>
          {/* the title of the map, and its scale */}
          <div className={styles.cartouche} aria-hidden="true">
            <span className="block text-[0.78rem] font-bold tracking-[0.18em] sm:text-sm">THE ROAD SO FAR</span>
            <span className={styles.cartoucheRule} />
            <span className="block text-[0.6rem] font-bold text-muted sm:text-[0.66rem]">2023 → today · Rawalpindi</span>
            <span className={styles.scale}>
              <i />
              <i />
              <i />
              <i />
              <em>not to scale</em>
            </span>
          </div>

          {/* the stops: a pin on the road, its name, and its card on the map beside it */}
          <ol className={styles.stops}>
            {STOPS.map((stop, i) => (
              <li
                key={stop.id}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                className={styles.row}
                data-side={sideOf(i)}
                style={{ "--x": `${ACROSS[i]}%` } as CSSProperties}
              >
                <button
                  ref={(el) => {
                    pins.current[i] = el;
                  }}
                  type="button"
                  className={styles.pin}
                  data-road={stop.road ? "" : undefined}
                  data-reached={i <= reached ? "" : undefined}
                  onClick={() => jump(i)}
                  aria-label={`Drive to ${stop.title}`}
                >
                  {stop.road ? <Pin n={NUMBER[i]} now={i === LAST} /> : <Flag />}
                </button>
                <span className={styles.name} aria-hidden="true">
                  {stop.name}
                  {i === LAST && <em className={styles.here}>you are here</em>}
                </span>
                <article
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className={`sketch-box ink-${stop.ink} ${styles.card}`}
                  data-shown={i <= reached ? "" : undefined}
                >
                  <span className={styles.tail} aria-hidden="true" />
                  <p className="flex flex-wrap items-center gap-2 pr-16">
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-sienna-600 sm:text-[0.62rem]">{stop.road ? `stop ${NUMBER[i]} of ${ROAD_COUNT}` : "along the way"}</span>
                    <span className="sketch-chip !text-[0.6rem]">{stop.kind}</span>
                  </p>
                  <h3 className="mt-2 pr-14 text-[0.95rem] leading-snug sm:text-base">{stop.title}</h3>
                  <p className="mt-0.5 text-[0.8rem] font-bold text-(--ink-text) sm:text-sm">
                    {stop.url ? (
                      <a href={stop.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 rounded hover:underline hover:decoration-wavy hover:underline-offset-4">
                        {stop.org}
                        <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    ) : (
                      stop.org
                    )}
                  </p>
                  <p className="mt-0.5 text-[0.66rem] font-bold text-muted sm:text-[0.7rem]">
                    {stop.period && <span>{stop.period} · </span>}
                    {stop.detail}
                  </p>
                  <ul className="sketch-list mt-2.5 space-y-1.5 text-[0.72rem] leading-relaxed text-ink/90 sm:text-[0.76rem]">
                    {stop.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <span aria-hidden="true" className={styles.stamp}>
                    <span>{stop.stamp[0]}</span>
                    <strong>{stop.stamp[1]}</strong>
                    <span>{stop.stamp[2]}</span>
                  </span>
                </article>
              </li>
            ))}
          </ol>

          {/* where the road goes next */}
          <div className={styles.end}>
            <a ref={end} href="#contact" className={styles.next}>
              <span className={styles.nextMark} aria-hidden="true">
                ?
              </span>
              next stop: your team?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── the marks ────────────────────────────────────────────────────────────

function Pin({ n, now }: { n: number; now: boolean }) {
  return (
    <svg viewBox="0 0 28 36" className="size-full overflow-visible">
      <path d="M14 35C14 35 3 22.5 3 13.5A11 11 0 0 1 25 13.5C25 22.5 14 35 14 35Z" fill={now ? "#bc4e26" : "#d0714c"} stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M7.6 10.4A7.4 7.4 0 0 1 11.4 6.6" fill="none" stroke="#f4f4f0" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={14} cy={13.5} r={6.6} fill="#f4f4f0" stroke="#2d2f2b" strokeOpacity={0.5} strokeWidth={1.1} />
      <text x={14} y={16.7} textAnchor="middle" fontSize={9} fontWeight={700} fill="#2d2f2b">
        {n}
      </text>
    </svg>
  );
}

function Flag() {
  return (
    <svg viewBox="0 0 28 36" className="size-full overflow-visible">
      <ellipse cx={14} cy={35} rx={5.5} ry={1.8} fill="#2d2f2b" fillOpacity={0.25} />
      <path d="M14 35V3.5" stroke="#2d2f2b" strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" />
      <path className={styles.cloth} d="M15 4.5C20 2.5 24 7.5 32 4.5V16C24 19 20 14 15 16Z" fill="#9caf88" stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={1.3} strokeLinejoin="round" />
      <circle cx={14} cy={3} r={1.8} fill="#bc4e26" />
    </svg>
  );
}
