"use client";

import { useEffect, useRef, useState } from "react";
import deskStyles from "@/components/desk/Desk.module.css";
import { at, between, Block, COS, Detail, drawn, frontFace, line, onFront, onTop, Part, poly, rounded, sideFace, topFace, TONES, type Point, type Tone } from "@/components/desk/iso";
import { PLOTS } from "./plots";
import styles from "./Plotter.module.css";

/**
 * The hero's pen plotter: a machine in the site's own hand — soft blocks in
 * paper and pastel with a wobbling edge and a hard shadow — that draws Ahmad's
 * projects, one sheet after another, the way he would sketch them.
 *
 * When the page opens it builds itself: the base draws in, the rails and the
 * gantry are lowered on, the carriage and its pen drop into place and a sheet
 * comes out of the feed. Then it plots. The gantry runs up and down the sheet,
 * the carriage runs across it, and the pen goes down, draws a stroke — boxes,
 * arrows, a network, a chart, even the labels, in its own single-stroke hand —
 * lifts, and moves to the next. A finished sheet is held up for a moment, fed
 * out of the front, and a fresh one comes in with the next drawing (and the
 * next pen). Clicking the machine finishes the sheet and feeds the next.
 *
 * It is drawn in layers, one SVG over another in the same view box: the
 * machine, the sheet, the gantry, the pen, the carriage and the display. The
 * moving ones are moved by their CSS translate, so the browser slides them
 * rather than redrawing their wobbling edges every frame.
 */

// ── the view, and moving within it ──────────────────────────────────────
const VB = { x: 64, y: 136, w: 612, h: 452 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
/** A shift on screen, in view box units, as a CSS translate of a layer the size of the view. */
const shift = (dx: number, dy: number) => `${((dx / VB.w) * 100).toFixed(3)}% ${((dy / VB.h) * 100).toFixed(3)}%`;

// ── the machine, in the scene's own units ───────────────────────────────
const BASE = { x0: -196, x1: 196, y0: -128, y1: 134, h: 22 };
const HOUSING = { x0: -196, x1: 196, y0: -158, y1: -128, h: 46 };
const BED = { x0: -170, x1: 170, y0: -116, y1: 122, z: 22, h: 3 };
/** The sheet's top left corner, and its top: u runs along x from here, v along y. */
const PX = -150;
const PY = -100;
const SHEET_Z = 25;
const SHEET_TOP = 26.5;
const RAIL = { y0: -126, y1: 130, z: 22, h: 8 };
const RAIL_X = [-192, -176, 176, 192];
/** The gantry, drawn with the pen at v = 0: its legs on the rails, and its beam behind the carriage. */
const GANTRY = { y0: PY - 33, y1: PY - 7, beamY0: PY - 29, beamY1: PY - 11, z: 30, top: 88, beamZ: 72 };
const CARRIAGE = { half: 16, depth: 11, z: 50, h: 42 };
const PEN = { half: 3.5, tip: 7, body: 25 };
/** How high the pen lifts to travel. */
const LIFT = 12;
/** Where the pen waits, at the back of the sheet, while a sheet is fed. */
const PARK: Point = [150, 6];

const SAGE: Tone = { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" };
const SHEET: Tone = { top: "#fbfbf8", left: "#eceee9", right: "#e3e5e0" };
const STEEL: Tone = { top: "#b8bcb5", left: "#9a9f98", right: "#7c817a" };
const SIENNA: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const DARK: Tone = TONES.dark;
/** The pens in the holder at the back, one for each ink the drawings use. */
const INKS = [...new Set(PLOTS.map((p) => p.ink))];

// ── the opening, in progress from 0 to 1 ───────────────────────────────
const INTRO = 3400;
const DELAY = 450;

// ── the plotting, in real time ─────────────────────────────────────────
const DRAW_SPEED = 560; // sheet units a second, pen down
const TRAVEL_SPEED = 1400; // pen up
const PEN_MOVE = 45; // ms to lift or lower the pen
const HOLD = 2600; // ms a finished sheet is shown
const FEED_OUT = 750;
const FEED_IN = 850;
/** How far a sheet slides when it is fed, in the scene. */
const FEED_OUT_BY = 230;
const FEED_IN_FROM = -250;

type Step =
  | { kind: "travel"; to: Point }
  | { kind: "pen"; down: boolean }
  | { kind: "draw"; stroke: number }
  | { kind: "hold"; ms: number }
  | { kind: "feedOut" }
  | { kind: "feedIn" };

/** Everything in front of the feed slot, on the sheet's plane: the sheet is hidden behind it as it comes out. */
const SLOT_CLIP = (() => {
  const corners = [at(-700, BASE.y0, SHEET_TOP), at(700, BASE.y0, SHEET_TOP), at(700, 900, SHEET_TOP), at(-700, 900, SHEET_TOP)];
  return `polygon(${corners.map(([x, y]) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`).join(", ")})`;
})();

const smooth = (k: number) => k * k * (3 - 2 * k);

export default function Plotter({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const sheet = useRef<SVGSVGElement>(null);
  const gantry = useRef<SVGSVGElement>(null);
  const pen = useRef<SVGSVGElement>(null);
  const carriage = useRef<SVGSVGElement>(null);
  const plots = useRef<(SVGGElement | null)[]>([]);
  const inks = useRef<(SVGPathElement | null)[][]>(PLOTS.map(() => []));
  const cap = useRef<SVGPathElement>(null);
  const holder = useRef<(SVGGElement | null)[]>([]);
  const readout = useRef<SVGTextElement>(null);
  const bar = useRef<SVGRectElement>(null);
  const busy = useRef<SVGCircleElement>(null);
  /** set while running: finishes the sheet and feeds the next */
  const skip = useRef<() => void>(() => {});

  // the opening: --p runs from 0 to 1, and every part works out from it where it is
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : INTRO;
    let start = -1;
    let frame = 0;
    const tick = (now: number) => {
      if (start < 0) start = now + (length ? DELAY : 0);
      const p = length ? Math.min(1, Math.max(0, (now - start) / length)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setBuilt(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // the plotting
  useEffect(() => {
    if (!built) return;
    const paths = inks.current;
    const lengths = paths.map((plot) => plot.map((p) => p?.getTotalLength() ?? 0));
    const starts = paths.map((plot) => plot.map((p): Point => (p ? [p.getPointAtLength(0).x, p.getPointAtLength(0).y] : [0, 0])));
    const totals = lengths.map((ls) => ls.reduce((a, b) => a + b, 0));
    // each stroke is one dash as long as itself, slid along to show as much of it as is drawn
    paths.forEach((plot, k) =>
      plot.forEach((path, i) => {
        if (!path) return;
        path.style.strokeDasharray = `${lengths[k][i].toFixed(2)} ${(lengths[k][i] + 2).toFixed(2)}`;
        path.style.strokeDashoffset = lengths[k][i].toFixed(2);
      }),
    );

    // where the pen is: across the sheet, down it, and how far it is lifted
    const pos = { u: PARK[0], v: PARK[1], lift: LIFT };
    const put = () => {
      const { u, v, lift } = pos;
      if (gantry.current) gantry.current.style.translate = shift(-COS * v, v / 2);
      const [dx, dy] = [COS * (u - v), (u + v) / 2];
      if (carriage.current) carriage.current.style.translate = shift(dx, dy);
      if (pen.current) pen.current.style.translate = shift(dx, dy - lift);
    };
    const feed = (by: number, opacity: number) => {
      if (!sheet.current) return;
      sheet.current.style.translate = shift(-COS * by, by / 2);
      sheet.current.style.opacity = String(opacity);
    };
    const mark = (k: number, i: number, done: number) => {
      const path = paths[k][i];
      if (!path) return;
      path.style.strokeDashoffset = (lengths[k][i] * (1 - done)).toFixed(2);
      path.style.strokeOpacity = done > 0 ? "1" : "0";
    };
    let drawnSoFar = 0;
    const show = (k: number, progress: number) => {
      plots.current.forEach((g, j) => g?.setAttribute("visibility", j === k ? "visible" : "hidden"));
      cap.current?.setAttribute("fill", PLOTS[k].ink);
      holder.current.forEach((g, j) => g?.setAttribute("opacity", INKS[j] === PLOTS[k].ink ? "0" : "1"));
      if (readout.current) readout.current.textContent = `PLOT ${k + 1}/${PLOTS.length} · ${PLOTS[k].name}`;
      if (bar.current) bar.current.setAttribute("width", (98 * progress).toFixed(1));
    };

    // with reduced motion: the first drawing, finished, and nothing moving
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      PLOTS[0].strokes.forEach((_, i) => mark(0, i, 1));
      show(0, 1);
      put();
      return;
    }

    const stepsFor = (k: number): Step[] => [
      ...PLOTS[k].strokes.flatMap((_, i): Step[] => [{ kind: "travel", to: starts[k][i] }, { kind: "pen", down: true }, { kind: "draw", stroke: i }, { kind: "pen", down: false }]),
      { kind: "travel", to: PARK },
      { kind: "hold", ms: HOLD },
      { kind: "feedOut" },
      { kind: "feedIn" },
    ];

    let k = 0;
    let steps = stepsFor(k);
    let index = 0;
    let t = 0;
    let length = 0;
    let from = { ...pos };

    const begin = () => {
      const step = steps[index];
      from = { ...pos };
      t = 0;
      if (step.kind === "travel") {
        const distance = Math.hypot(step.to[0] - pos.u, step.to[1] - pos.v);
        length = distance < 0.5 ? 0 : Math.max(70, (distance / TRAVEL_SPEED) * 1000);
      } else if (step.kind === "pen") length = PEN_MOVE;
      else if (step.kind === "draw") {
        length = (lengths[k][step.stroke] / DRAW_SPEED) * 1000;
        const path = paths[k][step.stroke];
        if (path) path.style.strokeOpacity = "1";
      } else if (step.kind === "hold") length = step.ms;
      else if (step.kind === "feedOut") length = FEED_OUT;
      else {
        // the next drawing: a clean sheet waiting in the feed, and the next pen in the carriage
        length = FEED_IN;
        k = (k + 1) % PLOTS.length;
        PLOTS[k].strokes.forEach((_, i) => mark(k, i, 0));
        drawnSoFar = 0;
        show(k, 0);
        feed(FEED_IN_FROM, 1);
      }
    };

    /** How far through the current step is, from 0 to 1, and what that does. */
    const apply = (f: number) => {
      const step = steps[index];
      if (step.kind === "travel") {
        const e = smooth(f);
        pos.u = from.u + (step.to[0] - from.u) * e;
        pos.v = from.v + (step.to[1] - from.v) * e;
      } else if (step.kind === "pen") {
        pos.lift = step.down ? LIFT * (1 - f) : LIFT * f;
      } else if (step.kind === "draw") {
        const path = paths[k][step.stroke];
        if (!path) return;
        const point = path.getPointAtLength(lengths[k][step.stroke] * f);
        pos.u = point.x;
        pos.v = point.y;
        mark(k, step.stroke, f);
        if (bar.current) bar.current.setAttribute("width", ((98 * (drawnSoFar + lengths[k][step.stroke] * f)) / totals[k]).toFixed(1));
      } else if (step.kind === "feedOut") {
        const e = f * f;
        feed(FEED_OUT_BY * e, 1 - e);
      } else if (step.kind === "feedIn") {
        feed(FEED_IN_FROM * (1 - smooth(f)), 1);
      }
      put();
    };

    const finish = () => {
      apply(1);
      const step = steps[index];
      if (step.kind === "draw") drawnSoFar += lengths[k][step.stroke];
      index++;
      if (index >= steps.length) {
        steps = stepsFor(k);
        index = 0;
      }
      begin();
    };

    show(k, 0);
    put();
    begin();
    busy.current?.setAttribute("data-on", "");

    skip.current = () => {
      const step = steps[index];
      if (step.kind === "feedOut" || step.kind === "feedIn") return;
      // everything drawn, the pen up, and straight on to parking and a short hold
      PLOTS[k].strokes.forEach((_, i) => mark(k, i, 1));
      drawnSoFar = totals[k];
      if (bar.current) bar.current.setAttribute("width", "98");
      pos.lift = LIFT;
      index = steps.findIndex((s) => s.kind === "travel" && s.to === PARK);
      steps[index + 1] = { kind: "hold", ms: 500 };
      begin();
    };

    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(60, now - last) : 16;
      last = now;
      t += dt;
      // a step can be shorter than a frame: finish as many as the time covers
      while (t >= length) {
        const over = t - length;
        finish();
        t = over;
      }
      apply(length ? t / length : 1);
      frame = requestAnimationFrame(tick);
    };

    // only plot while it is on screen
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    if (stage.current) watch.observe(stage.current);

    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      skip.current = () => {};
    };
  }, [built]);

  const layer = styles.layer;
  const start = shift(-COS * PARK[1], PARK[1] / 2);
  const startAt = shift(COS * (PARK[0] - PARK[1]), (PARK[0] + PARK[1]) / 2);
  const startPen = shift(COS * (PARK[0] - PARK[1]), (PARK[0] + PARK[1]) / 2 - LIFT);

  return (
    <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""} ${className ?? ""}`} onClick={() => skip.current()}>
      {/* ── the machine: base, feed, bed, rails, the pens in their holder ── */}
      <svg viewBox={VIEW} className={styles.base} aria-hidden="true" focusable="false">
        <g style={drawn(0.04, 0.14)} filter="url(#desk-card)">
          <Block x0={HOUSING.x0} x1={HOUSING.x1} y0={HOUSING.y0} y1={HOUSING.y1} z={0} h={HOUSING.h} tone={TONES.paper} r={14} />
          {/* the slot the sheets come out of */}
          <Detail d={rounded(frontFace(-152, 152, 24.5, 28.5, HOUSING.y1), 2)} fill="#7c817a" width={1} />
        </g>
        <text transform={onFront(at(-176, HOUSING.y1, 38))} fontSize={8} fontWeight={700} letterSpacing={1.2} fill="#5e625c" className={deskStyles.fade} style={between(0.16, 0.05)}>
          MA-02 · PEN PLOTTER
        </text>

        {/* the pens waiting in their holder, on top of the feed */}
        <g style={drawn(0.2, 0.28)} filter="url(#desk-chip)">
          <Block x0={112} x1={186} y0={-154} y1={-136} z={HOUSING.h} h={8} tone={TONES.concrete} r={5} width={1.2} />
        </g>
        {INKS.map((ink, j) => (
          <Part key={ink} arrival={{ lift: 36, from: 0.3 + j * 0.035, span: 0.06, fall: true }} style={drawn(0.28 + j * 0.035, 0.3 + j * 0.035, 0.05)}>
            <g
              ref={(el) => {
                holder.current[j] = el;
              }}
              filter="url(#desk-chip)"
            >
              <Block x0={126 + j * 22} x1={133 + j * 22} y0={-148} y1={-141} z={HOUSING.h + 8} h={20} tone={DARK} r={2} width={1} />
              <Block x0={125.5 + j * 22} x1={133.5 + j * 22} y0={-148.5} y1={-140.5} z={HOUSING.h + 22} h={8} tone={{ top: ink, left: ink, right: ink }} r={2.5} width={1} />
            </g>
          </Part>
        ))}

        <g style={drawn(0, 0.1)} filter="url(#desk-card)">
          <Block x0={BASE.x0} x1={BASE.x1} y0={BASE.y0} y1={BASE.y1} z={0} h={BASE.h} tone={SAGE} r={18} />
          {/* the display, the feed button and the power light, on the front */}
          <Detail d={rounded(frontFace(-178, -58, 4, 18, BASE.y1), 3)} fill="#3b3d39" />
          <Detail d={rounded(frontFace(128, 150, 7, 15, BASE.y1), 3)} fill="#d0714c" />
          <Detail d={rounded(frontFace(160, 170, 9, 13, BASE.y1), 2)} fill="#80966b" />
          {/* vents down the right side */}
          {Array.from({ length: 7 }, (_, i) => (
            <Detail key={i} d={line(at(BASE.x1, -104 + i * 10, 6), at(BASE.x1, -104 + i * 10, 16))} width={1.4} />
          ))}
        </g>
        <text transform={onFront(at(135, BASE.y1, 11))} y={2} fontSize={4.6} fontWeight={700} fill="#f4f4f0" className={deskStyles.fade} style={between(0.12, 0.05)}>
          FEED
        </text>

        {/* the bed the sheet lies on, lowered in */}
        <Part arrival={{ lift: 18, from: 0.12, span: 0.1 }} style={drawn(0.1, 0.2)}>
          <g filter="url(#desk-ink)">
            <Block x0={BED.x0} x1={BED.x1} y0={BED.y0} y1={BED.y1} z={BED.z} h={BED.h} tone={TONES.concrete} r={10} width={1.3} />
          </g>
          {/* a scale along its near edge */}
          {Array.from({ length: 15 }, (_, i) => (
            <Detail key={i} d={line(at(-140 + i * 20, BED.y1 - 3, BED.z + BED.h), at(-140 + i * 20, BED.y1 - (i % 5 ? 7 : 11), BED.z + BED.h))} width={1} />
          ))}
        </Part>

        {/* the rails the gantry runs on */}
        <g style={drawn(0.18, 0.26)} filter="url(#desk-chip)">
          <Block x0={RAIL_X[0]} x1={RAIL_X[1]} y0={RAIL.y0} y1={RAIL.y1} z={RAIL.z} h={RAIL.h} tone={STEEL} r={4} width={1.2} />
          <Block x0={RAIL_X[2]} x1={RAIL_X[3]} y0={RAIL.y0} y1={RAIL.y1} z={RAIL.z} h={RAIL.h} tone={STEEL} r={4} width={1.2} />
        </g>
        <g style={drawn(0.24, 0.3)}>
          <Detail d={line(at(-184, RAIL.y0 + 6, RAIL.z + RAIL.h), at(-184, RAIL.y1 - 6, RAIL.z + RAIL.h))} width={1} />
          <Detail d={line(at(184, RAIL.y0 + 6, RAIL.z + RAIL.h), at(184, RAIL.y1 - 6, RAIL.z + RAIL.h))} width={1} />
        </g>
      </svg>

      {/* ── the sheet, and what is drawn on it; hidden behind the slot as it comes out ── */}
      <div className={styles.slot} style={{ clipPath: SLOT_CLIP }}>
        <svg ref={sheet} viewBox={VIEW} className={`${layer} ${styles.moving}`} aria-hidden="true" focusable="false">
          <g className={deskStyles.fade} style={between(0.62, 0.08)}>
            <path d={rounded(topFace(PX, PX + 300, PY, PY + 200, SHEET_Z), 3)} fill="#2d2f2b" fillOpacity={0.18} transform="translate(3 3)" />
            <Block x0={PX} x1={PX + 300} y0={PY} y1={PY + 200} z={SHEET_Z} h={1.5} tone={SHEET} r={3} width={1.1} />
            <g transform={onTop(at(PX, PY, SHEET_TOP))} fill="none" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              {PLOTS.map((plot, k) => (
                <g
                  key={plot.name}
                  ref={(el) => {
                    plots.current[k] = el;
                  }}
                  stroke={plot.ink}
                  visibility={k === 0 ? "visible" : "hidden"}
                >
                  {plot.strokes.map((d, i) => (
                    <path
                      key={i}
                      ref={(el) => {
                        inks.current[k][i] = el;
                      }}
                      d={d}
                      style={{ strokeOpacity: 0 }}
                    />
                  ))}
                </g>
              ))}
            </g>
          </g>
        </svg>
      </div>

      {/* ── the gantry: a leg on each rail, and the beam across ── */}
      <svg ref={gantry} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: start }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 44, from: 0.3, span: 0.14 }} style={drawn(0.28, 0.38)}>
          <g filter="url(#desk-card)">
            <Block x0={-194} x1={-174} y0={GANTRY.y0} y1={GANTRY.y1} z={GANTRY.z} h={GANTRY.top - GANTRY.z} tone={TONES.paper} r={6} />
            <Block x0={-180} x1={180} y0={GANTRY.beamY0} y1={GANTRY.beamY1} z={GANTRY.beamZ} h={14} tone={TONES.sienna} r={6} />
            <Block x0={174} x1={194} y0={GANTRY.y0} y1={GANTRY.y1} z={GANTRY.z} h={GANTRY.top - GANTRY.z} tone={TONES.paper} r={6} />
          </g>
          {/* the carriage's track along the beam, and a maker's plate on the near leg */}
          <Detail d={line(at(-170, GANTRY.beamY1, GANTRY.beamZ + 7), at(170, GANTRY.beamY1, GANTRY.beamZ + 7))} width={1} />
          <Detail d={rounded(sideFace(194, GANTRY.y0 + 5, GANTRY.y1 - 5, 44, 70), 3)} fill="#e3e5e0" />
          {Array.from({ length: 3 }, (_, i) => (
            <Detail key={i} d={line(at(194, GANTRY.y0 + 9, 50 + i * 7), at(194, GANTRY.y1 - 9, 50 + i * 7))} width={1} />
          ))}
        </Part>
      </svg>

      {/* ── the pen, hanging from the carriage ── */}
      <svg ref={pen} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: startPen }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 40, from: 0.56, span: 0.07, fall: true }} style={drawn(0.54, 0.58, 0.05)}>
          <g filter="url(#desk-chip)">
            <Block x0={PX - PEN.half} x1={PX + PEN.half} y0={PY - PEN.half} y1={PY + PEN.half} z={SHEET_TOP + PEN.tip} h={PEN.body} tone={DARK} r={2} width={1} />
          </g>
          <Detail
            d={poly(at(PX, PY, SHEET_TOP), at(PX - PEN.half, PY + PEN.half, SHEET_TOP + PEN.tip), at(PX + PEN.half, PY + PEN.half, SHEET_TOP + PEN.tip), at(PX + PEN.half, PY - PEN.half, SHEET_TOP + PEN.tip))}
            fill="#5e625c"
            width={1}
          />
          {/* a band in the pen's own ink, just below the carriage */}
          <path
            ref={cap}
            d={poly(
              at(PX - PEN.half, PY + PEN.half, SHEET_TOP + 17),
              at(PX + PEN.half, PY + PEN.half, SHEET_TOP + 17),
              at(PX + PEN.half, PY - PEN.half, SHEET_TOP + 17),
              at(PX + PEN.half, PY - PEN.half, SHEET_TOP + 21),
              at(PX + PEN.half, PY + PEN.half, SHEET_TOP + 21),
              at(PX - PEN.half, PY + PEN.half, SHEET_TOP + 21),
            )}
            fill={PLOTS[0].ink}
            className={deskStyles.fill}
          />
        </Part>
      </svg>

      {/* ── the carriage, running along the front of the beam ── */}
      <svg ref={carriage} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: startAt }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 50, from: 0.46, span: 0.08, fall: true }} style={drawn(0.44, 0.5, 0.06)}>
          <g filter="url(#desk-card)">
            <Block x0={PX - CARRIAGE.half} x1={PX + CARRIAGE.half} y0={PY - CARRIAGE.depth} y1={PY + CARRIAGE.depth} z={CARRIAGE.z} h={CARRIAGE.h} tone={SIENNA} r={6} />
          </g>
          <Detail d={rounded(frontFace(PX - 10, PX + 10, CARRIAGE.z + 10, CARRIAGE.z + 30, PY + CARRIAGE.depth), 3)} fill="#f5dfd5" />
          <circle ref={busy} cx={at(PX, PY + CARRIAGE.depth, CARRIAGE.z + 20)[0]} cy={at(PX, PY + CARRIAGE.depth, CARRIAGE.z + 20)[1]} r={2.4} className={styles.busy} />
          <Detail d={rounded(topFace(PX - 6, PX + 6, PY - 6, PY + 6, CARRIAGE.z + CARRIAGE.h), 3)} fill="#bc4e26" />
        </Part>
      </svg>

      {/* ── the display: which drawing, and how far along ── */}
      <svg viewBox={VIEW} className={layer} aria-hidden="true" focusable="false">
        <g className={deskStyles.fade} style={between(0.8, 0.06)}>
          <text ref={readout} transform={onFront(at(-172, BASE.y1, 14))} y={2} fontSize={6} fontWeight={700} letterSpacing={0.4} fill="#cbd7bd">
            {`PLOT 1/${PLOTS.length} · ${PLOTS[0].name}`}
          </text>
          <g transform={onFront(at(-172, BASE.y1, 8.5))}>
            <rect x={0} y={0} width={98} height={2.2} rx={1} fill="#5e625c" />
            <rect ref={bar} x={0} y={0} width={0} height={2.2} rx={1} fill="#9caf88" />
          </g>
        </g>
      </svg>

      {/* the same, for the keyboard: its click reaches the machine's own */}
      {built && (
        <button type="button" className="sketch-chip sr-only absolute bottom-0 left-0 focus:not-sr-only">
          Plot the next drawing
        </button>
      )}
    </div>
  );
}

