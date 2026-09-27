"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES, type Point } from "@/components/desk/iso";
import { light, place, useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * FocusFlow, a student productivity system, as a campus.
 *
 * Three buildings stand in a row: the React app, the Express API behind its
 * JWT gate, and the Oracle database with its seventeen tables and triggers. In
 * front stand the cron tower with its clock, and the mailbox. Requests travel
 * from the app through the API, past its JWT gate, to the database and back
 * all day, while the sun crosses the sky and the attendance fills in on the
 * app's roof; at midnight, under the moon, the clock strikes, the five cron
 * services wake one after another, the triggers fire across the seventeen
 * tables, and the reminders fly out.
 */

const FRONT = -20;
const BUILDINGS = [
  { key: "app", x0: -200, x1: -120, h: 46, tone: TONES.paper, tag: "react" },
  { key: "api", x0: -80, x1: 0, h: 64, tone: TONES.sageDeep, tag: "express" },
  { key: "db", x0: 40, x1: 120, h: 84, tone: TONES.concrete, tag: "oracle" },
];
const NODES: FlowNode[] = [
  ...BUILDINGS.map((b, i): FlowNode => ({ key: b.key, x0: b.x0, x1: b.x1, y0: -100, y1: FRONT, z: 6, h: b.h, tone: b.tone, tag: b.tag, order: 0.05 + i * 0.1, big: true })),
  { key: "tower", x0: -60, x1: -28, y0: 40, y1: 72, z: 6, h: 104, tone: TONES.paper, r: 6, order: 0.45, big: true },
  { key: "mail", x0: 60, x1: 92, y0: 52, y1: 82, z: 6, h: 28, tone: TONES.sienna, tag: "mail", order: 0.55 },
];
const DAY = 7000;
const MIDNIGHT = 4400;
const ROUTES: FlowRoute[] = [
  { stops: ["app", "api", "db"], colour: "#80966b", at: 0 },
  { stops: ["db", "api", "app"], colour: "#7c817a", at: 1700 },
  { stops: ["tower", "db"], colour: "#d0714c", lit: "warm", at: MIDNIGHT + 700 },
  { stops: ["db", "mail"], colour: "#d0714c", lit: "warm", at: MIDNIGHT + 1500 },
];
const HOP = 700;

export default function FocusFlowRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const hand = useRef<SVGPathElement>(null);
  const crons = useRef<(SVGCircleElement | null)[]>([]);
  const letters = useRef<(SVGGElement | null)[]>([]);
  const sky = useRef<SVGGElement>(null);
  const skyBody = useRef<SVGCircleElement>(null);
  const night = useRef<SVGRectElement>(null);
  const bolt = useRef<SVGPathElement>(null);
  const marks = useRef<(SVGRectElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    const t = ms % DAY;
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, DAY);
    // the clock goes round once a day and points straight up at midnight
    hand.current?.setAttribute("transform", `rotate(${((360 * (t - MIDNIGHT)) / DAY).toFixed(1)} 16 16)`);
    // the five cron services wake one after another
    crons.current.forEach((cron, i) => light(cron, t > MIDNIGHT + i * 120 && t < MIDNIGHT + 1400));
    // the day: the sun across the sky, the moon at midnight, and the campus a shade darker at night
    const p = ((t - MIDNIGHT + DAY) % DAY) / DAY;
    const dark = Math.max(0, Math.cos(p * Math.PI * 2));
    const day = p >= 0.25 && p < 0.75;
    // each crosses from the left to the right in its half of the day, highest at noon or at midnight
    const s = day ? (p - 0.25) / 0.5 : ((p + 0.25) % 1) / 0.5;
    sky.current?.setAttribute("transform", `translate(${(110 + 460 * s).toFixed(1)} ${(248 - Math.sin(s * Math.PI) * 44).toFixed(1)})`);
    skyBody.current?.setAttribute("fill", day ? "#e0916f" : "#e6e8e3");
    night.current?.setAttribute("opacity", (dark * 0.14).toFixed(3));
    // the triggers firing in the database as the cron reaches it
    bolt.current?.setAttribute("opacity", t > MIDNIGHT + 1300 && t < MIDNIGHT + 2100 ? "1" : "0");
    // the attendance, marked through the day
    const marked = Math.floor(((p + 0.75) % 1) * 16);
    marks.current.forEach((mark, i) => mark?.setAttribute("fill", i < marked ? (i % 5 === 3 ? "#e2b5a1" : "#9caf88") : "#e3e5e0"));
    // and the reminders fly up out of the mailbox
    letters.current.forEach((letter, i) => {
      const u = (t - MIDNIGHT - 2300 - i * 260) / 1100;
      const from = at(76, 67, 40);
      place(letter, u > 0 && u < 1 ? ([from[0] + u * 50 + i * 8, from[1] - u * 90] as Point) : [-999, -999]);
      letter?.setAttribute("opacity", (u > 0 && u < 1 ? 1 - u * 0.8 : 0).toFixed(2));
    });
  });

  return (
    <svg ref={svg} viewBox="54 190 560 358" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the sky: the sun by day, the moon by night */}
      <g ref={sky} className={styles.tag} transform="translate(-999 -999)">
        <circle ref={skyBody} r={9} fill="#e0916f" stroke="rgba(45,47,43,0.4)" strokeWidth={1} />
      </g>
      <Part arrival={{ lift: 30, from: 0.06, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-230} x1={160} y0={-130} y1={120} z={0} h={6} tone={TONES.sage} r={22} />
        </g>
      </Part>
      <FlowNodes nodes={NODES} refs={nodes} />

      {/* the buildings' windows */}
      {BUILDINGS.map((b) => (
        <g key={b.key} transform={onFront(at(b.x0, FRONT, 6 + b.h))} className={styles.tag}>
          {Array.from({ length: Math.floor((b.h - 14) / 14) }, (_, row) =>
            [10, 30, 50].map((u) => <rect key={`${row}-${u}`} x={u} y={10 + row * 14} width={12} height={7} rx={2} fill="#f4f4f0" stroke="rgba(45,47,43,0.35)" strokeWidth={0.8} />),
          )}
        </g>
      ))}

      {/* the cron tower's clock, and its five services */}
      <g transform={onFront(at(-60, 72, 106))} className={styles.tag}>
        <circle cx={16} cy={16} r={11} fill="#f4f4f0" stroke="#2d2f2b" strokeWidth={1.4} />
        <path d="M16 7.5V9M16 23V24.5M7.5 16H9M23 16H24.5" stroke="#9a9f98" strokeWidth={1.2} />
        <path ref={hand} d="M16 16V8" stroke="#bc4e26" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={16} cy={16} r={1.6} fill="#2d2f2b" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            ref={(el) => {
              crons.current[i] = el;
            }}
            cx={16}
            cy={38 + i * 11}
            r={3.4}
            className={styles.led}
            stroke="rgba(45,47,43,0.5)"
            strokeWidth={0.8}
          />
        ))}
        <text x={16} y={98} textAnchor="middle" fontSize={5} fontWeight={700} fill="#5e625c">
          cron
        </text>
      </g>

      {/* the API's gate: every request carries its token */}
      <g transform={onFront(at(-44, FRONT, 22))} className={styles.tag}>
        <path d="M8 0.5L15 3V8.5C15 12.6 12 15.2 8 16.5C4 15.2 1 12.6 1 8.5V3Z" fill="#f4f4f0" stroke="#4c5e3e" strokeWidth={1.1} />
        <text x={8} y={10.4} textAnchor="middle" fontSize={3.8} fontWeight={700} fill="#4c5e3e">
          JWT
        </text>
      </g>
      {/* the database's tables, and the triggers firing across them */}
      <g transform={onFront(at(44, FRONT, 18))} className={styles.tag}>
        <text x={2} y={4} fontSize={5.4} fontWeight={700} fill="#2d2f2b">
          17 tables
        </text>
        <path ref={bolt} d="M60 -12L54 -2H59L55 8L64 -5H59L62 -12Z" fill="#d0714c" stroke="#9c3f1d" strokeWidth={0.6} opacity={0} />
      </g>
      {/* the attendance, marked on the app's roof through the day */}
      <g transform={onTop(at(-196, -96, 52))} className={styles.tag}>
        {Array.from({ length: 16 }, (_, i) => (
          <rect
            key={i}
            ref={(el) => {
              marks.current[i] = el;
            }}
            x={6 + (i % 8) * 8}
            y={10 + Math.floor(i / 8) * 10}
            width={6}
            height={7}
            rx={1.5}
            fill="#e3e5e0"
          />
        ))}
      </g>
      {/* the night, a shade over the whole campus */}
      <rect ref={night} x={54} y={190} width={560} height={358} fill="#242623" opacity={0} pointerEvents="none" />

      {/* the reminders */}
      {built &&
        [0, 1, 2].map((i) => (
          <g
            key={i}
            ref={(el) => {
              letters.current[i] = el;
            }}
            transform="translate(-999 -999)"
          >
            <rect x={-7} y={-5} width={14} height={10} rx={1.5} fill="#f4f4f0" stroke="#2d2f2b" strokeWidth={1} />
            <path d="M-7 -5L0 1L7 -5" fill="none" stroke="#bc4e26" strokeWidth={1} />
          </g>
        ))}

      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
