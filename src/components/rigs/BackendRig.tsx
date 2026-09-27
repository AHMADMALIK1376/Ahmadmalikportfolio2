"use client";

import { useRef } from "react";
import { at, Block, drawn, frontFace, onFront, Part, rounded, TONES, type Point, type Tone } from "@/components/desk/iso";
import { along, FrontTag, light, Packet, place, useBuild, useClock } from "./kit";
import styles from "./Rigs.module.css";

/**
 * A backend, racked up and serving.
 *
 * A cabinet is drawn, and its units slide home into it one after another: the
 * database at the bottom, then the cache, the workers, two API servers and the
 * load balancer on top. The clients' cable and a health dashboard are drawn
 * beside it. Then it serves on its own clock: requests come up the cable into
 * the load balancer and down through an API server to the cache — or on to the
 * database when the cache misses — and the answer goes back the way it came,
 * each unit lighting as it is used. The workers' fans turn, and the dashboard
 * counts it all.
 */

const RACK = { x0: -60, x1: 60, y0: -45, y1: 45, h: 232 };
const FRONT = 52;
type Unit = { key: string; name: string; z: number; h: number; tone: Tone };
const UNITS: Unit[] = [
  { key: "db", name: "postgres", z: 8, h: 48, tone: TONES.sage },
  { key: "cache", name: "cache", z: 64, h: 24, tone: TONES.sienna },
  { key: "workers", name: "workers", z: 96, h: 30, tone: TONES.concrete },
  { key: "api2", name: "api-2", z: 134, h: 24, tone: TONES.paper },
  { key: "api1", name: "api-1", z: 166, h: 24, tone: TONES.paper },
  { key: "lb", name: "load balancer", z: 198, h: 24, tone: TONES.sageDeep },
];
const middle = (key: string) => {
  const u = UNITS.find((unit) => unit.key === key)!;
  return u.z + u.h / 2;
};
// the rail down the rack's left edge that requests travel along
const RAIL_X = -57;
const railAt = (z: number) => at(RAIL_X, FRONT - 2, z);
const CABLE = (() => {
  const s = at(-250, 150, 0);
  const e = at(RAIL_X, FRONT - 2, middle("lb"));
  return `M${s[0].toFixed(1)} ${s[1].toFixed(1)}C${(s[0] + 70).toFixed(1)} ${(s[1] - 10).toFixed(1)} ${(e[0] - 90).toFixed(1)} ${(e[1] + 30).toFixed(1)} ${e[0].toFixed(1)} ${e[1].toFixed(1)}`;
})();
const REQUEST = 1800;

export default function BackendRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const units = useRef<Record<string, SVGGElement | null>>({});
  const cable = useRef<SVGPathElement>(null);
  const packet = useRef<SVGGElement | null>(null);
  const readouts = useRef<(SVGTextElement | null)[]>([]);
  const bars = useRef<(SVGRectElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    const n = Math.floor(ms / REQUEST);
    const t = (ms % REQUEST) / REQUEST;
    // every third request misses the cache and goes on to the database
    const miss = n % 3 === 2;
    const api = n % 2 ? "api2" : "api1";
    const deepest = miss ? "db" : "cache";
    const lit: Record<string, boolean | "warm"> = { workers: true };
    let point: Point;
    if (t < 0.25) point = along(cable.current, t / 0.25);
    else if (t < 0.6) {
      // down the rail: to the API, then to the cache, then on to the database on a miss
      const u = (t - 0.25) / 0.35;
      const z = middle("lb") + (middle(deepest) - middle("lb")) * u;
      point = railAt(z);
      lit.lb = true;
      if (z <= middle(api)) lit[api] = true;
      if (z <= middle("cache") + 4) lit.cache = miss ? "warm" : true;
      if (miss && z <= middle("db") + 4) lit.db = "warm";
    } else if (t < 0.8) {
      const u = (t - 0.6) / 0.2;
      point = railAt(middle(deepest) + (middle("lb") - middle(deepest)) * u);
      lit[deepest] = miss ? "warm" : true;
    } else point = along(cable.current, 1 - (t - 0.8) / 0.2);
    place(packet.current, point);
    for (const key of Object.keys(units.current)) light(units.current[key], lit[key] ?? false);

    // the dashboard: requests a second, the share served from the cache, and how long the slow ones took
    const served = n + 1;
    const hits = served - Math.floor((served + 1) / 3);
    const values = [`${(1.18 + (n % 7) * 0.03).toFixed(2)}k`, `${Math.round((hits / served) * 100)}%`, `${miss ? 41 : 12 + (n % 5)}ms`];
    readouts.current.forEach((el, i) => el && (el.textContent = values[i]));
    bars.current.forEach((bar, i) => {
      const k = n - (bars.current.length - 1 - i);
      const h = k < 0 ? 2 : k % 3 === 2 ? 26 : 9 + ((k * 7) % 6);
      bar?.setAttribute("height", String(h));
      bar?.setAttribute("y", String(116 - h));
      bar?.setAttribute("fill", k % 3 === 2 ? "#e2b5a1" : "#b8c8a8");
    });
  });

  return (
    <svg ref={svg} viewBox="4 108 532 464" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the clients' cable, coming up off the desk */}
      <path ref={cable} d={CABLE} fill="none" stroke="#7c817a" strokeWidth={3.2} strokeLinecap="round" className={styles.pipes} />
      <g className={styles.pipes}>
        <FrontTag origin={at(-250, 150, 10)} text="clients" size={7} fill="#5e625c" />
      </g>

      {/* the cabinet */}
      <Part arrival={{ lift: 30, from: 0.12, span: 0.14 }} style={drawn(0.02, 0.12)}>
        <g filter="url(#desk-card)">
          <Block {...RACK} z={0} tone={TONES.dark} r={10} />
        </g>
      </Part>

      {/* the units, sliding home one after another, from the bottom up */}
      {UNITS.map((unit, i) => (
        <Part key={unit.key} arrival={{ lift: -34, shift: -60, from: 0.3 + i * 0.07, span: 0.12 }} style={drawn(0.2 + i * 0.06, 0.28 + i * 0.06, 0.08)}>
          <g
            ref={(el) => {
              units.current[unit.key] = el;
            }}
          >
            <g filter="url(#desk-chip)">
              <Block x0={-54} x1={54} y0={-40} y1={FRONT} z={unit.z} h={unit.h} tone={unit.tone} r={5} width={1.2} />
            </g>
            <path d={rounded(frontFace(-50, 50, unit.z + 3, unit.z + unit.h - 3, FRONT), 4)} className={styles.glow} />
            <FrontTag origin={at(-46, FRONT, unit.z + unit.h - 8)} text={unit.name} size={6.6} />
            <g transform={onFront(at(34, FRONT, unit.z + unit.h - 4))}>
              <circle cx={8} cy={4} r={3.2} className={styles.led} stroke="rgba(45,47,43,0.55)" strokeWidth={0.8} />
              {unit.key === "db" &&
                [16, 24, 32].map((v) => <rect key={v} x={-52} y={v} width={60} height={4} rx={2} fill="#b8c8a8" />)}
              {unit.key === "workers" &&
                [-40, -18].map((u) => (
                  <g key={u} transform={`translate(${u} 12)`}>
                    <circle r={9} fill="#e6e8e3" stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
                    <g className={styles.spin}>
                      <path d="M0 -7V7M-7 0H7M-5 -5L5 5M-5 5L5 -5" stroke="#7c817a" strokeWidth={1.6} strokeLinecap="round" />
                    </g>
                  </g>
                ))}
            </g>
          </g>
        </Part>
      ))}

      {/* the cabinet's right wall and lid, in front of the units' sides, so the units sit inside it */}
      <Part arrival={{ lift: 30, from: 0.12, span: 0.14 }} style={drawn(0.02, 0.12)}>
        <g filter="url(#desk-chip)">
          <Block x0={RACK.x1 - 6} x1={RACK.x1} y0={RACK.y0} y1={RACK.y1} z={0} h={RACK.h} tone={TONES.dark} r={3} width={1.2} />
          <Block x0={RACK.x0} x1={RACK.x1} y0={RACK.y0} y1={RACK.y1} z={RACK.h - 8} h={8} tone={TONES.dark} r={8} width={1.2} />
        </g>
      </Part>

      {/* the health dashboard, standing to the right */}
      <Part arrival={{ lift: 40, from: 0.62, span: 0.14 }} style={drawn(0.52, 0.6)}>
        <g filter="url(#desk-card)">
          <Block x0={110} x1={250} y0={60} y1={66} z={0} h={140} tone={TONES.paper} r={10} />
        </g>
        <g transform={onFront(at(110, 66, 140))} className={styles.tag}>
          <text x={12} y={18} fontSize={8.5} fontWeight={700} fill="#2d2f2b">
            health
          </text>
          <circle cx={128} cy={15} r={3.2} fill="#80966b" />
          {["req/s", "cache hit", "p95"].map((label, i) => (
            <g key={label}>
              <text x={12} y={38 + i * 16} fontSize={6.6} fontWeight={700} fill="#7c817a">
                {label}
              </text>
              <text
                ref={(el) => {
                  readouts.current[i] = el;
                }}
                x={128}
                y={38 + i * 16}
                textAnchor="end"
                fontSize={7.4}
                fontWeight={700}
                fill={i === 2 ? "#9c3f1d" : "#4c5e3e"}
              >
                —
              </text>
            </g>
          ))}
          <path d="M12 118H128" stroke="rgba(45,47,43,0.4)" strokeWidth={1} />
          {Array.from({ length: 10 }, (_, i) => (
            <rect
              key={i}
              ref={(el) => {
                bars.current[i] = el;
              }}
              x={14 + i * 11.4}
              y={114}
              width={7}
              height={2}
              rx={2}
              fill="#b8c8a8"
            />
          ))}
        </g>
      </Part>

      {built && (
        <Packet
          colour="#80966b"
          r={4}
          ref={(el) => {
            packet.current = el;
          }}
        />
      )}
    </svg>
  );
}
