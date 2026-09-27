"use client";

import { useRef } from "react";
import { at, Block, drawn, frontFace, onFront, Part, rounded, topFace, TONES, type Point, type Tone } from "@/components/desk/iso";
import { along, FrontTag, light, Packet, place, TopTag, useBuild, useClock } from "./kit";
import styles from "./Rigs.module.css";

/**
 * A system drawn as a staircase of four floors.
 *
 * Data on the lowest step, the services on the next, the gateway above them
 * and the clients at the top, each floor a step higher and further to the
 * left. The steps are drawn from the bottom up, the parts are set down on
 * them, and pipes are run from each step to the one below. Then traffic flows
 * down the stairs on its own clock: reads from the browser through the gateway
 * and the orders service to the cache, writes from the phone through the users
 * service to the database, static files from the terminal to the CDN, and
 * events from orders along the bus to the queue. Whatever a packet reaches
 * lights up; the gateway shows its rate, the cache its hits, the database
 * counts its rows as the writes land, and the queue fills and drains.
 */

const STEP = { dx: -150, dz: 46, x: 70, y: 58, slab: 10 };
const floor = (i: number) => ({ dx: i * STEP.dx, z: i * STEP.dz + STEP.slab });
const FLOORS = ["data", "services", "gateway", "clients"];

type Node = { key: string; x0: number; x1: number; y0: number; y1: number; floor: number; h: number; tone: Tone; r: number; tag?: string };

// everything standing on the stairs, the higher floors first so the lower ones are drawn over them
const NODES: Node[] = [
  { key: "browser", x0: -510, x1: -466, y0: -8, y1: 0, floor: 3, h: 38, tone: TONES.paper, r: 4 },
  { key: "phone", x0: -452, x1: -436, y0: -6, y1: 0, floor: 3, h: 30, tone: TONES.dark, r: 3 },
  { key: "terminal", x0: -420, x1: -384, y0: -30, y1: 8, floor: 3, h: 10, tone: TONES.dark, r: 4, tag: ">_" },
  { key: "gateway", x0: -338, x1: -262, y0: -28, y1: 24, floor: 2, h: 30, tone: TONES.sageDeep, r: 9, tag: "gateway" },
  { key: "orders", x0: -212, x1: -174, y0: -40, y1: -8, floor: 1, h: 28, tone: TONES.sage, r: 6, tag: "orders" },
  { key: "users", x0: -160, x1: -122, y0: -40, y1: -8, floor: 1, h: 28, tone: TONES.sage, r: 6, tag: "users" },
  { key: "cdn", x0: -112, x1: -86, y0: -40, y1: -8, floor: 1, h: 22, tone: TONES.concrete, r: 5, tag: "cdn" },
  { key: "bus", x0: -214, x1: -96, y0: 18, y1: 32, floor: 1, h: 7, tone: TONES.dark, r: 3 },
  { key: "db", x0: -52, x1: -10, y0: -34, y1: 8, floor: 0, h: 36, tone: TONES.paper, r: 18, tag: "db" },
  { key: "cache", x0: 12, x1: 50, y0: -34, y1: -4, floor: 0, h: 20, tone: TONES.sienna, r: 6, tag: "cache" },
  { key: "queue", x0: 12, x1: 50, y0: 14, y1: 40, floor: 0, h: 12, tone: TONES.concrete, r: 5, tag: "queue" },
];
const BY_KEY = Object.fromEntries(NODES.map((n) => [n.key, n])) as Record<string, Node>;
const topOf = (key: string): Point => {
  const n = BY_KEY[key];
  return at((n.x0 + n.x1) / 2, (n.y0 + n.y1) / 2, floor(n.floor).z + n.h);
};

// the pipes, each from a part down to one on the floor below, arching over the gap
const PIPES: [string, string][] = [
  ["browser", "gateway"],
  ["phone", "gateway"],
  ["terminal", "gateway"],
  ["gateway", "orders"],
  ["gateway", "users"],
  ["gateway", "cdn"],
  ["orders", "bus"],
  ["orders", "cache"],
  ["users", "db"],
  ["bus", "queue"],
];
const pipeKey = (a: string, b: string) => `${a}>${b}`;
const pipePath = (a: string, b: string) => {
  const [ax, ay] = topOf(a);
  const [bx, by] = topOf(b);
  const lift = Math.max(24, Math.abs(ay - by) * 0.35);
  return `M${ax.toFixed(1)} ${ay.toFixed(1)}C${ax.toFixed(1)} ${(ay - lift).toFixed(1)} ${bx.toFixed(1)} ${(by - lift).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
};

// the journeys the packets make, how long each takes, and where in the cycle each starts
const ROUTES = [
  { stops: ["browser", "gateway", "orders", "cache"], colour: "#80966b", lit: true as const, at: 0 },
  { stops: ["phone", "gateway", "users", "db"], colour: "#d0714c", lit: "warm" as const, at: 1200 },
  { stops: ["orders", "bus", "queue"], colour: "#7c817a", lit: true as const, at: 2300 },
  { stops: ["terminal", "gateway", "cdn"], colour: "#9a9f98", lit: true as const, at: 2900 },
];
const HOP = 700;
const CYCLE = 3600;

export default function ArchRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const nodes = useRef<Record<string, SVGGElement | null>>({});
  const pipes = useRef<Record<string, SVGPathElement | null>>({});
  const packets = useRef<(SVGGElement | null)[]>([]);
  const rate = useRef<SVGTextElement>(null);
  const rows = useRef<SVGTextElement>(null);
  const hits = useRef<SVGTextElement>(null);
  const queued = useRef<(SVGRectElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    // what the parts report: the gateway's rate, the rows written, the cache's hits and the queue's depth
    const round = Math.floor(ms / CYCLE);
    const writes = Math.max(0, Math.floor((ms - 1200 - 3 * HOP) / CYCLE) + 1);
    if (rate.current) rate.current.textContent = `${(1.3 + 0.2 * Math.sin(ms / 900)).toFixed(1)}k req/s`;
    if (rows.current) rows.current.textContent = `${(12408 + writes * 3).toLocaleString("en-US")} rows`;
    if (hits.current) hits.current.textContent = `hit ${91 + (round % 6)}%`;
    // an event lands in the queue a little into each round (its route ends just past the cycle's turn)
    const depth = 1 + ((round + (ms % CYCLE > 100 ? 1 : 0)) % 4);
    queued.current.forEach((bar, i) => bar?.setAttribute("fill", i < depth ? "#9caf88" : "#e3e5e0"));

    const lit: Record<string, boolean | "warm"> = {};
    ROUTES.forEach((route, r) => {
      const t = (ms - route.at + CYCLE * 10) % CYCLE;
      const hops = route.stops.length - 1;
      const hop = Math.floor(t / HOP);
      if (hop < hops) {
        const [a, b] = [route.stops[hop], route.stops[hop + 1]];
        place(packets.current[r], along(pipes.current[pipeKey(a, b)], (t % HOP) / HOP));
        if (t % HOP < 260) lit[a] = route.lit;
      } else {
        place(packets.current[r], [-999, -999]);
        if (t - hops * HOP < 420) lit[route.stops[hops]] = route.lit;
      }
    });
    for (const key of Object.keys(nodes.current)) light(nodes.current[key], lit[key] ?? false);
  });

  return (
    <svg ref={svg} viewBox="-148 -56 626 532" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the steps, from the top floor down so the lower ones stand in front */}
      {[3, 2, 1, 0].map((i) => {
        const { dx, z } = floor(i);
        return (
          <Part key={i} arrival={{ lift: 40, from: 0.1 + (3 - i) * 0.07, span: 0.14 }} style={drawn(0.02 + (3 - i) * 0.07, 0.1 + (3 - i) * 0.07)}>
            <g filter="url(#desk-card)">
              <Block x0={dx - STEP.x} x1={dx + STEP.x} y0={-STEP.y} y1={STEP.y} z={0} h={z} tone={i % 2 ? TONES.concrete : TONES.paper} r={12} />
            </g>
            <FrontTag origin={at(dx - STEP.x + 10, STEP.y, z - 9)} text={FLOORS[i]} size={8} fill="#5e625c" />
            {/* everything that stands on this floor */}
            {NODES.filter((n) => n.floor === i).map((n, k) => (
              <Part key={n.key} arrival={{ lift: 36, from: 0.4 + (3 - i) * 0.06 + k * 0.03, span: 0.1, fall: true }} style={drawn(0.36 + (3 - i) * 0.06 + k * 0.03, 0.42 + (3 - i) * 0.06 + k * 0.03, 0.06)}>
                <g
                  ref={(el) => {
                    nodes.current[n.key] = el;
                  }}
                >
                  <g filter="url(#desk-chip)">
                    <Block x0={n.x0} x1={n.x1} y0={n.y0} y1={n.y1} z={z} h={n.h} tone={n.tone} r={n.r} width={1.2} />
                  </g>
                  <path d={rounded(topFace(n.x0 + 2, n.x1 - 2, n.y0 + 2, n.y1 - 2, z + n.h), Math.max(2, n.r - 2))} className={styles.glow} />
                  {n.key === "browser" && (
                    <>
                      <path d={rounded([at(n.x0 + 4, n.y1, z + n.h - 4), at(n.x1 - 4, n.y1, z + n.h - 4), at(n.x1 - 4, n.y1, z + 8), at(n.x0 + 4, n.y1, z + 8)], 3)} fill="#333532" />
                      <g transform={onFront(at(n.x0 + 6, n.y1, z + n.h - 6))} className={styles.tag}>
                        <rect x={2} y={2} width={22} height={3} rx={1.5} fill="#b1c29f" />
                        <rect x={2} y={8} width={30} height={2} rx={1} fill="#7c817a" />
                        <rect x={2} y={13} width={26} height={2} rx={1} fill="#7c817a" />
                        <rect x={2} y={18} width={12} height={5} rx={2} fill="#e0916f" />
                      </g>
                    </>
                  )}
                  {n.key === "phone" && <path d={rounded(frontFace(n.x0 + 2.5, n.x1 - 2.5, z + 5, z + n.h - 4, n.y1), 2)} fill="#cbd7bd" />}
                  {n.key === "gateway" && (
                    <g transform={onFront(at(n.x0 + 6, n.y1, z + n.h - 6))} className={styles.tag}>
                      <path d="M6 1.5L11 3.5V8C11 11 8.8 13 6 14C3.2 13 1 11 1 8V3.5Z" fill="#f4f4f0" stroke="#4c5e3e" strokeWidth={1} />
                      <text x={16} y={7} fontSize={5.4} fontWeight={700} fill="#2d2f2b">
                        auth · rate limit
                      </text>
                      <text ref={rate} x={16} y={15} fontSize={5.4} fontWeight={700} fill="#4c5e3e">
                        1.3k req/s
                      </text>
                    </g>
                  )}
                  {n.key === "db" && (
                    <g transform={onFront(at(n.x0 + 4, n.y1, z + 14))} className={styles.tag}>
                      <text ref={rows} x={2} y={0} fontSize={5} fontWeight={700} fill="#9c3f1d">
                        12,408 rows
                      </text>
                    </g>
                  )}
                  {n.key === "cache" && (
                    <g transform={onFront(at(n.x0 + 3, n.y1, z + 9))} className={styles.tag}>
                      <text ref={hits} x={2} y={0} fontSize={5} fontWeight={700} fill="#9c3f1d">
                        hit 94%
                      </text>
                    </g>
                  )}
                  {n.key === "queue" && (
                    <g transform={onFront(at(n.x0 + 4, n.y1, z + n.h - 3))} className={styles.tag}>
                      {[0, 1, 2, 3].map((q) => (
                        <rect
                          key={q}
                          ref={(el) => {
                            queued.current[q] = el;
                          }}
                          x={q * 7.5}
                          y={0}
                          width={5.5}
                          height={5}
                          rx={1.2}
                          fill="#e3e5e0"
                          stroke="rgba(45,47,43,0.4)"
                          strokeWidth={0.6}
                        />
                      ))}
                    </g>
                  )}
                  {n.key === "bus" && <path d={`M${at(n.x0 + 6, 25, z + n.h).join(" ")}L${at(n.x1 - 6, 25, z + n.h).join(" ")}`} stroke="#b1c29f" strokeWidth={1.6} strokeLinecap="round" className={styles.flow} />}
                  {n.tag && <TopTag origin={at((n.x0 + n.x1) / 2, (n.y0 + n.y1) / 2, z + n.h)} text={n.tag} size={n.tag.length > 5 ? 6.2 : 7} />}
                </g>
              </Part>
            ))}
          </Part>
        );
      })}

      {/* the pipes between the floors, run once everything is standing */}
      <g className={styles.pipes}>
        {PIPES.map(([a, b]) => (
          <path
            key={pipeKey(a, b)}
            ref={(el) => {
              pipes.current[pipeKey(a, b)] = el;
            }}
            d={pipePath(a, b)}
            fill="none"
            stroke="#9a9f98"
            strokeWidth={2}
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
        ))}
      </g>
      <g transform={onFront(at(-212, 32, floor(1).z + 7))} className={styles.tag}>
        <text x={4} y={2} fontSize={6} fontWeight={700} fill="#e6e8e3">
          event bus
        </text>
      </g>

      {built &&
        ROUTES.map((route, r) => (
          <Packet
            key={r}
            colour={route.colour}
            r={4}
            ref={(el) => {
              packets.current[r] = el;
            }}
          />
        ))}
    </svg>
  );
}
