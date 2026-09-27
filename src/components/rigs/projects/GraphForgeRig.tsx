"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES } from "@/components/desk/iso";
import { light, useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * GraphForge, a data visualization platform that never leaves the browser.
 *
 * Everything happens inside the browser window: the spreadsheet comes in and
 * SheetJS reads it; the registry, a cabinet of five drawers, holds sixty-nine
 * chart types; one of three engines — D3, Recharts or Chart.js — draws the
 * chart on the stage; and the export docks hand out images and data. Outside
 * the window a server stands behind a barrier, because nothing is uploaded.
 * Round after round the chart turns from bars into a line into a pie.
 */

const ENGINES = ["d3", "recharts", "chartjs"];
const NODES: FlowNode[] = [
  { key: "xlsx", x0: -210, x1: -150, y0: -115, y1: -60, z: 6, h: 8, tone: TONES.paper, r: 4, tag: "xlsx", order: 0.05 },
  { key: "sheetjs", x0: -130, x1: -88, y0: -110, y1: -68, z: 6, h: 16, tone: TONES.sage, tag: "sheetjs", tagSize: 5, order: 0.15 },
  { key: "registry", x0: -210, x1: -150, y0: 0, y1: 70, z: 6, h: 50, tone: TONES.concrete, tag: "registry", tagSize: 5.2, order: 0.25, big: true },
  { key: "d3", x0: -115, x1: -85, y0: 40, y1: 70, z: 6, h: 14, tone: TONES.sienna, tag: "d3", order: 0.35 },
  { key: "recharts", x0: -75, x1: -45, y0: 40, y1: 70, z: 6, h: 14, tone: TONES.sage, tag: "recharts", tagSize: 3.8, order: 0.4 },
  { key: "chartjs", x0: -35, x1: -5, y0: 40, y1: 70, z: 6, h: 14, tone: TONES.concrete, tag: "chart.js", tagSize: 4, order: 0.45 },
  { key: "stage", x0: -10, x1: 140, y0: -46, y1: -40, z: 6, h: 104, tone: TONES.paper, r: 8, order: 0.5, big: true },
  { key: "png", x0: 40, x1: 80, y0: 72, y1: 108, z: 6, h: 12, tone: TONES.paper, tag: "png", order: 0.6 },
  { key: "csv", x0: 100, x1: 140, y0: 72, y1: 108, z: 6, h: 12, tone: TONES.paper, tag: "csv", order: 0.65 },
  { key: "barrier", x0: 180, x1: 192, y0: -80, y1: 40, z: 0, h: 26, tone: TONES.sienna, r: 4, order: 0.75 },
  { key: "server", x0: 210, x1: 252, y0: -50, y1: 0, z: 0, h: 70, tone: TONES.dark, r: 6, order: 0.8, big: true },
];
const ROUND = 6600;
const READ: FlowRoute = { stops: ["xlsx", "sheetjs", "registry"], colour: "#80966b", at: 0 };
// one engine draws each round, in turn
const DRAW: FlowRoute[] = ENGINES.map((engine) => ({ stops: ["registry", engine, "stage"], colour: "#d0714c", lit: "warm", at: 1500 }));
const EXPORT: FlowRoute[] = [
  { stops: ["stage", "png"], colour: "#7c817a", at: 3200 },
  { stops: ["stage", "csv"], colour: "#7c817a", at: 3900 },
];
const ROUTES = [READ, ...DRAW, ...EXPORT];
const HOP = 650;

export default function GraphForgeRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const charts = useRef<(SVGGElement | null)[]>([]);
  const drawers = useRef<(SVGRectElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    const kind = Math.floor(ms / ROUND) % 3;
    const t = ms % ROUND;
    runRoutes(ms, [READ, DRAW[kind], ...EXPORT], { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, ROUND, { barrier: "warm" });
    charts.current.forEach((chart, i) => light(chart, i === kind && t > 2700));
    drawers.current.forEach((drawer, i) => drawer?.setAttribute("fill", i === kind + 1 && t > 1400 && t < 3000 ? "#ecc9b9" : "#f4f4f0"));
  });

  return (
    <svg ref={svg} viewBox="50 204 582 350" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the browser window everything happens inside */}
      <Part arrival={{ lift: 30, from: 0.06, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-230} x1={165} y0={-140} y1={125} z={0} h={6} tone={TONES.paper} r={20} />
        </g>
        <g transform={onTop(at(-230, -140, 6))} className={styles.tag}>
          <rect x={10} y={8} width={375} height={12} rx={6} fill="#e3e5e0" />
          {["#d0714c", "#9a9f98", "#9caf88"].map((c, i) => (
            <circle key={c} cx={18 + i * 9} cy={14} r={2.6} fill={c} />
          ))}
        </g>
      </Part>
      <FlowNodes nodes={NODES} refs={nodes} />

      {/* the spreadsheet's grid, and the registry's drawers */}
      <g transform={onTop(at(-208, -113, 14))} className={styles.tag}>
        <path d="M4 12H54M4 22H54M4 32H54M4 42H54M18 4V50M34 4V50" stroke="#b8c8a8" strokeWidth={1} />
      </g>
      <g transform={onFront(at(-210, 70, 54))} className={styles.tag}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            ref={(el) => {
              drawers.current[i] = el;
            }}
            x={6}
            y={4 + i * 9}
            width={48}
            height={7}
            rx={2}
            fill="#f4f4f0"
            stroke="rgba(45,47,43,0.45)"
            strokeWidth={0.8}
          />
        ))}
      </g>

      {/* the stage, and the chart on it: bars, a line or a pie */}
      <g transform={onFront(at(-10, -40, 104))} className={styles.tag}>
        <text x={10} y={14} fontSize={6.4} fontWeight={700} fill="#2d2f2b">
          stage
        </text>
        <path d="M14 86H138M14 86V24" stroke="rgba(45,47,43,0.45)" strokeWidth={1} />
        {[
          <g key="bars">
            {[30, 48, 40, 64, 56, 74].map((hgt, i) => (
              <rect key={i} x={20 + i * 19} y={86 - hgt} width={12} height={hgt} rx={2} fill={i % 2 ? "#b8c8a8" : "#e2b5a1"} />
            ))}
          </g>,
          <g key="line">
            <polyline points="18,70 38,58 58,62 78,40 98,46 118,28 134,32" fill="none" stroke="#bc4e26" strokeWidth={2.4} strokeLinejoin="round" />
            {[18, 38, 58, 78, 98, 118, 134].map((x, i) => (
              <circle key={x} cx={x} cy={[70, 58, 62, 40, 46, 28, 32][i]} r={2.4} fill="#80966b" />
            ))}
          </g>,
          <g key="pie" transform="translate(76 56)">
            <circle r={26} fill="#e2e9da" />
            <path d="M0 0V-26A26 26 0 0 1 24.7 8Z" fill="#e2b5a1" />
            <path d="M0 0L24.7 8A26 26 0 0 1 -12 23Z" fill="#b8c8a8" />
            <circle r={26} fill="none" stroke="rgba(45,47,43,0.45)" />
          </g>,
        ].map((chart, i) => (
          <g
            key={i}
            ref={(el) => {
              charts.current[i] = el;
            }}
            className={styles.overlay}
          >
            {chart}
          </g>
        ))}
      </g>

      {/* nothing crosses to the server */}
      <g transform={onFront(at(180, 40, 22))} className={styles.tag}>
        <text x={2} y={6} fontSize={4.8} fontWeight={700} fill="#9c3f1d">
          no upload
        </text>
      </g>

      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={[READ, DRAW[0], ...EXPORT]} refs={packets} />}
    </svg>
  );
}
