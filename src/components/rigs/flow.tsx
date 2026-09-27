"use client";

import type { MutableRefObject } from "react";
import { at, Block, drawn, Part, rounded, topFace, type Point, type Tone } from "@/components/desk/iso";
import { along, light, Packet, place, TopTag } from "./kit";
import styles from "./Rigs.module.css";

/**
 * The machinery most project drawings share: parts standing in a scene, pipes
 * run between them, and packets carried along the pipes on a clock, lighting
 * each part as they reach it. A drawing lists its parts and its routes; this
 * draws them and moves them. What makes each project's drawing its own is
 * added around them.
 */

export type FlowNode = {
  key: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** the height it stands on */
  z?: number;
  h: number;
  tone: Tone;
  r?: number;
  tag?: string;
  tagSize?: number;
  /** when, between 0 and 1, it drops into place among the others */
  order?: number;
  /** a large part throws the cards' shadow; a small one a chip's */
  big?: boolean;
};

export type FlowRoute = { stops: string[]; colour: string; lit?: true | "warm"; at: number };

export const middleOf = (n: FlowNode): Point => at((n.x0 + n.x1) / 2, (n.y0 + n.y1) / 2, (n.z ?? 0) + n.h);

/** A pipe from one point to another, arching up over whatever is between. */
export const arc = ([ax, ay]: Point, [bx, by]: Point, lift = 26) => {
  const up = Math.max(lift, Math.abs(ay - by) * 0.3);
  return `M${ax.toFixed(1)} ${ay.toFixed(1)}C${ax.toFixed(1)} ${(ay - up).toFixed(1)} ${bx.toFixed(1)} ${(by - up).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
};

type Refs<T> = MutableRefObject<Record<string, T | null>>;

/** The parts, each dropped into place in its turn, with a glow for when it is lit and its name on top. */
export function FlowNodes({ nodes, refs }: { nodes: FlowNode[]; refs: Refs<SVGGElement> }) {
  return (
    <>
      {nodes.map((n) => {
        const from = 0.3 + (n.order ?? 0) * 0.4;
        const z = n.z ?? 0;
        return (
          <Part key={n.key} arrival={{ lift: 34, from, span: 0.1, fall: true }} style={drawn(from - 0.04, from + 0.02, 0.06)}>
            <g
              ref={(el) => {
                refs.current[n.key] = el;
              }}
            >
              <g filter={n.big ? "url(#desk-card)" : "url(#desk-chip)"}>
                <Block x0={n.x0} x1={n.x1} y0={n.y0} y1={n.y1} z={z} h={n.h} tone={n.tone} r={n.r ?? 6} width={n.big ? 1.4 : 1.2} />
              </g>
              <path d={rounded(topFace(n.x0 + 2, n.x1 - 2, n.y0 + 2, n.y1 - 2, z + n.h), Math.max(2, (n.r ?? 6) - 2))} className={styles.glow} />
              {n.tag && <TopTag origin={middleOf(n)} text={n.tag} size={n.tagSize ?? (n.tag.length > 7 ? 5.6 : 6.6)} />}
            </g>
          </Part>
        );
      })}
    </>
  );
}

/** Every pipe the routes need, drawn once each, as dotted arcs between the parts' tops. */
export function FlowPipes({ nodes, routes, refs }: { nodes: FlowNode[]; routes: FlowRoute[]; refs: Refs<SVGPathElement> }) {
  const byKey = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const pairs = [...new Set(routes.flatMap((r) => r.stops.slice(1).map((b, i) => `${r.stops[i]}>${b}`)))];
  return (
    <g className={styles.pipes}>
      {pairs.map((pair) => {
        const [a, b] = pair.split(">");
        return (
          <path
            key={pair}
            ref={(el) => {
              refs.current[pair] = el;
            }}
            d={arc(middleOf(byKey[a]), middleOf(byKey[b]))}
            fill="none"
            stroke="#9a9f98"
            strokeWidth={2}
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/** A packet for each route. */
export function FlowPackets({ routes, refs }: { routes: FlowRoute[]; refs: MutableRefObject<(SVGGElement | null)[]> }) {
  return (
    <>
      {routes.map((route, i) => (
        <Packet
          key={i}
          colour={route.colour}
          r={3.8}
          ref={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </>
  );
}

/**
 * Moves each route's packet along its pipes at `ms` into the clock, a `hop`
 * for each pipe, the whole round taking `cycle`; lights the part a packet has
 * just left or reached; and says which part each route has just reached, so a
 * drawing can make something happen there.
 */
export function runRoutes(
  ms: number,
  routes: FlowRoute[],
  { pipes, packets, nodes }: { pipes: Record<string, SVGPathElement | null>; packets: (SVGGElement | null)[]; nodes: Record<string, SVGGElement | null> },
  hop: number,
  cycle: number,
  extra: Record<string, boolean | "warm"> = {},
) {
  const lit: Record<string, boolean | "warm"> = { ...extra };
  const reached: (string | null)[] = [];
  routes.forEach((route, r) => {
    const t = (ms - route.at + cycle * 100) % cycle;
    const hops = route.stops.length - 1;
    const i = Math.floor(t / hop);
    const glow = route.lit ?? true;
    if (i < hops) {
      const [a, b] = [route.stops[i], route.stops[i + 1]];
      place(packets[r], along(pipes[`${a}>${b}`] ?? null, (t % hop) / hop));
      if (t % hop < 240) lit[a] = glow;
      reached[r] = null;
    } else {
      place(packets[r], [-999, -999]);
      if (t - hops * hop < 420) lit[route.stops[hops]] = glow;
      reached[r] = route.stops[hops];
    }
  });
  for (const key of Object.keys(nodes)) light(nodes[key], lit[key] ?? false);
  return reached;
}
