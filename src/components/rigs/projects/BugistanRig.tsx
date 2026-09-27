"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES } from "@/components/desk/iso";
import { useBuild, useClock } from "../kit";
import styles from "../Rigs.module.css";

/**
 * Bugistan, a VS Code extension that turns a program's problems into a game,
 * as a laptop open on the desk. On its screen, the code on the left has its
 * problems underlined, and on the right each problem is a creature crawling
 * about the canvas. One after another a slipper comes down on them: the
 * creature bursts into particles, its underline goes from the code, and the
 * count of problems falls — until the code is clean and a new batch of bugs
 * arrives. Beside the laptop stand the rack of species and the frame meter.
 */

// the screen, in its own units: across it and down it
const SCREEN = { w: 312, h: 164 };
const CANVAS = { x: 176, y: 22, w: 128, h: 124 };
const BUGS = [
  { colour: "#d0714c", line: 1 },
  { colour: "#80966b", line: 3 },
  { colour: "#9a9f98", line: 4 },
  { colour: "#bc4e26", line: 6 },
  { colour: "#647a52", line: 8 },
];
const SQUASH = 1700;
const CODE = [62, 88, 40, 104, 76, 50, 96, 70, 84, 44];

export default function BugistanRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const bugs = useRef<(SVGGElement | null)[]>([]);
  const bursts = useRef<(SVGGElement | null)[]>([]);
  const slipper = useRef<SVGGElement>(null);
  const squiggles = useRef<(SVGPathElement | null)[]>([]);
  const count = useRef<SVGTextElement>(null);

  useClock(built, svg, (ms) => {
    // a batch of bugs, squashed one every SQUASH, then a new batch after a pause
    const batch = SQUASH * (BUGS.length + 2);
    const t = ms % batch;
    const squashed = Math.min(BUGS.length, Math.floor(t / SQUASH));
    BUGS.forEach((_, i) => {
      // each wanders on its own path about the canvas
      const s = ms / 1000;
      const x = CANVAS.x + CANVAS.w / 2 + Math.sin(s * (0.7 + i * 0.13) + i * 2.1) * (CANVAS.w / 2 - 14);
      const y = CANVAS.y + CANVAS.h / 2 + Math.cos(s * (0.55 + i * 0.17) + i * 1.3) * (CANVAS.h / 2 - 14);
      const heading = Math.atan2(Math.cos(s * (0.55 + i * 0.17) + i * 1.3) * -1, Math.sin(s * (0.7 + i * 0.13) + i * 2.1)) * (180 / Math.PI);
      const alive = i >= squashed;
      const bug = bugs.current[i];
      bug?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${heading.toFixed(0)})`);
      bug?.setAttribute("opacity", alive ? "1" : "0");
      squiggles.current[i]?.setAttribute("opacity", alive ? "1" : "0");
      // the moment it is squashed, it bursts where it stood
      const since = t - (i + 1) * SQUASH;
      const burst = bursts.current[i];
      if (since > -300 && since < 500 && i < BUGS.length) {
        burst?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.4 + Math.max(0, since) / 300).toFixed(2)})`);
        burst?.setAttribute("opacity", since < 0 ? "0" : (1 - since / 500).toFixed(2));
      } else burst?.setAttribute("opacity", "0");
      // the slipper comes down on the next bug due
      if (i === Math.min(BUGS.length - 1, Math.floor(t / SQUASH))) {
        const u = (t % SQUASH) / SQUASH;
        const drop = u < 0.75 ? -26 : -26 + ((u - 0.75) / 0.25) * 26;
        slipper.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${(y + drop).toFixed(1)}) rotate(-20)`);
        slipper.current?.setAttribute("opacity", squashed < BUGS.length ? "1" : "0");
      }
    });
    if (count.current) count.current.textContent = `⚠ ${BUGS.length - squashed} problems`;
  });

  return (
    <svg ref={svg} viewBox="112 110 466 458" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the laptop: its base, and its screen standing up behind it */}
      <Part arrival={{ lift: 30, from: 0.06, span: 0.14 }} style={drawn(0, 0.1)}>
        <g filter="url(#desk-card)">
          <Block x0={-170} x1={170} y0={-12} y1={110} z={0} h={8} tone={TONES.paper} r={14} />
        </g>
        <g transform={onTop(at(-120, 20, 8))} className={styles.tag}>
          <rect width={240} height={56} rx={6} fill="#e3e5e0" />
          <rect x={90} y={66} width={60} height={24} rx={5} fill="#e3e5e0" />
        </g>
      </Part>
      <Part arrival={{ lift: 60, from: 0.2, span: 0.16 }} style={drawn(0.1, 0.2)}>
        <g filter="url(#desk-card)">
          <Block x0={-170} x1={170} y0={-20} y1={-12} z={4} h={182} tone={TONES.dark} r={10} />
        </g>
      </Part>

      {/* what the screen shows: the editor on the left, the game on the right */}
      <g transform={onFront(at(-164, -12, 182))} className={styles.tag}>
        <rect x={0} y={0} width={SCREEN.w} height={SCREEN.h + 8} rx={8} fill="#2a2d29" />
        <rect x={0} y={0} width={SCREEN.w} height={12} rx={6} fill="#3b3d39" />
        {["#d0714c", "#9a9f98", "#9caf88"].map((c, i) => (
          <circle key={c} cx={8 + i * 7} cy={6} r={2} fill={c} />
        ))}
        <text x={SCREEN.w / 2} y={8.6} textAnchor="middle" fontSize={5.2} fontWeight={700} fill="#9a9f98">
          bugistan — main.ts
        </text>
        {/* the code, with a squiggle under each line that has a problem */}
        {CODE.map((width, line) => (
          <rect key={line} x={14 + (line % 3) * 8} y={22 + line * 12} width={width} height={4.5} rx={2} fill={line % 4 === 0 ? "#b1c29f" : line % 3 === 0 ? "#e0916f" : "#6b706a"} />
        ))}
        {BUGS.map((bug, i) => (
          <path
            key={i}
            ref={(el) => {
              squiggles.current[i] = el;
            }}
            d={`M${14 + (bug.line % 3) * 8} ${29 + bug.line * 12}q3 -3 6 0t6 0t6 0t6 0t6 0t6 0t6 0t6 0`}
            fill="none"
            stroke="#e0916f"
            strokeWidth={1.2}
          />
        ))}
        {/* the canvas the game is played on */}
        <rect x={CANVAS.x} y={CANVAS.y} width={CANVAS.w} height={CANVAS.h} rx={8} fill="#353832" stroke="#5e625c" />
        <path d={`M${CANVAS.x + 10} ${CANVAS.y + 30}h108M${CANVAS.x + 10} ${CANVAS.y + 62}h108M${CANVAS.x + 10} ${CANVAS.y + 94}h108`} stroke="#3f423c" strokeWidth={1} />
        {BUGS.map((bug, i) => (
          <g
            key={i}
            ref={(el) => {
              bugs.current[i] = el;
            }}
            transform={`translate(${CANVAS.x + 20 + i * 20} ${CANVAS.y + 60})`}
          >
            <path d="M-4 -3l-4 -3M-4 3l-4 3M0 -4l0 -5M0 4l0 5M4 -3l4 -3M4 3l4 3" stroke="#b8bcb5" strokeWidth={1} strokeLinecap="round" />
            <ellipse rx={6.5} ry={4.6} fill={bug.colour} stroke="#1f201e" strokeWidth={0.8} />
            <circle cx={6} cy={0} r={2.4} fill="#1f201e" />
          </g>
        ))}
        {BUGS.map((bug, i) => (
          <g
            key={i}
            ref={(el) => {
              bursts.current[i] = el;
            }}
            opacity={0}
          >
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k / 8) * Math.PI * 2;
              return <circle key={k} cx={Math.cos(a) * 9} cy={Math.sin(a) * 9} r={1.8} fill={bug.colour} />;
            })}
          </g>
        ))}
        <g ref={slipper} opacity={0}>
          <path d="M-6 -16c6-3 12 0 12 6v16c0 6-12 6-12 0z" fill="#ecc9b9" stroke="#1f201e" strokeWidth={1} />
          <path d="M-6 -6h12" stroke="#bc4e26" strokeWidth={2.4} />
        </g>
        <rect x={0} y={SCREEN.h - 4} width={SCREEN.w} height={12} fill="#3b3d39" />
        <text ref={count} x={10} y={SCREEN.h + 4} fontSize={5.6} fontWeight={700} fill="#e0916f">
          ⚠ 5 problems
        </text>
        <text x={SCREEN.w - 10} y={SCREEN.h + 4} textAnchor="end" fontSize={5.6} fontWeight={700} fill="#b1c29f">
          60 fps
        </text>
      </g>

      {/* the rack of species, beside the laptop */}
      <Part arrival={{ lift: 40, from: 0.5, span: 0.12, fall: true }} style={drawn(0.44, 0.5, 0.06)}>
        <g filter="url(#desk-chip)">
          <Block x0={200} x1={250} y0={10} y1={60} z={0} h={62} tone={TONES.concrete} r={6} width={1.2} />
        </g>
        <g transform={onFront(at(200, 60, 62))} className={styles.tag}>
          {BUGS.slice(0, 3).map((bug, i) => (
            <g key={i} transform={`translate(24 ${12 + i * 16})`}>
              <ellipse rx={7} ry={4.6} fill={bug.colour} stroke="#1f201e" strokeWidth={0.8} />
            </g>
          ))}
          <text x={25} y={58} textAnchor="middle" fontSize={5} fontWeight={700} fill="#2d2f2b">
            38 kinds
          </text>
        </g>
      </Part>
    </svg>
  );
}
