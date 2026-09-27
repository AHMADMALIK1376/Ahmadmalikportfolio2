"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES, type Point } from "@/components/desk/iso";
import { light, place, useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * Routine Dashboard, a task manager, as a shelving unit with a shelf for each
 * group of tasks: today, this week, and done. A task is worked down from one
 * shelf to the next, each shelf's progress moving as it goes and every move
 * synced up to Firebase, which says so; finished tasks are ticked; and every
 * other round the switch slides over and the whole dashboard turns dark and
 * back, the choice written into localStorage.
 */

const SHELVES = [
  { name: "done", z: 12 },
  { name: "this week", z: 62 },
  { name: "today", z: 112 },
];
const UNIT = { x0: -120, x1: 120, y0: -40, y1: 40 };
const NODES: FlowNode[] = [
  { key: "sync", x0: -22, x1: 22, y0: -18, y1: 18, z: 166, h: 8, tone: TONES.sageDeep, r: 8, tag: "sync", order: 0.5 },
  { key: "firebase", x0: 175, x1: 215, y0: -40, y1: 0, z: 0, h: 118, tone: TONES.sienna, r: 8, tag: "firebase", tagSize: 4.8, order: 0.55, big: true },
  { key: "switch", x0: -230, x1: -190, y0: -40, y1: -10, z: 0, h: 12, tone: TONES.dark, r: 6, tag: "dark", order: 0.6 },
  { key: "storage", x0: -180, x1: -140, y0: -60, y1: -30, z: 0, h: 16, tone: TONES.concrete, tag: "storage", tagSize: 4.6, order: 0.65 },
  { key: "tokens", x0: -230, x1: -170, y0: 30, y1: 80, z: 0, h: 8, tone: TONES.paper, r: 4, tag: "design", tagSize: 5, order: 0.7 },
];
const ROUND = 5200;
const ROUTES: FlowRoute[] = [
  { stops: ["sync", "firebase"], colour: "#d0714c", lit: "warm", at: 1300 },
  { stops: ["sync", "firebase"], colour: "#d0714c", lit: "warm", at: 3300 },
  { stops: ["switch", "storage"], colour: "#7c817a", at: 4600 },
];
const HOP = 700;
// where the moving task sits on each shelf, from today down to done
const SLOT_X = 60;
const slot = (z: number): Point => at(SLOT_X, 0, z + 5);

export default function RoutineRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const task = useRef<SVGGElement>(null);
  const bars = useRef<(SVGRectElement | null)[]>([]);
  const unit = useRef<SVGGElement>(null);
  const knob = useRef<SVGCircleElement>(null);
  const theme = useRef<SVGTextElement>(null);
  const synced = useRef<SVGTextElement>(null);
  const finished = useRef<SVGGElement>(null);

  useClock(built, svg, (ms) => {
    const round = Math.floor(ms / ROUND);
    const t = ms % ROUND;
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, ROUND);
    // the task, worked down a shelf at a time: today, then this week, then done
    const [today, week, done] = [slot(SHELVES[2].z), slot(SHELVES[1].z), slot(SHELVES[0].z)];
    const home = slot(0);
    const move = (a: Point, b: Point, u: number): Point => {
      const e = u * u * (3 - 2 * u);
      return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
    };
    const p = t < 1000 ? today : t < 1600 ? move(today, week, (t - 1000) / 600) : t < 3000 ? week : t < 3600 ? move(week, done, (t - 3000) / 600) : done;
    place(task.current, [p[0] - home[0], p[1] - home[1]]);
    // each shelf's progress
    const progress = [t < 3600 ? 0.4 : 0.6, t < 1600 ? 0.5 : t < 3600 ? 0.75 : 0.5, t < 1600 ? 0.3 : 0.6];
    bars.current.forEach((bar, i) => bar?.setAttribute("width", (progress[i] * 60).toFixed(1)));
    // every other round, the dashboard goes dark
    light(unit.current, round % 2 === 1);
    const dark = round % 2 === 1;
    knob.current?.setAttribute("cx", dark ? "30" : "12");
    knob.current?.setAttribute("fill", dark ? "#d0714c" : "#f4f4f0");
    if (theme.current) theme.current.textContent = `theme=${dark ? "dark" : "light"}`;
    // Firebase says when it has caught up
    if (synced.current) synced.current.textContent = (t > 2000 && t < 3000) || t > 4000 ? "synced ✓" : "syncing…";
    light(finished.current, t >= 3600);
  });

  return (
    <svg ref={svg} viewBox="82 140 508 380" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      <g ref={unit} className={styles.night}>
        {/* the unit: its left side, its shelves with their tasks, its right side */}
        <Part arrival={{ lift: 40, from: 0.08, span: 0.14 }} style={drawn(0, 0.1)}>
          <g filter="url(#desk-card)">
            <Block x0={UNIT.x0 - 8} x1={UNIT.x0} y0={UNIT.y0} y1={UNIT.y1} z={0} h={166} tone={TONES.concrete} r={4} />
          </g>
        </Part>
        {SHELVES.map((shelf, i) => (
          <Part key={shelf.name} arrival={{ lift: 50, from: 0.16 + i * 0.07, span: 0.14 }} style={drawn(0.06 + i * 0.05, 0.14 + i * 0.05)}>
            <g filter="url(#desk-chip)">
              <Block x0={UNIT.x0} x1={UNIT.x1} y0={UNIT.y0} y1={UNIT.y1} z={shelf.z} h={5} tone={TONES.paper} r={4} width={1.2} />
              {/* the tasks that stay put on this shelf */}
              {[-100, -70, -40].slice(0, 3 - (i === 1 ? 1 : 0)).map((x, k) => (
                <Block key={x} x0={x} x1={x + 22} y0={-14} y1={8} z={shelf.z + 5} h={10} tone={[TONES.sage, TONES.sienna, TONES.concrete][(i + k) % 3]} r={3} width={1} />
              ))}
            </g>
            <g transform={onFront(at(UNIT.x0, UNIT.y1, shelf.z + 4))} className={styles.tag}>
              <text x={6} y={-3} fontSize={6.4} fontWeight={700} fill="#2d2f2b">
                {shelf.name}
              </text>
              <rect x={170} y={-8} width={60} height={4} rx={2} fill="#dcded8" />
              <rect
                ref={(el) => {
                  bars.current[i] = el;
                }}
                x={170}
                y={-8}
                width={30}
                height={4}
                rx={2}
                fill={i === 0 ? "#80966b" : "#d0714c"}
              />
            </g>
          </Part>
        ))}
        {/* ticks on the tasks already done */}
        <g className={styles.tag}>
          {[-100, -70, -40].map((x) => (
            <g key={x} transform={onTop(at(x + 4, -10, SHELVES[0].z + 15))}>
              <path d="M2 8L6 12L14 3" fill="none" stroke="#4c5e3e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        </g>
        {/* the task being worked */}
        {built && (
          <g ref={task}>
            <g filter="url(#desk-chip)">
              <Block x0={SLOT_X - 11} x1={SLOT_X + 11} y0={-11} y1={11} z={5} h={10} tone={TONES.sageDeep} r={3} width={1.1} />
            </g>
            <g ref={finished} className={styles.overlay}>
              <g transform={onTop(at(SLOT_X - 8, -8, 15))}>
                <path d="M2 8L6 12L14 3" fill="none" stroke="#f4f4f0" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
        )}
        <Part arrival={{ lift: 50, from: 0.37, span: 0.14 }} style={drawn(0.22, 0.3)}>
          <g filter="url(#desk-chip)">
            <Block x0={UNIT.x0} x1={UNIT.x1} y0={UNIT.y0} y1={UNIT.y1} z={162} h={4} tone={TONES.paper} r={4} width={1.2} />
          </g>
        </Part>
        <Part arrival={{ lift: 40, from: 0.08, span: 0.14 }} style={drawn(0, 0.1)}>
          <g filter="url(#desk-card)">
            <Block x0={UNIT.x1} x1={UNIT.x1 + 8} y0={UNIT.y0} y1={UNIT.y1} z={0} h={166} tone={TONES.concrete} r={4} />
          </g>
        </Part>
      </g>
      <FlowNodes nodes={NODES} refs={nodes} />
      {/* the dark mode switch, and what localStorage remembers of it */}
      <g transform={onTop(at(-228, -38, 12))} className={styles.tag}>
        <rect x={2} y={9} width={34} height={12} rx={6} fill="#3b3d39" />
        <circle ref={knob} cx={12} cy={15} r={4.6} fill="#f4f4f0" style={{ transition: "cx 0.4s ease, fill 0.4s ease" }} />
      </g>
      <g transform={onFront(at(-180, -30, 10))} className={styles.tag}>
        <text ref={theme} x={2} y={0} fontSize={4.6} fontWeight={700} fill="#2d2f2b">
          theme=light
        </text>
      </g>
      <g transform={onFront(at(175, 0, 30))} className={styles.tag}>
        <text ref={synced} x={4} y={0} fontSize={5} fontWeight={700} fill="#9c3f1d">
          synced ✓
        </text>
      </g>
      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
