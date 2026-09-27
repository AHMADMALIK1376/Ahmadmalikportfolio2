"use client";

import { useRef } from "react";
import { at, Block, drawn, onTop, Part, TONES } from "@/components/desk/iso";
import { useBuild, useClock, TopTag } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * Folium, a collaborative document editor: two people write the same page at
 * once. Their edits travel from their laptops into the y-sweet sync layer, on
 * through the FastAPI backend and into Postgres; each round a version is saved
 * onto the history, and a deleted document comes back out of the trash. On the
 * page, the lines grow in each writer's colour.
 */

const NODES: FlowNode[] = [
  { key: "doc", x0: -80, x1: 40, y0: -110, y1: -30, z: 8, h: 5, tone: TONES.paper, r: 8, order: 0, big: true },
  { key: "screenA", x0: -190, x1: -130, y0: 44, y1: 50, z: 13, h: 34, tone: TONES.dark, r: 3, order: 0.1 },
  { key: "lapA", x0: -190, x1: -130, y0: 50, y1: 100, z: 8, h: 5, tone: TONES.concrete, r: 5, tag: "you", order: 0.1 },
  { key: "screenB", x0: 100, x1: 160, y0: 54, y1: 60, z: 13, h: 34, tone: TONES.dark, r: 3, order: 0.15 },
  { key: "lapB", x0: 100, x1: 160, y0: 60, y1: 110, z: 8, h: 5, tone: TONES.concrete, r: 5, tag: "team", order: 0.15 },
  { key: "sync", x0: -40, x1: 20, y0: 0, y1: 50, z: 8, h: 16, tone: TONES.sageDeep, r: 22, tag: "y-sweet", order: 0.25 },
  { key: "api", x0: 70, x1: 130, y0: -40, y1: 10, z: 8, h: 22, tone: TONES.sage, tag: "fastapi", order: 0.35 },
  { key: "db", x0: 120, x1: 180, y0: -115, y1: -60, z: 8, h: 34, tone: TONES.paper, r: 24, tag: "postgres", order: 0.5, big: true },
  { key: "versions", x0: -180, x1: -130, y0: -105, y1: -60, z: 8, h: 12, tone: TONES.paper, r: 4, tag: "versions", order: 0.6 },
  { key: "trash", x0: -110, x1: -80, y0: -10, y1: 20, z: 8, h: 16, tone: TONES.concrete, tag: "trash", order: 0.7 },
];
const ROUTES: FlowRoute[] = [
  { stops: ["lapA", "sync", "api", "db"], colour: "#80966b", at: 0 },
  { stops: ["lapB", "sync", "api", "db"], colour: "#d0714c", lit: "warm", at: 1500 },
  { stops: ["db", "versions"], colour: "#7c817a", at: 2900 },
  { stops: ["trash", "db"], colour: "#7c817a", at: 3600 },
];
const CYCLE = 4400;
const HOP = 620;
// the page's lines, each the width it grows to, and who writes it
const LINES = [96, 70, 88, 52, 92, 64].map((width, k) => ({ width, colour: k % 2 ? "#e2b5a1" : "#b8c8a8", caret: k % 2 ? "#d0714c" : "#80966b" }));
const WRITE = 8800;

export default function FoliumRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const lines = useRef<(SVGRectElement | null)[]>([]);
  const carets = useRef<(SVGRectElement | null)[]>([]);
  const version = useRef<SVGTextElement>(null);

  useClock(built, svg, (ms) => {
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, CYCLE);
    // the page being written: a line at a time, in turn, by each writer
    const t = ms % WRITE;
    LINES.forEach((line, k) => {
      const u = Math.min(1, Math.max(0, (t - k * 1200) / 1000));
      lines.current[k]?.setAttribute("width", (line.width * u).toFixed(1));
      const typing = u > 0 && u < 1;
      carets.current[k]?.setAttribute("x", (8 + line.width * u).toFixed(1));
      carets.current[k]?.setAttribute("opacity", typing ? "1" : "0");
    });
    if (version.current) version.current.textContent = `v${12 + Math.floor((ms + CYCLE - 2900 - 3 * HOP) / CYCLE)}`;
  });

  return (
    <svg ref={svg} viewBox="76 226 568 344" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      <Part arrival={{ lift: 30, from: 0.08, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-200} x1={200} y0={-125} y1={125} z={0} h={8} tone={TONES.concrete} r={20} />
        </g>
      </Part>
      <FlowNodes nodes={NODES} refs={nodes} />
      {/* the page, and the lines being written on it */}
      <g transform={onTop(at(-80, -110, 13))} className={styles.tag}>
        <rect x={8} y={6} width={50} height={6} rx={3} fill="#5e625c" />
        {LINES.map((line, k) => (
          <g key={k}>
            <rect
              ref={(el) => {
                lines.current[k] = el;
              }}
              x={8}
              y={18 + k * 9}
              width={line.width}
              height={4.5}
              rx={2}
              fill={line.colour}
            />
            <rect
              ref={(el) => {
                carets.current[k] = el;
              }}
              x={8 + line.width}
              y={16.5 + k * 9}
              width={1.6}
              height={7.5}
              fill={line.caret}
              opacity={0}
            />
          </g>
        ))}
      </g>
      <TopTag origin={at(20, -44, 13)} text="editor" size={5.6} />
      <g transform={onTop(at(-176, -100, 20))} className={styles.tag}>
        <text ref={version} x={32} y={34} fontSize={6.4} fontWeight={700} fill="#9c3f1d">
          v12
        </text>
      </g>
      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
