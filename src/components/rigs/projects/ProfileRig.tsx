"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES } from "@/components/desk/iso";
import { useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * The animated GitHub profile, as a staircase climbing to the right, a step
 * for each stage of the daily rebuild: the workflow on its schedule, the
 * GitHub API with the contributions and languages, the Python build that turns
 * them into animated SVGs, and on the top step the profile itself. Each day
 * the workflow wakes, the data climbs to the build, the SVGs are carried up,
 * and another day's squares fill in on the profile's calendar.
 */

const STEP = 118;
const stepY = (i: number) => ({ y0: 60 - i * STEP, y1: 160 - i * STEP, z: i * 40 + 10 });
const NODES: FlowNode[] = [
  { key: "cron", x0: -60, x1: 0, ...{ y0: 80, y1: 130 }, z: stepY(0).z, h: 14, tone: TONES.paper, r: 4, tag: "cron", order: 0.2 },
  { key: "actions", x0: 20, x1: 70, y0: 85, y1: 125, z: stepY(0).z, h: 26, tone: TONES.dark, tag: "actions", order: 0.25 },
  { key: "api", x0: -40, x1: 60, y0: -32, y1: 18, z: stepY(1).z, h: 26, tone: TONES.sageDeep, tag: "github api", tagSize: 5.6, order: 0.35 },
  { key: "python", x0: -50, x1: 0, y0: -150, y1: -110, z: stepY(2).z, h: 28, tone: TONES.sienna, tag: "python", order: 0.45 },
  { key: "svg", x0: 20, x1: 70, y0: -146, y1: -112, z: stepY(2).z, h: 12, tone: TONES.paper, r: 4, tag: "svg", order: 0.5 },
  { key: "profile", x0: -60, x1: 90, y0: -250, y1: -244, z: stepY(3).z, h: 108, tone: TONES.paper, r: 8, order: 0.6, big: true },
];
const DAY = 4200;
const ROUTES: FlowRoute[] = [
  { stops: ["cron", "actions"], colour: "#7c817a", at: 0 },
  { stops: ["actions", "api", "python", "svg", "profile"], colour: "#80966b", at: 600 },
];
const HOP = 620;
const WEEKS = 13;
const shade = (i: number) => ["#e2e9da", "#cbd7bd", "#9caf88", "#647a52"][(i * 7 + (i >> 2)) % 4];

export default function ProfileRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const days = useRef<(SVGRectElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, DAY);
    // each day's rebuild fills in another few squares on the calendar
    const filled = (40 + Math.floor((ms + DAY - 600 - 4 * HOP) / DAY) * 4) % (WEEKS * 7);
    days.current.forEach((day, i) => day?.setAttribute("fill", i < filled ? shade(i) : "#eceee9"));
  });

  return (
    <svg ref={svg} viewBox="146 0 562 540" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the steps, the top one first so the lower ones stand in front */}
      {[3, 2, 1, 0].map((i) => {
        const { y0, y1, z } = stepY(i);
        return (
          <Part key={i} arrival={{ lift: 36, from: 0.06 + (3 - i) * 0.05, span: 0.14 }} style={drawn((3 - i) * 0.05, 0.1 + (3 - i) * 0.05)}>
            <g filter="url(#desk-card)">
              <Block x0={-80} x1={100} y0={y0} y1={y1} z={0} h={z} tone={i % 2 ? TONES.concrete : TONES.paper} r={14} />
            </g>
          </Part>
        );
      })}
      <FlowNodes nodes={NODES} refs={nodes} />

      {/* the schedule's calendar */}
      <g transform={onTop(at(-58, 82, stepY(0).z + 14))} className={styles.tag}>
        <path d="M4 10H56M4 20H56M4 30H56M4 40H56M17 4V46M30 4V46M43 4V46" stroke="#b8bcb5" strokeWidth={1} />
      </g>

      {/* the profile: a name, a contributions calendar that fills in, and a map of languages */}
      <g transform={onFront(at(-60, -244, stepY(3).z + 108))} className={styles.tag}>
        <text x={10} y={14} fontSize={6.6} fontWeight={700} fill="#2d2f2b">
          @AHMADMALIK1376
        </text>
        {Array.from({ length: WEEKS * 7 }, (_, i) => (
          <rect
            key={i}
            ref={(el) => {
              days.current[i] = el;
            }}
            x={10 + Math.floor(i / 7) * 9.6}
            y={24 + (i % 7) * 9.6}
            width={7.4}
            height={7.4}
            rx={1.6}
            fill="#eceee9"
          />
        ))}
        <path d="M18 98c6-4 14-4 20 0s14 3 20-1 12-3 18 1M84 96c8-3 16-2 22 2s10 2 16-1" fill="none" stroke="#d0714c" strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
      </g>

      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
