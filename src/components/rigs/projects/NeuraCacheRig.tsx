"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES, type Point } from "@/components/desk/iso";
import { light, place, useBuild, useClock } from "../kit";
import { FlowNodes, FlowPackets, FlowPipes, runRoutes, type FlowNode, type FlowRoute } from "../flow";
import styles from "../Rigs.module.css";

/**
 * NeuraCache, an AI agent that remembers the people it talks to, as a board
 * with its conversation graph laid out on it.
 *
 * A message comes in from the chat, and the conversation's state is carried
 * round the graph: at recall the person's drawer slides out of the vault and
 * what it knows about them is loaded; at the prompt it is written into the
 * system prompt; Qwen answers; at remember what was new goes back into the
 * vault; and the reply appears in the chat, greeting them as someone it knows.
 */

const NODES: FlowNode[] = [
  { key: "chat", x0: -215, x1: -135, y0: 40, y1: 46, z: 8, h: 92, tone: TONES.paper, r: 8, order: 0.05, big: true },
  { key: "api", x0: -110, x1: -60, y0: -20, y1: 30, z: 8, h: 20, tone: TONES.sage, tag: "fastapi", order: 0.2 },
  { key: "recall", x0: -40, x1: 10, y0: -125, y1: -80, z: 8, h: 16, tone: TONES.paper, tag: "recall", order: 0.3 },
  { key: "prompt", x0: 45, x1: 95, y0: -125, y1: -80, z: 8, h: 16, tone: TONES.paper, tag: "prompt", order: 0.35 },
  { key: "qwen", x0: 120, x1: 190, y0: -40, y1: 30, z: 8, h: 30, tone: TONES.sienna, r: 26, tag: "qwen", order: 0.45, big: true },
  { key: "remember", x0: 30, x1: 85, y0: 70, y1: 115, z: 8, h: 16, tone: TONES.paper, tag: "remember", tagSize: 5, order: 0.5 },
  { key: "vault", x0: -110, x1: -50, y0: 80, y1: 140, z: 8, h: 40, tone: TONES.concrete, tag: "vault", order: 0.55, big: true },
];
const TURN = 6000;
const HOP = 560;
const ROUTES: FlowRoute[] = [
  { stops: ["chat", "api", "recall", "prompt", "qwen", "remember", "api", "chat"], colour: "#80966b", at: 0 },
  { stops: ["vault", "recall"], colour: "#7c817a", at: 2 * HOP },
  { stops: ["remember", "vault"], colour: "#d0714c", lit: "warm", at: 6 * HOP },
];
// along +y, the drawer comes out towards the viewer on the left
const drawerOut = (d: number): Point => [-d * Math.cos(Math.PI / 6), d / 2];

export default function NeuraCacheRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const drawer = useRef<SVGGElement>(null);
  const reply = useRef<SVGGElement>(null);
  const typing = useRef<SVGGElement>(null);

  useClock(built, svg, (ms) => {
    const t = ms % TURN;
    runRoutes(ms, ROUTES, { pipes: pipes.current, packets: packets.current, nodes: nodes.current }, HOP, TURN);
    // the person's drawer slides out while their memory is read, and in again
    const out = t > 2 * HOP - 200 && t < 4 * HOP ? 1 : 0;
    place(drawer.current, drawerOut(out * 16));
    // the reply appears once the state has come all the way round
    light(reply.current, t > 7 * HOP);
    light(typing.current, t > HOP && t <= 7 * HOP);
  });

  return (
    <svg ref={svg} viewBox="34 200 646 392" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the board, with faint traces across it */}
      <Part arrival={{ lift: 30, from: 0.06, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-225} x1={215} y0={-150} y1={150} z={0} h={8} tone={TONES.sage} r={20} />
        </g>
        <g transform={onTop(at(-225, -150, 8))} className={styles.tag}>
          <path d="M40 40H140V120H260M60 260H180V190H300M320 60V140H400M120 170H200" fill="none" stroke="#b8c8a8" strokeWidth={2} strokeLinecap="round" />
          {[
            [140, 40],
            [260, 120],
            [180, 190],
            [320, 140],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#9caf88" />
          ))}
        </g>
      </Part>
      <FlowNodes nodes={NODES} refs={nodes} />

      {/* the vault's drawers; the middle one is the person's */}
      <g transform={onFront(at(-110, 140, 46))} className={styles.tag}>
        {[4, 28].map((y) => (
          <rect key={y} x={6} y={y} width={48} height={10} rx={3} fill="#f4f4f0" stroke="rgba(45,47,43,0.45)" strokeWidth={0.8} />
        ))}
      </g>
      <g ref={drawer}>
        <g transform={onFront(at(-110, 140, 46))} className={styles.tag}>
          <rect x={6} y={16} width={48} height={10} rx={3} fill="#f5dfd5" stroke="rgba(45,47,43,0.55)" strokeWidth={0.9} />
          <text x={30} y={23.4} textAnchor="middle" fontSize={5.2} fontWeight={700} fill="#9c3f1d">
            sara
          </text>
        </g>
      </g>

      {/* the chat, standing at the front */}
      <g transform={onFront(at(-215, 46, 98))} className={styles.tag}>
        <text x={8} y={12} fontSize={5.6} fontWeight={700} fill="#7c817a">
          chat
        </text>
        <rect x={26} y={18} width={48} height={14} rx={6} fill="#f5dfd5" />
        <text x={70} y={27.6} textAnchor="end" fontSize={5.4} fontWeight={700} fill="#2d2f2b">
          hi, it&apos;s sara
        </text>
        <g ref={typing} className={styles.overlay}>
          <rect x={6} y={38} width={24} height={12} rx={6} fill="#e2e9da" />
          {[12, 18, 24].map((x) => (
            <circle key={x} cx={x} cy={44} r={1.6} fill="#80966b" />
          ))}
        </g>
        <g ref={reply} className={styles.overlay}>
          <rect x={6} y={38} width={66} height={30} rx={7} fill="#e2e9da" />
          <text x={11} y={48} fontSize={5.2} fontWeight={700} fill="#2d2f2b">
            welcome back,
          </text>
          <text x={11} y={57} fontSize={5.2} fontWeight={700} fill="#2d2f2b">
            Sara! still on
          </text>
          <text x={11} y={66} fontSize={5.2} fontWeight={700} fill="#4c5e3e">
            LangGraph?
          </text>
        </g>
      </g>

      <FlowPipes nodes={NODES} routes={ROUTES} refs={pipes} />
      {built && <FlowPackets routes={ROUTES} refs={packets} />}
    </svg>
  );
}
