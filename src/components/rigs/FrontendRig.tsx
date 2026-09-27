"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, TONES, type Point } from "@/components/desk/iso";
import { light, place, useBuild, useClock } from "./kit";
import styles from "./Rigs.module.css";

/**
 * Frontend development as an inspection: a page under the glass.
 *
 * A finished page lies on the desk — its header, a heading, a button and a
 * field, a row of cards and its footer — with an inspector's panel standing
 * beside it. A magnifying glass moves from one part to the next, and whatever
 * it stops over gives up its structure: the contrast of the heading against
 * the page, the button's box model banded in margin, border and padding, the
 * ring the keyboard's focus draws round the field, and the gaps in the card
 * row measured over the layout's twelve columns, with the tab order numbered.
 * Rulers run along the page's edges. The panel follows the glass, naming the
 * element, reading out what it found, and showing the CSS behind it, with the
 * page's accessibility score in its corner.
 */

const PAGE = { x0: -170, x1: 130, y0: -110, y1: 110 };
const Z = 4;
const pageAt = (u: number, v: number): Point => at(PAGE.x0 + u, PAGE.y0 + v, Z);

const STOPS = [
  { target: [96, 52] as Point, element: "h1.hero", lines: ["contrast 7.4 : 1", "AA · AAA large ✓"], css: "color: #4a4d48;" },
  { target: [54, 95] as Point, element: "button.cta", lines: ["margin 8 · border 1", "padding 6 × 14"], css: "padding: 6px 14px;" },
  { target: [155, 95] as Point, element: "input#email", lines: ["focus-visible ✓", "tab stop 2 of 3"], css: "outline: 2px solid;" },
  { target: [150, 154] as Point, element: "ul.cards", lines: ["gap 14 · 3 columns", "every gap equal ✓"], css: "gap: 14px;" },
];
const STOP = 2600;
const MOVE = 700;

export default function FrontendRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const lens = useRef<SVGGElement>(null);
  const shadow = useRef<SVGGElement>(null);
  const overlays = useRef<(SVGGElement | null)[]>([]);
  const element = useRef<SVGTextElement>(null);
  const lines = useRef<(SVGTextElement | null)[]>([]);
  const css = useRef<SVGTextElement>(null);

  useClock(built, svg, (ms) => {
    const k = Math.floor(ms / STOP) % STOPS.length;
    const t = ms % STOP;
    const from = STOPS[(k + STOPS.length - 1) % STOPS.length].target;
    const to = STOPS[k].target;
    const u = Math.min(1, t / MOVE);
    const ease = u * u * (3 - 2 * u);
    const [x, y] = pageAt(from[0] + (to[0] - from[0]) * ease, from[1] + (to[1] - from[1]) * ease);
    place(shadow.current, [x, y]);
    place(lens.current, [x, y - 58 + Math.sin(ms / 400) * 2]);
    const arrived = t > MOVE;
    overlays.current.forEach((overlay, i) => light(overlay, arrived && i === k));
    if (element.current) element.current.textContent = STOPS[k].element;
    lines.current.forEach((line, i) => line && (line.textContent = arrived ? STOPS[k].lines[i] : "…"));
    if (css.current) css.current.textContent = arrived ? STOPS[k].css : "";
  });

  return (
    <svg ref={svg} viewBox="110 166 582 368" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the inspector's panel, standing behind and to the right */}
      <Part arrival={{ lift: 40, from: 0.28, span: 0.14 }} style={drawn(0.1, 0.2)}>
        <g filter="url(#desk-card)">
          <Block x0={170} x1={300} y0={-66} y1={-60} z={0} h={150} tone={TONES.paper} r={10} />
        </g>
        <g transform={onFront(at(170, -60, 150))} className={styles.tag}>
          <rect x={6} y={6} width={118} height={14} rx={6} fill="#e6e8e3" />
          {["#d0714c", "#9a9f98", "#9caf88"].map((c, i) => (
            <circle key={c} cx={14 + i * 7} cy={13} r={2.2} fill={c} />
          ))}
          <text x={118} y={16} textAnchor="end" fontSize={6} fontWeight={700} fill="#7c817a">
            inspect
          </text>
          <text ref={element} x={10} y={34} fontSize={8} fontWeight={700} fill="#9c3f1d">
            h1.hero
          </text>
          <circle cx={113} cy={31} r={8} fill="none" stroke="#e3e5e0" strokeWidth={2.4} />
          <circle cx={113} cy={31} r={8} fill="none" stroke="#80966b" strokeWidth={2.4} strokeDasharray="50.3" strokeLinecap="round" transform="rotate(-90 113 31)" />
          <text x={113} y={33.4} textAnchor="middle" fontSize={5.4} fontWeight={700} fill="#4c5e3e">
            100
          </text>
          <text x={113} y={45} textAnchor="middle" fontSize={3.8} fontWeight={700} fill="#7c817a">
            a11y
          </text>
          {/* the box model, in its four bands */}
          <rect x={10} y={42} width={110} height={58} rx={6} fill="#f5dfd5" />
          <rect x={20} y={50} width={90} height={42} rx={5} fill="#f4f4f0" stroke="#2d2f2b" strokeWidth={1.2} />
          <rect x={27} y={56} width={76} height={30} rx={4} fill="#e2e9da" />
          <rect x={40} y={63} width={50} height={16} rx={3} fill="#f4f4f0" stroke="rgba(45,47,43,0.4)" strokeWidth={0.8} />
          <text x={14} y={49} fontSize={4.6} fontWeight={700} fill="#9c3f1d">
            margin
          </text>
          <text x={30} y={62} fontSize={4.6} fontWeight={700} fill="#4c5e3e">
            padding
          </text>
          {[0, 1].map((i) => (
            <text
              key={i}
              ref={(el) => {
                lines.current[i] = el;
              }}
              x={10}
              y={112 + i * 11}
              fontSize={6.4}
              fontWeight={700}
              fill="#2d2f2b"
            >
              …
            </text>
          ))}
          <rect x={8} y={130} width={114} height={13} rx={4} fill="#2d2f2b" />
          <text ref={css} x={13} y={139} fontSize={5.8} fontWeight={700} fill="#b1c29f" />
        </g>
      </Part>

      {/* the page, lying on the desk */}
      <Part arrival={{ lift: 30, from: 0.12, span: 0.14 }} style={drawn(0.02, 0.12)}>
        <g filter="url(#desk-card)">
          <Block x0={PAGE.x0} x1={PAGE.x1} y0={PAGE.y0} y1={PAGE.y1} z={0} h={Z} tone={TONES.paper} r={14} />
        </g>
        <g transform={onTop(at(PAGE.x0, PAGE.y0, Z))} className={styles.tag}>
          {/* rulers along the top and the left */}
          <path d={Array.from({ length: 15 }, (_, i) => `M${10 + i * 20} 1V${i % 5 ? 4 : 6}`).join("")} stroke="#9a9f98" strokeWidth={0.8} />
          <path d={Array.from({ length: 11 }, (_, i) => `M1 ${10 + i * 20}H${i % 5 ? 4 : 6}`).join("")} stroke="#9a9f98" strokeWidth={0.8} />
          {/* header */}
          <rect x={10} y={10} width={280} height={18} rx={7} fill="#d3d6d0" />
          <circle cx={21} cy={19} r={4} fill="#d0714c" />
          {[200, 230, 260].map((u) => (
            <rect key={u} x={u} y={16} width={22} height={6} rx={3} fill="#9a9f98" />
          ))}
          {/* heading and its line */}
          <rect x={22} y={44} width={150} height={12} rx={4} fill="#4a4d48" />
          <rect x={22} y={62} width={110} height={7} rx={3} fill="#b8bcb5" />
          {/* the button and the field */}
          <rect x={22} y={84} width={64} height={22} rx={9} fill="#ecc9b9" stroke="rgba(45,47,43,0.5)" />
          <text x={54} y={98} textAnchor="middle" fontSize={7} fontWeight={700} fill="#2d2f2b">
            Sign up
          </text>
          <rect x={100} y={84} width={110} height={22} rx={9} fill="#f4f4f0" stroke="rgba(45,47,43,0.5)" />
          <text x={108} y={98} fontSize={6.4} fontWeight={700} fill="#9a9f98">
            you@mail.com
          </text>
          {/* the row of cards */}
          {[
            { u: 22, fill: "#e2e9da" },
            { u: 112, fill: "#f4f4f0" },
            { u: 202, fill: "#f5dfd5" },
          ].map(({ u, fill }) => (
            <g key={u}>
              <rect x={u} y={124} width={76} height={60} rx={9} fill={fill} stroke="rgba(45,47,43,0.4)" />
              <rect x={u + 8} y={134} width={40} height={6} rx={3} fill="#9a9f98" />
              <rect x={u + 8} y={146} width={56} height={4} rx={2} fill="#d3d6d0" />
              <rect x={u + 8} y={154} width={48} height={4} rx={2} fill="#d3d6d0" />
            </g>
          ))}
          {/* footer */}
          <rect x={10} y={196} width={280} height={12} rx={5} fill="#e6e8e3" />

          {/* what the glass finds, one at a time */}
          <g ref={(el) => {
              overlays.current[0] = el;
            }} className={styles.overlay}>
            <rect x={17} y={39} width={160} height={36} rx={6} fill="none" stroke="#bc4e26" strokeWidth={1.6} strokeDasharray="4 3" />
            <rect x={184} y={40} width={12} height={12} rx={3} fill="#4a4d48" />
            <rect x={198} y={40} width={12} height={12} rx={3} fill="#f4f4f0" stroke="rgba(45,47,43,0.5)" />
            <text x={214} y={50} fontSize={7} fontWeight={700} fill="#9c3f1d">
              7.4:1
            </text>
          </g>
          <g ref={(el) => {
              overlays.current[1] = el;
            }} className={styles.overlay}>
            <rect x={14} y={76} width={80} height={38} rx={11} fill="rgba(208,113,76,0.28)" />
            <rect x={22} y={84} width={64} height={22} rx={9} fill="none" stroke="#2d2f2b" strokeWidth={1.6} />
            <rect x={29} y={89} width={50} height={12} rx={5} fill="rgba(128,150,107,0.35)" />
          </g>
          <g ref={(el) => {
              overlays.current[2] = el;
            }} className={styles.overlay}>
            <rect x={95} y={79} width={120} height={32} rx={13} fill="none" stroke="#bc4e26" strokeWidth={2.4} />
            <rect x={103} y={90} width={2} height={10} fill="#2d2f2b" className={styles.caret} />
            {/* the order the keyboard reaches the controls in */}
            {[
              [18, 80],
              [96, 80],
              [18, 120],
            ].map(([u, v], i) => (
              <g key={i} transform={`translate(${u} ${v})`}>
                <circle r={5} fill={i === 1 ? "#bc4e26" : "#f4f4f0"} stroke="#bc4e26" strokeWidth={1} />
                <text y={2.2} textAnchor="middle" fontSize={5.6} fontWeight={700} fill={i === 1 ? "#f4f4f0" : "#9c3f1d"}>
                  {i + 1}
                </text>
              </g>
            ))}
          </g>
          <g ref={(el) => {
              overlays.current[3] = el;
            }} className={styles.overlay}>
            {/* the layout's twelve columns */}
            {Array.from({ length: 12 }, (_, c) => (
              <rect key={c} x={22 + c * 22} y={116} width={18} height={74} fill="rgba(128,150,107,0.12)" />
            ))}
            {[98, 188].map((u) => (
              <g key={u}>
                <rect x={u} y={124} width={14} height={60} fill="rgba(208,113,76,0.25)" />
                <path d={`M${u} 190V196M${u + 14} 190V196M${u} 193H${u + 14}`} stroke="#bc4e26" strokeWidth={1.2} />
                <text x={u + 7} y={120} textAnchor="middle" fontSize={6.4} fontWeight={700} fill="#9c3f1d">
                  14
                </text>
              </g>
            ))}
          </g>
        </g>
      </Part>

      {/* the magnifying glass, and its shadow on the page */}
      {built && (
        <>
          <g ref={shadow} transform="translate(-999 -999)">
            <ellipse rx={30} ry={14} fill="#2d2f2b" opacity={0.12} />
          </g>
          <g ref={lens} transform="translate(-999 -999)">
            <path d="M20 20L44 44" stroke="#5e625c" strokeWidth={7} strokeLinecap="round" />
            <path d="M20 20L44 44" stroke="#9a9f98" strokeWidth={2.4} strokeLinecap="round" transform="translate(-1 -1.5)" />
            <circle r={27} fill="rgba(244,244,240,0.28)" stroke="#2d2f2b" strokeWidth={3.2} />
            <circle r={23} fill="none" stroke="#b1c29f" strokeWidth={2} />
            <path d="M-14 -10A17 17 0 0 1 -2 -18" fill="none" stroke="#f4f4f0" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        </>
      )}
    </svg>
  );
}
