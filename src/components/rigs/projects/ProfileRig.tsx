"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES, type Point } from "@/components/desk/iso";
import { useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * The animated GitHub profile, as a staircase climbing to the right, a step
 * for each stage of the daily rebuild: the workflow on its schedule, the
 * GitHub API with the contributions and languages, the Python build that turns
 * them into animated SVGs, and on the top step the profile itself. Each day
 * the workflow wakes — today marked on its calendar, the Actions gear turning —
 * the API's language shares shift a little, the data climbs to the build, the
 * SVGs are carried up, another day's squares fill in on the profile's
 * calendar, and a robotic arm sets a newly found language onto the board.
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
// the arm stands on the top step, in front of the board
const ARM_BASE: Point = at(78, -214, stepY(3).z + 14);
const shade = (i: number) => ["#e2e9da", "#cbd7bd", "#9caf88", "#647a52"][(i * 7 + (i >> 2)) % 4];

export default function ProfileRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const days = useRef<(SVGRectElement | null)[]>([]);
  const today = useRef<SVGRectElement>(null);
  const shares = useRef<(SVGRectElement | null)[]>([]);
  const arm = useRef<{ upper: SVGLineElement | null; lower: SVGLineElement | null; hand: SVGGElement | null }>({ upper: null, lower: null, hand: null });

  useClock(built, svg, (ms) => {
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, DAY);
    // each day's rebuild fills in another few squares on the calendar
    const filled = (40 + Math.floor((ms + DAY - 600 - 4 * HOP) / DAY) * 4) % (WEEKS * 7);
    days.current.forEach((day, i) => day?.setAttribute("fill", i < filled ? shade(i) : "#eceee9"));
    // today, marked on the schedule's calendar
    const d = Math.floor(ms / DAY) % 16;
    today.current?.setAttribute("x", String(4 + (d % 4) * 13));
    today.current?.setAttribute("y", String(4 + Math.floor(d / 4) * 10));
    // each language's share, shifting a little from day to day
    shares.current.forEach((bar, i) => bar?.setAttribute("width", ((([42, 31, 18][i] + Math.sin(ms / DAY + i * 2) * 3) / 42) * 56).toFixed(1)));
    // the arm: down to pick up the new language, up to set it on the board, and back
    const t = (ms % DAY) / DAY;
    const reach = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
    const e = reach * reach * (3 - 2 * reach);
    const shoulder = ARM_BASE;
    const a1 = (-120 + e * 70) * (Math.PI / 180);
    const a2 = a1 + (80 - e * 110) * (Math.PI / 180);
    const elbow: Point = [shoulder[0] + Math.cos(a1) * 22, shoulder[1] + Math.sin(a1) * 22];
    const wrist: Point = [elbow[0] + Math.cos(a2) * 18, elbow[1] + Math.sin(a2) * 18];
    const { upper, lower, hand } = arm.current;
    upper?.setAttribute("x2", elbow[0].toFixed(1));
    upper?.setAttribute("y2", elbow[1].toFixed(1));
    lower?.setAttribute("x1", elbow[0].toFixed(1));
    lower?.setAttribute("y1", elbow[1].toFixed(1));
    lower?.setAttribute("x2", wrist[0].toFixed(1));
    lower?.setAttribute("y2", wrist[1].toFixed(1));
    hand?.setAttribute("transform", `translate(${wrist[0].toFixed(1)} ${wrist[1].toFixed(1)})`);
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

      {/* today, on the schedule's calendar */}
      <g transform={onTop(at(-58, 82, stepY(0).z + 14))} className={styles.tag}>
        <rect ref={today} x={4} y={4} width={12} height={9} rx={2} fill="#e2b5a1" />
      </g>
      {/* the Actions runner's gear */}
      <g transform={onTop(at(60, 116, stepY(0).z + 26))} className={styles.tag}>
        <g className={styles.spin}>
          <circle r={6} fill="none" stroke="#b8bcb5" strokeWidth={2.4} strokeDasharray="2.4 2" />
          <circle r={2.4} fill="#b8bcb5" />
        </g>
      </g>
      {/* each language's share of the code, on the API's front */}
      <g transform={onFront(at(-36, 18, stepY(1).z + 24))} className={styles.tag}>
        {["ts", "py", "js"].map((name, i) => (
          <g key={name}>
            <text x={2} y={6 + i * 7} fontSize={4.6} fontWeight={700} fill="#2d2f2b">
              {name}
            </text>
            <rect x={14} y={2 + i * 7} width={56} height={4} rx={2} fill="#e3e5e0" />
            <rect
              ref={(el) => {
                shares.current[i] = el;
              }}
              x={14}
              y={2 + i * 7}
              width={40}
              height={4}
              rx={2}
              fill={["#80966b", "#d0714c", "#9a9f98"][i]}
            />
          </g>
        ))}
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

      {/* the arm that sets each newly found language onto the board */}
      <g className={styles.tag}>
        <ellipse cx={ARM_BASE[0]} cy={ARM_BASE[1] + 12} rx={11} ry={5} fill="#5e625c" stroke="rgba(45,47,43,0.55)" />
        <path d={`M${ARM_BASE[0] - 5} ${ARM_BASE[1] + 12}V${ARM_BASE[1]}H${ARM_BASE[0] + 5}V${ARM_BASE[1] + 12}`} fill="#7c817a" stroke="rgba(45,47,43,0.55)" />
        <line
          ref={(el) => {
            arm.current.upper = el;
          }}
          x1={ARM_BASE[0]}
          y1={ARM_BASE[1]}
          x2={ARM_BASE[0]}
          y2={ARM_BASE[1] - 22}
          stroke="#9caf88"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <line
          ref={(el) => {
            arm.current.lower = el;
          }}
          x1={ARM_BASE[0]}
          y1={ARM_BASE[1] - 22}
          x2={ARM_BASE[0] + 18}
          y2={ARM_BASE[1] - 22}
          stroke="#cbd7bd"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle cx={ARM_BASE[0]} cy={ARM_BASE[1]} r={3.4} fill="#5e625c" />
        <g
          ref={(el) => {
            arm.current.hand = el;
          }}
          transform={`translate(${ARM_BASE[0] + 18} ${ARM_BASE[1] - 22})`}
        >
          <rect x={-8} y={-4} width={16} height={8} rx={2} fill="#f5dfd5" stroke="rgba(45,47,43,0.55)" strokeWidth={0.8} />
          <text y={2} textAnchor="middle" fontSize={4.4} fontWeight={700} fill="#9c3f1d">
            +go
          </text>
        </g>
      </g>
      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
