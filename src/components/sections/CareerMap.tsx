"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CERTIFICATIONS, EDUCATION, EXPERIENCE, type Ink, type Role } from "@/lib/content";
import { ArrowUpRight } from "@/components/sketch/Icons";
import { at, Block, Detail, frontFace, rounded, sideFace, TONES, type Tone } from "@/components/desk/iso";
import { Mountains, Scene, SCENE, Tree } from "./MapScenes";
import styles from "./Map.module.css";

/**
 * Experience, as a road trip down a map: a long hand-drawn map laid across
 * the whole width of the page — hills, forests, a river, the sea — with every
 * role, in order, as a stop on one road that zig-zags down it: down one side
 * of the page, back across on a switchback, down the other side, and so on.
 * The workshop and hackathons are flags beside the road.
 *
 * As the page scrolls down, a little 3D truck drives down the road with it,
 * and each stop's card pops up on the map beside the stop as the truck pulls
 * up there (and folds away again if it is driven back up). The road behind it
 * is inked in; the road ahead is still in pencil. Across from each card stands
 * a little picture of the place, under its own hills.
 *
 * The road is drawn through wherever the stops and their cards fall on the
 * page, so the map fits any width; on a phone it runs down the left with the
 * cards beside it.
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
 * Across the page, where each stop's pin stands on a wide screen, in percent: the road runs down one side, switches
 * back across, and runs down the other. Each card sits inward of its pin, and the picture of the place across from it.
 */
const ACROSS = [16, 84, 16, 84, 16, 84, 16, 84];
const sideOf = (i: number) => (i % 2 ? "left" : "right");

/** How far down the screen the truck keeps: about level with the middle of what is being read. */
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
  /** the road, sampled every few pixels down its length, for the truck */
  track: { x: number; y: number; dx: number }[];
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
                <Mountains />
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
            const pin = geo.pins[i];
            // across from the card: the picture of the place, nearer the road, and hills beyond it towards the edge of the
            // page, where there is room for both
            const right = sideOf(i) === "right";
            const [from, to] = right ? [card.right + 40, column.right - 8] : [column.left + 8, card.left - 40];
            const room = to - from;
            const hills = room > 480;
            const sceneRoom = hills ? room - 250 : room;
            const scale = Math.min(1.1, sceneRoom / (SCENE.w + 20));
            const sceneLeft = right ? from : to - sceneRoom;
            // beside the road, on its outside: a forest
            const outside = right ? (column.left + pin.x - 40) / 2 : (pin.x + 40 + column.right) / 2;
            return (
              <g key={stop.id}>
                {hills && (
                  <g transform={`translate(${f1(right ? to - 236 : from + 4)} ${f1(card.bottom - 14)})`}>
                    <Mountains />
                  </g>
                )}
                {scale >= 0.55 && (
                  <g transform={`translate(${f1(sceneLeft + (sceneRoom - SCENE.w * scale) / 2)} ${f1(card.bottom - SCENE.h * scale)}) scale(${scale.toFixed(3)})`}>
                    <Scene id={stop.id} />
                  </g>
                )}
                <g filter="url(#desk-chip)">
                  <Forest x={outside} y={pin.y + 90} n={4} seed={i * 31 + 5} spread={Math.min(90, Math.abs(pin.x - column.left) * 0.7)} />
                  <Forest x={outside} y={card.bottom - 40} n={3} seed={i * 17 + 2} spread={Math.min(80, Math.abs(pin.x - column.left) * 0.6)} />
                </g>
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

// ── the truck that drives the road ──────────────────────────────────────

const CAB: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const KRAFT: Tone = { top: "#ecbea9", left: "#e2b5a1", right: "#de9372" };
/** The truck's own view box, around the point on the ground under its middle, (360, 402). */
const TRUCK_VIEW = { x: 314, y: 352, w: 94, h: 78 };

/** A little 3D truck, in the site's own hand, facing down and to the right; turned round, it faces down and to the left. */
function MiniTruck() {
  return (
    <svg viewBox={`${TRUCK_VIEW.x} ${TRUCK_VIEW.y} ${TRUCK_VIEW.w} ${TRUCK_VIEW.h}`} aria-hidden="true" focusable="false">
      <ellipse cx={360} cy={404} rx={40} ry={11} fill={INK} fillOpacity={0.14} />
      <g filter="url(#desk-chip)">
        <Block x0={-30} x1={14} y0={-14} y1={-11.5} z={9} h={8} tone={TONES.paper} r={1.5} width={1} />
        <Block x0={-30} x1={-27.5} y0={-14} y1={14} z={9} h={8} tone={TONES.paper} r={1.5} width={1} />
        <Block x0={-30} x1={14} y0={-14} y1={14} z={3} h={6} tone={TONES.concrete} r={3} width={1.1} />
        <Block x0={-22} x1={-6} y0={-9} y1={9} z={9} h={12} tone={KRAFT} r={2} width={1} />
        <Block x0={-30} x1={14} y0={11.5} y1={14} z={9} h={8} tone={TONES.paper} r={1.5} width={1} />
        <Block x0={14} x1={36} y0={-13} y1={13} z={3} h={27} tone={CAB} r={5} width={1.2} />
      </g>
      <Detail d={rounded(sideFace(36, -9, 9, 17, 27), 2)} fill="#cbd7bd" width={1} />
      <Detail d={rounded(frontFace(18, 32, 17, 27, 13), 2)} fill="#cbd7bd" width={1} />
      <Detail d={rounded(sideFace(36, 6, 10, 7, 11), 1)} fill="#fafaf7" width={0.8} />
      {[-20, 26].map((x) => {
        const [cx, cy] = at(x, 14, 4);
        return (
          <g key={x}>
            <ellipse cx={cx} cy={cy} rx={4.6} ry={5.4} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1} />
            <ellipse cx={cx} cy={cy} rx={1.8} ry={2.1} fill="#b8bcb5" />
          </g>
        );
      })}
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
  const truck = useRef<HTMLDivElement>(null);
  const inked = useRef<HTMLDivElement>(null);
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
      const wide = window.matchMedia("(min-width: 48rem)").matches;
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

      // the road: down to each stop, on past its card, then (on a wide screen) back across the page to the next
      const points: Point[] = [{ x: tips[0].x, y: Math.max(40, tips[0].y - 150) }];
      tips.forEach((tip, i) => {
        if (wide && i > 0) points.push({ x: tip.x, y: tip.y - 70 });
        points.push(tip);
        if (wide && i < LAST) points.push({ x: tip.x, y: Math.max(tip.y + 40, boxes[i].bottom + 28) });
      });
      const { d, segments } = downward(points);
      const samples = sample(segments, 5);
      const track = samples.map((p, i) => {
        const b = samples[Math.min(samples.length - 1, i + 1)];
        const a = samples[Math.max(0, i - 1)];
        return { x: p.x, y: p.y, dx: b.x - a.x };
      });
      // where the road goes next: pencilled on down to the sign at the foot of the map
      const last = tips[LAST];
      const sign = end.current?.getBoundingClientRect();
      const target = sign ? { x: sign.left + 18 - box.left, y: sign.top + sign.height / 2 - box.top } : { x: last.x, y: h - 40 };
      // (on past the last card, then across to the sign, so it never runs under the card)
      const future = downward(wide ? [last, { x: last.x, y: Math.min(target.y - 60, boxes[LAST].bottom + 30) }, target] : [last, target]).d;

      // a river right across the land, between the fourth stop's card and the fifth stop, crossing the road on a bridge
      const y = (Math.max(tips[3].y + 40, boxes[3].bottom + 28) + tips[4].y - 70) / 2;
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

  // the truck: it drives down the road as the page scrolls, keeping about level with the middle of the screen
  useEffect(() => {
    const el = sheet.current;
    if (!geo || !el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { track, pins: tips, h } = geo;
    const first = track[0].y;
    const lastY = tips[LAST].y;
    let y = -1;
    let facing = 1;
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
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: a.dx + (b.dx - a.dx) * k };
    };
    /** Which way the road will next turn below `target`: the truck faces that way down its straight runs. */
    const ahead = (target: number) => {
      for (const t of track) if (t.y > target && Math.abs(t.dx) > 0.5) return Math.sign(t.dx);
      return facing;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const target = Math.min(lastY, Math.max(first, window.innerHeight * EYE - el.getBoundingClientRect().top));
      y = y < 0 || reduced ? target : y + (target - y) * (1 - Math.exp(-dt * 7));
      const p = level(y);
      facing = Math.abs(p.dx) > 0.5 ? Math.sign(p.dx) : ahead(y);
      if (truck.current) truck.current.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${facing}, 1)`;
      // the road behind the truck is inked in
      if (inked.current && Math.abs(y - inkedTo) > 0.8) {
        inkedTo = y;
        inked.current.style.clipPath = `inset(0 0 ${Math.max(0, h - y - 2).toFixed(0)}px 0)`;
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

  /** Scrolls the page until the truck reaches stop `i`. */
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

        {/* the road behind the truck, inked in */}
        {geo && (
          <div ref={inked} className={styles.inked} style={{ clipPath: "inset(0 0 100% 0)" }} aria-hidden="true">
            <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} focusable="false">
              <path d={geo.road} fill="none" stroke="#bc4e26" strokeWidth={2.8} strokeDasharray="9 8" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* the truck, driven down the road by the scroll */}
        <div ref={truck} className={styles.truck} aria-hidden="true">
          <div className={styles.truckBody}>
            <MiniTruck />
          </div>
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
