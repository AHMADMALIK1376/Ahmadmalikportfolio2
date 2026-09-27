"use client";

import { useRef } from "react";
import { at, Block, drawn, line, onFront, onTop, Part, TONES } from "@/components/desk/iso";
import { useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * HireMe Agent, as a hub with four stations round it.
 *
 * Claude is in the middle. The CV comes in and goes out as fields; the Adzuna
 * job board sends its jobs in on its aerial and the best three are picked; the
 * press writes a three-paragraph letter for each; and the letters wait at the
 * review desk behind a lock that never opens on its own — the person reads,
 * edits and sends them.
 */

const NODES: FlowNode[] = [
  { key: "hub", x0: -38, x1: 38, y0: -38, y1: 38, z: 6, h: 32, tone: TONES.sienna, r: 32, tag: "claude", order: 0.05, big: true },
  { key: "cv", x0: -30, x1: 30, y0: -150, y1: -100, z: 6, h: 16, tone: TONES.paper, tag: "cv · pdf", order: 0.25 },
  { key: "adzuna", x0: 100, x1: 150, y0: -30, y1: 30, z: 6, h: 24, tone: TONES.sage, tag: "adzuna", order: 0.35 },
  { key: "press", x0: -30, x1: 30, y0: 100, y1: 150, z: 6, h: 22, tone: TONES.concrete, tag: "letters", order: 0.45 },
  { key: "review", x0: -150, x1: -100, y0: -30, y1: 30, z: 6, h: 14, tone: TONES.paper, tag: "review", order: 0.55 },
];
const ROUTES: FlowRoute[] = [
  { stops: ["cv", "hub"], colour: "#80966b", at: 0 },
  { stops: ["adzuna", "hub"], colour: "#7c817a", at: 900 },
  { stops: ["hub", "press"], colour: "#d0714c", lit: "warm", at: 1800 },
  { stops: ["press", "review"], colour: "#d0714c", lit: "warm", at: 2700 },
];
const CYCLE = 3800;
const HOP = 800;

export default function HireMeRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const waiting = useRef<SVGTextElement>(null);
  const jobs = useRef<(SVGRectElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, CYCLE);
    // a letter a round for each of the best three jobs, then the desk starts over
    const round = Math.floor((ms + CYCLE - 2700 - HOP) / CYCLE);
    if (waiting.current) waiting.current.textContent = `${Math.max(0, round % 4)}/3 waiting`;
    jobs.current.forEach((job, i) => job?.setAttribute("fill", i === round % 3 ? "#d0714c" : "#e3e5e0"));
  });

  return (
    <svg ref={svg} viewBox="84 232 552 334" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      <Part arrival={{ lift: 30, from: 0.08, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-170} x1={170} y0={-170} y1={170} z={0} h={6} tone={TONES.concrete} r={70} />
        </g>
      </Part>
      <FlowNodes nodes={NODES} refs={nodes} />

      {/* the job board's aerial, and its three best jobs */}
      <g className={styles.tag}>
        <path d={line(at(140, -20, 30), at(140, -20, 58))} stroke="#5e625c" strokeWidth={2} strokeLinecap="round" />
        <circle cx={at(140, -20, 58)[0]} cy={at(140, -20, 58)[1]} r={3.4} fill="#d0714c" />
        <path d={`M${at(140, -20, 62).join(" ")}m-8 -4a10 10 0 0 1 16 0M${at(140, -20, 62).join(" ")}m-12 -9a16 16 0 0 1 24 0`} fill="none" stroke="#9a9f98" strokeWidth={1.4} strokeLinecap="round" />
      </g>
      <g transform={onFront(at(100, 30, 26))} className={styles.tag}>
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            ref={(el) => {
              jobs.current[i] = el;
            }}
            x={4 + i * 15}
            y={6}
            width={11}
            height={11}
            rx={3}
            fill="#e3e5e0"
            stroke="rgba(45,47,43,0.4)"
          />
        ))}
      </g>

      {/* the review desk: the letters waiting, behind a lock */}
      <g transform={onTop(at(-146, -26, 20))} className={styles.tag}>
        <rect x={30} y={30} width={12} height={10} rx={2} fill="#d0714c" />
        <path d="M32.5 30v-3.5a3.5 3.5 0 0 1 7 0V30" fill="none" stroke="#9c3f1d" strokeWidth={1.6} />
      </g>
      <g transform={onFront(at(-150, 30, 12))} className={styles.tag}>
        <text ref={waiting} x={4} y={7} fontSize={5.4} fontWeight={700} fill="#9c3f1d">
          0/3 waiting
        </text>
      </g>

      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
