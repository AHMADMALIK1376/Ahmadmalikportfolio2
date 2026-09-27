"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES, type Point } from "@/components/desk/iso";
import { light, place, useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * The Bid & Proposal Response Engine, as a production line.
 *
 * A belt runs through five machines: the intake that takes a tender as a PDF
 * or DOCX; Claude, which pulls out its requirements, criteria and deadlines;
 * the matcher, which scores each requirement against the capability library
 * behind it and marks it pass, gap or fail; the dashboard, whose gauge swings
 * between NO-GO and GO; and the drafter, which writes the proposal and hands
 * it out as a Word document. A tender rides the belt through each in turn:
 * the intake takes its PDF or DOCX, Claude lists the requirements as it reads
 * them, the library's scores rise as the matcher compares, a stopwatch counts
 * the seconds, and the draft is out inside a minute.
 */

const FRONT = 60;
const NODES: FlowNode[] = [
  { key: "library", x0: -40, x1: 20, y0: -75, y1: -25, z: 0, h: 50, tone: TONES.concrete, r: 6, tag: "library", order: 0.35, big: true },
  { key: "intake", x0: -210, x1: -160, y0: 0, y1: FRONT, z: 8, h: 30, tone: TONES.paper, tag: "intake", order: 0.1 },
  { key: "claude", x0: -130, x1: -70, y0: 0, y1: FRONT, z: 8, h: 40, tone: TONES.sienna, tag: "claude", order: 0.2 },
  { key: "matcher", x0: -40, x1: 20, y0: 0, y1: FRONT, z: 8, h: 36, tone: TONES.sage, tag: "matcher", order: 0.3 },
  { key: "dash", x0: 50, x1: 110, y0: 0, y1: FRONT, z: 8, h: 46, tone: TONES.paper, tag: "go / no-go", tagSize: 5.2, order: 0.45 },
  { key: "drafter", x0: 140, x1: 200, y0: 0, y1: FRONT, z: 8, h: 34, tone: TONES.sageDeep, tag: "drafter", order: 0.55 },
];
const ROUTES: FlowRoute[] = [{ stops: ["library", "matcher"], colour: "#7c817a", at: 2300 }];
const LINE = 6400;
const STATIONS: [string, number][] = [
  ["intake", -185],
  ["claude", -100],
  ["matcher", -10],
  ["dash", 80],
  ["drafter", 170],
];
const beltAt = (x: number): Point => {
  const [ax, ay] = at(x, 30, 8);
  const [ox, oy] = at(0, 30, 8);
  return [ax - ox, ay - oy];
};

export default function BidRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const tender = useRef<SVGGElement>(null);
  const needle = useRef<SVGGElement>(null);
  const odds = useRef<SVGTextElement>(null);
  const checks = useRef<(SVGGElement | null)[]>([]);
  const docx = useRef<SVGGElement>(null);
  const requirements = useRef<(SVGRectElement | null)[]>([]);
  const scores = useRef<(SVGRectElement | null)[]>([]);
  const clock = useRef<SVGTextElement>(null);

  useClock(built, svg, (ms) => {
    const t = ms % LINE;
    const x = -250 + (t / LINE) * 520;
    place(tender.current, beltAt(x));
    const lit: Record<string, boolean | "warm"> = {};
    for (const [key, cx] of STATIONS) if (Math.abs(x - cx) < 28) lit[key] = key === "claude" ? "warm" : true;
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, 700, LINE, lit);
    // the matcher marks each requirement in turn while the tender is inside it
    checks.current.forEach((check, i) => light(check, x > -38 + i * 12 && x < 60));
    // the gauge swings as the tender reaches the dashboard, and settles on GO
    const since = x - 55;
    const angle = since < 0 ? -80 : 45 + Math.cos(since / 6) * 60 * Math.exp(-since / 30);
    needle.current?.setAttribute("transform", `rotate(${angle.toFixed(1)} 30 34)`);
    if (odds.current) odds.current.textContent = since < 0 ? "—" : `${Math.min(72, Math.round(since * 1.6))}%`;
    light(docx.current, x > 205);
    // Claude lists the requirements as it reads the tender
    requirements.current.forEach((line, i) => {
      const u = Math.max(0, Math.min(1, (x + 130 - i * 12) / 30));
      line?.setAttribute("width", (u * [34, 26, 30, 22][i]).toFixed(1));
    });
    // the library's scores rise while the matcher compares
    scores.current.forEach((bar, i) => {
      const u = Math.max(0, Math.min(1, (x + 40 - i * 10) / 40));
      bar?.setAttribute("width", (u * [30, 44, 18, 36][i]).toFixed(1));
    });
    // the seconds since the tender went in, stopping when the draft is out
    const seconds = Math.min(52, Math.max(0, Math.round(((x + 210) / 420) * 52)));
    if (clock.current) clock.current.textContent = `0:${String(seconds).padStart(2, "0")} / 60s`;
  });

  return (
    <svg ref={svg} viewBox="104 244 494 330" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      <Part arrival={{ lift: 30, from: 0.08, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-235} x1={275} y0={10} y1={50} z={0} h={8} tone={TONES.dark} r={12} />
        </g>
      </Part>
      {/* the tender, riding the belt; the machines are drawn over it as it passes through them */}
      <g ref={tender} transform="translate(-999 -999)">
        <g filter="url(#desk-chip)">
          <Block x0={-12} x1={12} y0={20} y1={40} z={8} h={3} tone={TONES.paper} r={2} width={1} />
        </g>
      </g>
      {/* rollers along the belt, and the belt itself moving */}
      <g className={styles.tag}>
        {Array.from({ length: 16 }, (_, i) => {
          const [cx, cy] = at(-220 + i * 32, 50, 4);
          return <circle key={i} cx={cx} cy={cy} r={2.4} fill="#7c817a" stroke="rgba(45,47,43,0.5)" strokeWidth={0.6} />;
        })}
        <path d={`M${at(-228, 30, 8).join(" ")}L${at(268, 30, 8).join(" ")}`} stroke="#9a9f98" strokeWidth={1.4} className={styles.flow} />
      </g>
      <FlowNodes nodes={NODES} refs={nodes} />
      {/* what goes in at the intake */}
      <g transform={onFront(at(-210, FRONT, 34))} className={styles.tag}>
        <rect x={4} y={4} width={18} height={9} rx={2} fill="#f5dfd5" stroke="rgba(45,47,43,0.4)" strokeWidth={0.6} />
        <text x={13} y={10.4} textAnchor="middle" fontSize={4.6} fontWeight={700} fill="#9c3f1d">
          PDF
        </text>
        <rect x={25} y={4} width={22} height={9} rx={2} fill="#e2e9da" stroke="rgba(45,47,43,0.4)" strokeWidth={0.6} />
        <text x={36} y={10.4} textAnchor="middle" fontSize={4.6} fontWeight={700} fill="#4c5e3e">
          DOCX
        </text>
      </g>
      {/* the requirements Claude has read, a line at a time */}
      <g transform={onFront(at(-130, FRONT, 44))} className={styles.tag}>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            ref={(el) => {
              requirements.current[i] = el;
            }}
            x={8}
            y={4 + i * 6}
            width={0}
            height={3}
            rx={1.5}
            fill={i === 3 ? "#bc4e26" : "#9c3f1d"}
            opacity={0.7}
          />
        ))}
        <text x={8} y={32} fontSize={4.4} fontWeight={700} fill="#9c3f1d">
          due 14 oct
        </text>
      </g>
      {/* the capability library's scores */}
      <g transform={onTop(at(-38, -73, 50))} className={styles.tag}>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            ref={(el) => {
              scores.current[i] = el;
            }}
            x={4}
            y={2 + i * 5}
            width={0}
            height={3.5}
            rx={1.5}
            fill={i === 2 ? "#e2b5a1" : "#9caf88"}
          />
        ))}
      </g>
      {/* the stopwatch, on the drafter */}
      <g transform={onFront(at(140, FRONT, 38))} className={styles.tag}>
        <text ref={clock} x={30} y={10} textAnchor="middle" fontSize={5.4} fontWeight={700} fill="#2d2f2b">
          0:00 / 60s
        </text>
      </g>

      {/* the matcher's marks, and the dashboard's gauge, on their fronts */}
      <g transform={onFront(at(-40, FRONT, 38))} className={styles.tag}>
        {["PASS", "GAP", "FAIL"].map((mark, i) => (
          <g
            key={mark}
            ref={(el) => {
              checks.current[i] = el;
            }}
          >
            <rect x={4} y={2 + i * 10} width={36} height={8} rx={4} fill="#e6e8e3" />
            <rect x={4} y={2 + i * 10} width={36} height={8} rx={4} fill={i === 0 ? "#b8c8a8" : i === 1 ? "#ecc9b9" : "#e2b5a1"} className={styles.glow} />
            <text x={22} y={8.4 + i * 10} textAnchor="middle" fontSize={5.4} fontWeight={700} fill="#2d2f2b">
              {mark}
            </text>
          </g>
        ))}
      </g>
      <g transform={onFront(at(50, FRONT, 50))} className={styles.tag}>
        <path d="M10 34A20 20 0 0 1 50 34" fill="none" stroke="#b8bcb5" strokeWidth={5} strokeLinecap="round" />
        <path d="M34 14.4A20 20 0 0 1 50 34" fill="none" stroke="#9caf88" strokeWidth={5} strokeLinecap="round" />
        <g ref={needle} transform="rotate(-80 30 34)">
          <path d="M30 34V17" stroke="#bc4e26" strokeWidth={2} strokeLinecap="round" />
        </g>
        <circle cx={30} cy={34} r={2.4} fill="#2d2f2b" />
        <text x={6} y={44} fontSize={4.6} fontWeight={700} fill="#7c817a">
          NO
        </text>
        <text x={46} y={44} fontSize={4.6} fontWeight={700} fill="#4c5e3e">
          GO
        </text>
        <text ref={odds} x={30} y={46} textAnchor="middle" fontSize={6} fontWeight={700} fill="#9c3f1d">
          —
        </text>
      </g>

      {/* the proposal, out of the end of the line */}
      <g ref={docx} className={styles.overlay}>
        <g filter="url(#desk-chip)">
          <Block x0={225} x1={262} y0={16} y1={44} z={8} h={4} tone={TONES.sage} r={3} width={1} />
        </g>
        <text transform={`translate(${at(243, 30, 14).join(" ")})`} textAnchor="middle" fontSize={6} fontWeight={700} fill="#2d2f2b">
          .docx
        </text>
      </g>

      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
