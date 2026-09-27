"use client";

import { useEffect, useRef, useState } from "react";
import deskStyles from "@/components/desk/Desk.module.css";
import { at, between, Block, COS, Detail, drawn, frontFace, line, onFront, onTop, Part, poly, rounded, sideFace, topFace, TONES, type Point, type Tone } from "@/components/desk/iso";
import { layout, MARGIN, RULES, type Field, type Letter, type Mark } from "./hand";
import styles from "./Plotter.module.css";

/**
 * The contact section's pen plotter: a machine in the site's own hand — soft
 * blocks in paper and pastel with a wobbling edge and a hard shadow — with a
 * sheet of ruled notebook paper in it, which writes out the visitor's letter
 * as they type it into the form.
 *
 * It builds itself when it comes into view (the base draws in, the gantry is
 * lowered onto its rails, the carriage and pen drop in, a sheet comes out of
 * the feed) and writes "Dear Ahmad," at the top. Then every character typed is
 * written in its turn: the gantry runs up and down the sheet, the carriage runs
 * across it, and the pen goes down, draws a stroke, lifts, and moves to the
 * next, hurrying when it falls behind. What is deleted fades off the page, and
 * a word that no longer fits its line is written again on the next. When the
 * letter is sent, the sheet is fed out of the front and a fresh one comes in.
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
/** Where the pen waits, at the back of the sheet. */
const PARK: Point = [150, 6];

const SAGE: Tone = { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" };
const SHEET: Tone = { top: "#fbfbf8", left: "#eceee9", right: "#e3e5e0" };
const STEEL: Tone = { top: "#b8bcb5", left: "#9a9f98", right: "#7c817a" };
const SIENNA: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const DARK: Tone = TONES.dark;
const INK = "#2d2f2b";
/** The other pens, waiting in the holder at the back. */
const SPARE_PENS = ["#9c3f1d", "#4c5e3e"];

// ── the opening, in progress from 0 to 1 ───────────────────────────────
const INTRO = 3000;

// ── the writing, in real time ───────────────────────────────────────────
const DRAW_SPEED = 260; // sheet units a second, pen down
const TRAVEL_SPEED = 800; // pen up
const PEN_MOVE = 55; // ms to lift or lower the pen
const FEED_OUT = 750;
const FEED_IN = 850;
const FEED_OUT_BY = 230;
const FEED_IN_FROM = -250;
const FIELDS: Field[] = ["greeting", "message", "sign", "email"];
const SVG_NS = "http://www.w3.org/2000/svg";

/** Everything in front of the feed slot, on the sheet's plane: the sheet is hidden behind it as it comes out. */
const SLOT_CLIP = (() => {
  const corners = [at(-700, BASE.y0, SHEET_TOP), at(700, BASE.y0, SHEET_TOP), at(700, 900, SHEET_TOP), at(-700, 900, SHEET_TOP)];
  return `polygon(${corners.map(([x, y]) => `${(((x - VB.x) / VB.w) * 100).toFixed(2)}% ${(((y - VB.y) / VB.h) * 100).toFixed(2)}%`).join(", ")})`;
})();

const smooth = (k: number) => k * k * (3 - 2 * k);

/** A character on the sheet: its strokes, how long each is, and how many are written. */
type Written = { key: string; paths: SVGPathElement[]; lengths: number[]; done: number; gone: boolean };
type Step =
  | { kind: "travel"; to: Point }
  | { kind: "pen"; down: boolean }
  | { kind: "draw"; mark: Written; stroke: number }
  | { kind: "hold"; ms: number }
  | { kind: "feedOut" }
  | { kind: "feedIn" };

type Engine = { sync: () => void; send: () => void };

export default function Plotter({ letter, sent, onPoke, className }: { letter: Letter; sent: number; onPoke?: () => void; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [built, setBuilt] = useState(false);
  const sheet = useRef<SVGSVGElement>(null);
  const gantry = useRef<SVGSVGElement>(null);
  const pen = useRef<SVGSVGElement>(null);
  const carriage = useRef<SVGSVGElement>(null);
  const ink = useRef<SVGGElement>(null);
  const readout = useRef<SVGTextElement>(null);
  const bar = useRef<SVGRectElement>(null);
  const busy = useRef<SVGCircleElement>(null);
  const latest = useRef(letter);
  const engine = useRef<Engine | null>(null);

  // it builds itself the first time it comes into view
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const watch = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.3 });
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el || !visible) return;
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : INTRO;
    let start = -1;
    let frame = 0;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const p = length ? Math.min(1, (now - start) / length) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setBuilt(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  // the writing
  useEffect(() => {
    const group = ink.current;
    if (!built || !group) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const say = (text: string) => {
      if (readout.current) readout.current.textContent = text;
    };

    // what is on the sheet, part by part, and what is still to be written, in order
    const written: Record<Field, Written[]> = { greeting: [], message: [], sign: [], email: [] };
    let queue: Written[] = [];
    let greeted = false;
    let frozen = false;

    const show = (mark: Written, stroke: number, done: number) => {
      const path = mark.paths[stroke];
      path.style.opacity = done > 0 ? "1" : "0";
      path.style.strokeDashoffset = (mark.lengths[stroke] * (1 - done)).toFixed(2);
    };
    const make = (mark: Mark): Written => {
      const paths = mark.strokes.map((d) => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        group.appendChild(path);
        return path;
      });
      const lengths = paths.map((p) => p.getTotalLength());
      paths.forEach((path, i) => {
        path.style.strokeDasharray = `${lengths[i].toFixed(2)} ${(lengths[i] + 2).toFixed(2)}`;
        path.style.strokeDashoffset = lengths[i].toFixed(2);
        path.style.opacity = "0";
      });
      return { key: mark.key, paths, lengths, done: 0, gone: false };
    };
    const erase = (mark: Written) => {
      mark.gone = true;
      for (const path of mark.paths) {
        path.style.transition = "opacity 0.25s ease";
        path.style.opacity = "0";
        window.setTimeout(() => path.remove(), 300);
      }
    };
    const progress = () => {
      const all = FIELDS.flatMap((f) => written[f]);
      const done = all.filter((m) => m.done === m.paths.length).length;
      if (bar.current) bar.current.setAttribute("width", (all.length ? (98 * done) / all.length : 0).toFixed(1));
    };
    /** Writes everything still waiting, at once. */
    const flush = () => {
      for (const mark of queue) {
        mark.paths.forEach((_, i) => show(mark, i, 1));
        mark.done = mark.paths.length;
      }
      queue = [];
      progress();
    };

    /** Brings the sheet into line with the letter: whatever changed is rubbed out, and written again. */
    const sync = () => {
      if (frozen) return;
      const want = layout(latest.current, greeted);
      for (const field of FIELDS) {
        const have = written[field];
        const next = want[field];
        let same = 0;
        while (same < have.length && same < next.length && have[same].key === next[same].key) same++;
        if (same === have.length && same === next.length) continue;
        have.slice(same).forEach(erase);
        const added = next.slice(same).map(make);
        written[field] = [...have.slice(0, same), ...added];
        queue.push(...added);
      }
      queue = queue.filter((m) => !m.gone);
      if (reduced) flush();
      else if (queue.length) say("WRITING");
      progress();
    };

    // the steps the machine takes: planned one at a time, from where it is and what is left to write
    let script: Step[] = [];
    let step: Step | null = null;
    let t = 0;
    let length = 0;
    let from = { ...pos };
    let idle = 0;
    let hovering = false;

    const boost = () => 1 + Math.min(queue.length, 60) / 4;
    const plan = (): Step | null => {
      const scripted = script.shift();
      if (scripted) return scripted;
      const mark = queue[0];
      if (!mark) {
        if (pos.lift < LIFT) return { kind: "pen", down: false };
        // a pause in the typing: the gantry runs back off the page, so the whole letter can be read
        if (!hovering && idle > 900) {
          hovering = true;
          return { kind: "travel", to: [pos.u, PARK[1]] };
        }
        return null;
      }
      hovering = false;
      const start = mark.paths[mark.done].getPointAtLength(0);
      const there = Math.hypot(start.x - pos.u, start.y - pos.v) < 0.6;
      if (!there) return pos.lift < LIFT ? { kind: "pen", down: false } : { kind: "travel", to: [start.x, start.y] };
      if (pos.lift > 0) return { kind: "pen", down: true };
      return { kind: "draw", mark, stroke: mark.done };
    };

    const begin = (next: Step) => {
      step = next;
      from = { ...pos };
      t = 0;
      const speed = boost();
      if (next.kind === "travel") {
        const distance = Math.hypot(next.to[0] - pos.u, next.to[1] - pos.v);
        length = distance < 0.5 ? 0 : Math.max(40, (distance / (TRAVEL_SPEED * speed)) * 1000);
      } else if (next.kind === "pen") length = PEN_MOVE / Math.sqrt(speed);
      else if (next.kind === "draw") {
        length = (next.mark.lengths[next.stroke] / (DRAW_SPEED * speed)) * 1000;
        say("WRITING");
      } else if (next.kind === "hold") length = next.ms;
      else if (next.kind === "feedOut") length = FEED_OUT;
      else length = FEED_IN;
    };

    const apply = (f: number) => {
      if (!step) return;
      if (step.kind === "travel") {
        const e = smooth(f);
        pos.u = from.u + (step.to[0] - from.u) * e;
        pos.v = from.v + (step.to[1] - from.v) * e;
      } else if (step.kind === "pen") {
        pos.lift = step.down ? LIFT * (1 - f) : LIFT * f;
      } else if (step.kind === "draw") {
        const path = step.mark.paths[step.stroke];
        const point = path.getPointAtLength(step.mark.lengths[step.stroke] * f);
        pos.u = point.x;
        pos.v = point.y;
        show(step.mark, step.stroke, f);
      } else if (step.kind === "feedOut") {
        const e = f * f;
        feed(FEED_OUT_BY * e, 1 - e);
      } else if (step.kind === "feedIn") {
        feed(FEED_IN_FROM * (1 - smooth(f)), 1);
      }
      put();
    };

    const finish = () => {
      if (!step) return;
      apply(1);
      if (step.kind === "draw") {
        const mark = step.mark;
        mark.done++;
        if (mark.done === mark.paths.length) {
          queue = queue.filter((m) => m !== mark);
          progress();
          if (!queue.length) say("READY");
        }
      } else if (step.kind === "feedOut") {
        // the old sheet is gone: a clean one waits in the feed
        FIELDS.forEach((f) => (written[f] = []));
        group.replaceChildren();
        feed(FEED_IN_FROM, 1);
        progress();
      } else if (step.kind === "feedIn") {
        frozen = false;
        say("SENT ✓");
        window.setTimeout(() => say(queue.length ? "WRITING" : "READY"), 2200);
        sync();
      }
      step = null;
    };

    const send = () => {
      if (frozen) return;
      frozen = true;
      flush();
      say("SENDING");
      if (reduced) {
        FIELDS.forEach((f) => (written[f] = []));
        group.replaceChildren();
        frozen = false;
        sync();
        return;
      }
      step = null;
      script = [{ kind: "pen", down: false }, { kind: "travel", to: PARK }, { kind: "hold", ms: 350 }, { kind: "feedOut" }, { kind: "feedIn" }];
    };

    engine.current = { sync, send };
    put();
    busy.current?.setAttribute("data-on", "");

    // "Dear Ahmad," first, then whatever has been typed already
    greeted = true;
    sync();

    if (reduced) {
      return () => {
        engine.current = null;
      };
    }

    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(60, now - last) : 16;
      last = now;
      let left = dt;
      // as many steps as the time covers: a fast writer is kept up with
      for (let guard = 0; guard < 400; guard++) {
        const current = step as Step | null;
        if (current && current.kind === "draw" && current.mark.gone) step = null;
        if (!step) {
          const next = plan();
          if (!next) {
            idle += left;
            break;
          }
          idle = 0;
          begin(next);
        }
        const need = length - t;
        if (left >= need) {
          left -= need;
          finish();
        } else {
          t += left;
          apply(length ? t / length : 1);
          break;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    // it only runs while it is on screen
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
      engine.current = null;
    };
  }, [built]);

  // every letter sent, and every change to the letter. A letter sent clears the form in the same moment, so the sending
  // comes first: the machine stops listening, and feeds out the page as it was
  useEffect(() => {
    if (sent) engine.current?.send();
  }, [sent]);
  useEffect(() => {
    latest.current = letter;
    engine.current?.sync();
  }, [letter]);

  const layer = styles.layer;
  const start = shift(-COS * PARK[1], PARK[1] / 2);
  const startAt = shift(COS * (PARK[0] - PARK[1]), (PARK[0] + PARK[1]) / 2);
  const startPen = shift(COS * (PARK[0] - PARK[1]), (PARK[0] + PARK[1]) / 2 - LIFT);

  return (
    <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""} ${className ?? ""}`} onClick={onPoke} aria-hidden="true">
      {/* ── the machine: base, feed, bed, rails, the spare pens in their holder ── */}
      <svg viewBox={VIEW} className={styles.base} focusable="false">
        <g style={drawn(0.04, 0.14)} filter="url(#desk-card)">
          <Block x0={HOUSING.x0} x1={HOUSING.x1} y0={HOUSING.y0} y1={HOUSING.y1} z={0} h={HOUSING.h} tone={TONES.paper} r={14} />
          {/* the slot the sheets come out of */}
          <Detail d={rounded(frontFace(-152, 152, 24.5, 28.5, HOUSING.y1), 2)} fill="#7c817a" width={1} />
        </g>
        <text transform={onFront(at(-176, HOUSING.y1, 38))} fontSize={8} fontWeight={700} letterSpacing={1.2} fill="#5e625c" className={deskStyles.fade} style={between(0.16, 0.05)}>
          MA-02 · PEN PLOTTER
        </text>

        <g style={drawn(0.2, 0.28)} filter="url(#desk-chip)">
          <Block x0={130} x1={186} y0={-154} y1={-136} z={HOUSING.h} h={8} tone={TONES.concrete} r={5} width={1.2} />
        </g>
        {SPARE_PENS.map((colour, j) => (
          <Part key={colour} arrival={{ lift: 36, from: 0.3 + j * 0.035, span: 0.06, fall: true }} style={drawn(0.28 + j * 0.035, 0.3 + j * 0.035, 0.05)}>
            <g filter="url(#desk-chip)">
              <Block x0={144 + j * 22} x1={151 + j * 22} y0={-148} y1={-141} z={HOUSING.h + 8} h={20} tone={DARK} r={2} width={1} />
              <Block x0={143.5 + j * 22} x1={151.5 + j * 22} y0={-148.5} y1={-140.5} z={HOUSING.h + 22} h={8} tone={{ top: colour, left: colour, right: colour }} r={2.5} width={1} />
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

      {/* ── the sheet: a page of the notebook, and what is written on it; hidden behind the slot as it comes out ── */}
      <div className={styles.slot} style={{ clipPath: SLOT_CLIP }}>
        <svg ref={sheet} viewBox={VIEW} className={`${layer} ${styles.moving}`} focusable="false">
          <g className={deskStyles.fade} style={between(0.62, 0.08)}>
            <path d={rounded(topFace(PX, PX + 300, PY, PY + 200, SHEET_Z), 3)} fill="#2d2f2b" fillOpacity={0.18} transform="translate(3 3)" />
            <Block x0={PX} x1={PX + 300} y0={PY} y1={PY + 200} z={SHEET_Z} h={1.5} tone={SHEET} r={3} width={1.1} />
            <g transform={onTop(at(PX, PY, SHEET_TOP))}>
              {/* the notebook's rules and its red margin */}
              <g stroke="#9a9f98" strokeOpacity={0.55} strokeWidth={0.8}>
                {RULES.map((v) => (
                  <path key={v} d={`M6 ${v + 1.6}H294`} />
                ))}
              </g>
              <path d={`M${MARGIN} 2V198`} stroke="#de9372" strokeWidth={0.9} />
              {/* the writing, added a stroke at a time as it is written */}
              <g ref={ink} fill="none" stroke={INK} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        </svg>
      </div>

      {/* ── the gantry: a leg on each rail, and the beam across ── */}
      <svg ref={gantry} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: start }} focusable="false">
        <Part arrival={{ lift: 44, from: 0.3, span: 0.14 }} style={drawn(0.28, 0.38)}>
          <g filter="url(#desk-card)">
            <Block x0={-194} x1={-174} y0={GANTRY.y0} y1={GANTRY.y1} z={GANTRY.z} h={GANTRY.top - GANTRY.z} tone={TONES.paper} r={6} />
            <Block x0={-180} x1={180} y0={GANTRY.beamY0} y1={GANTRY.beamY1} z={GANTRY.beamZ} h={14} tone={TONES.sienna} r={6} />
            <Block x0={174} x1={194} y0={GANTRY.y0} y1={GANTRY.y1} z={GANTRY.z} h={GANTRY.top - GANTRY.z} tone={TONES.paper} r={6} />
          </g>
          {/* the carriage's track along the beam, and a plate on the near leg */}
          <Detail d={line(at(-170, GANTRY.beamY1, GANTRY.beamZ + 7), at(170, GANTRY.beamY1, GANTRY.beamZ + 7))} width={1} />
          <Detail d={rounded(sideFace(194, GANTRY.y0 + 5, GANTRY.y1 - 5, 44, 70), 3)} fill="#e3e5e0" />
          {Array.from({ length: 3 }, (_, i) => (
            <Detail key={i} d={line(at(194, GANTRY.y0 + 9, 50 + i * 7), at(194, GANTRY.y1 - 9, 50 + i * 7))} width={1} />
          ))}
        </Part>
      </svg>

      {/* ── the pen, hanging from the carriage ── */}
      <svg ref={pen} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: startPen }} focusable="false">
        <Part arrival={{ lift: 40, from: 0.56, span: 0.07, fall: true }} style={drawn(0.54, 0.58, 0.05)}>
          <g filter="url(#desk-chip)">
            <Block x0={PX - PEN.half} x1={PX + PEN.half} y0={PY - PEN.half} y1={PY + PEN.half} z={SHEET_TOP + PEN.tip} h={PEN.body} tone={DARK} r={2} width={1} />
          </g>
          <Detail
            d={poly(at(PX, PY, SHEET_TOP), at(PX - PEN.half, PY + PEN.half, SHEET_TOP + PEN.tip), at(PX + PEN.half, PY + PEN.half, SHEET_TOP + PEN.tip), at(PX + PEN.half, PY - PEN.half, SHEET_TOP + PEN.tip))}
            fill="#5e625c"
            width={1}
          />
          <path
            d={poly(
              at(PX - PEN.half, PY + PEN.half, SHEET_TOP + 17),
              at(PX + PEN.half, PY + PEN.half, SHEET_TOP + 17),
              at(PX + PEN.half, PY - PEN.half, SHEET_TOP + 17),
              at(PX + PEN.half, PY - PEN.half, SHEET_TOP + 21),
              at(PX + PEN.half, PY + PEN.half, SHEET_TOP + 21),
              at(PX - PEN.half, PY + PEN.half, SHEET_TOP + 21),
            )}
            fill={INK}
            className={deskStyles.fill}
          />
        </Part>
      </svg>

      {/* ── the carriage, running along the front of the beam ── */}
      <svg ref={carriage} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: startAt }} focusable="false">
        <Part arrival={{ lift: 50, from: 0.46, span: 0.08, fall: true }} style={drawn(0.44, 0.5, 0.06)}>
          <g filter="url(#desk-card)">
            <Block x0={PX - CARRIAGE.half} x1={PX + CARRIAGE.half} y0={PY - CARRIAGE.depth} y1={PY + CARRIAGE.depth} z={CARRIAGE.z} h={CARRIAGE.h} tone={SIENNA} r={6} />
          </g>
          <Detail d={rounded(frontFace(PX - 10, PX + 10, CARRIAGE.z + 10, CARRIAGE.z + 30, PY + CARRIAGE.depth), 3)} fill="#f5dfd5" />
          <circle ref={busy} cx={at(PX, PY + CARRIAGE.depth, CARRIAGE.z + 20)[0]} cy={at(PX, PY + CARRIAGE.depth, CARRIAGE.z + 20)[1]} r={2.4} className={styles.busy} />
          <Detail d={rounded(topFace(PX - 6, PX + 6, PY - 6, PY + 6, CARRIAGE.z + CARRIAGE.h), 3)} fill="#bc4e26" />
        </Part>
      </svg>

      {/* ── the display: what it is doing, and how much of the letter is written ── */}
      <svg viewBox={VIEW} className={layer} focusable="false">
        <g className={deskStyles.fade} style={between(0.8, 0.06)}>
          <text ref={readout} transform={onFront(at(-172, BASE.y1, 14))} y={2} fontSize={6} fontWeight={700} letterSpacing={0.6} fill="#cbd7bd">
            READY
          </text>
          <g transform={onFront(at(-172, BASE.y1, 8.5))}>
            <rect x={0} y={0} width={98} height={2.2} rx={1} fill="#5e625c" />
            <rect ref={bar} x={0} y={0} width={0} height={2.2} rx={1} fill="#9caf88" />
          </g>
        </g>
      </svg>
    </div>
  );
}
