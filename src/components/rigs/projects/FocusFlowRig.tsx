"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, Part, TONES, type Point } from "@/components/desk/iso";
import { light, place, useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * FocusFlow, a student productivity system, as a campus.
 *
 * Three buildings stand in a row: the React app, the Express API behind its
 * JWT gate, and the Oracle database with its seventeen tables and triggers. In
 * front stand the cron tower with its clock, and the mailbox. Requests travel
 * from the app through the API to the database and back all day; at midnight
 * the clock strikes, the five cron services wake one after another, the
 * attendance triggers fire in the database, and the reminders fly out.
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

  useClock(built, svg, (ms) => {
    const t = ms % DAY;
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, DAY);
    // the clock goes round once a day and points straight up at midnight
    hand.current?.setAttribute("transform", `rotate(${((360 * (t - MIDNIGHT)) / DAY).toFixed(1)} 16 16)`);
    // the five cron services wake one after another
    crons.current.forEach((cron, i) => light(cron, t > MIDNIGHT + i * 120 && t < MIDNIGHT + 1400));
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
