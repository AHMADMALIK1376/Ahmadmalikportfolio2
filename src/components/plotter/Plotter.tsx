"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import deskStyles from "@/components/desk/Desk.module.css";
import { between, Detail, drawn, EDGE, line, Part, poly, TONES, type Point, type Tone } from "@/components/desk/iso";
import { FORM, layout, type Box, type Field, type Input, type Letter, type Mark, type Spot } from "./hand";
import styles from "./Plotter.module.css";

/**
 * The contact section's pen plotter: a machine in the site's own hand — soft
 * blocks in paper and pastel with a wobbling edge and a hard shadow — with the
 * contact form printed on the sheet in it. The sheet is the form: its boxes
 * have real fields laid over them, invisible, so the visitor clicks a box on
 * the paper and types, and the pen writes each character into the box as it
 * is typed, like the keys of a typewriter.
 *
 * It builds itself when it comes into view (the base draws in, the gantry is
 * lowered onto its rails, the carriage and pen drop in, a sheet comes out of
 * the feed). Then every character typed is written straight away: the gantry
 * runs up and down the sheet, the carriage runs across it, and the pen goes
 * down, draws a stroke, lifts, and moves to the next, hurrying if it falls
 * behind; between keys it waits over the place the next character will go,
 * like a cursor. What is deleted fades off the page, and a word that no
 * longer fits its line is written again on the next. The name is signed again
 * after "yours,". When the letter is sent, the sheet is fed out of the front
 * and a fresh one comes in.
 *
 * It is seen straight on, from above and a little in front, so the sheet lies
 * flat and level and what is written on it reads straight across. It is drawn
 * in layers, one SVG over another in the same view box: the machine, the
 * sheet, the gantry, the pen, the carriage and the display. The moving ones are
 * moved by their CSS translate, so the browser slides them rather than
 * redrawing their wobbling edges every frame.
 */

// ── the view, and moving within it ──────────────────────────────────────
/**
 * How the scene is seen: straight on, from above and a little in front. A point lands on screen across at its x, and
 * down at its depth y drawn at K, less its height z; so a top face is a level rectangle, a little shorter than it is.
 */
const K = 0.76;
const P = (x: number, y: number, z: number): Point => [x, y * K - z];
const VB = { x: -206, y: -194, w: 420, h: 304 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
/** A shift on screen, in view box units, as a CSS translate of a layer the size of the view. */
const shift = (dx: number, dy: number) => `${((dx / VB.w) * 100).toFixed(3)}% ${((dy / VB.h) * 100).toFixed(3)}%`;

// ── the machine, in the scene's own units: x across, y towards the viewer, z up ──
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
const CARRIAGE = { half: 16, depth: 11, z: 58, h: 40 };
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
const DRAW_SPEED = 640; // sheet units a second, pen down
const TRAVEL_SPEED = 1700; // pen up
const PEN_MOVE = 30; // ms to lift or lower the pen
/** How long the pen waits at the cursor for the next key before the gantry runs back off the page. */
const REST_AFTER = 1400;
const FEED_OUT = 750;
const FEED_IN = 850;
const FEED_OUT_BY = 230;
const FEED_IN_FROM = -250;
const FIELDS: Field[] = ["name", "email", "message", "sign"];
/** The sheet's top left corner, on the view: the form laid over it starts here. */
const SHEET_AT = P(PX, PY, SHEET_TOP);
/** Where the placeholder in each box says what to write. */
const HINTS: Record<Input, string> = { name: "Your name", email: "you@example.com", message: "Tell me about the project, the role, or the idea..." };
const SVG_NS = "http://www.w3.org/2000/svg";

/** The sheet is hidden above the feed slot, so it comes out of it. */
const SLOT_CLIP = `inset(${(((P(0, HOUSING.y1, SHEET_TOP)[1] - VB.y) / VB.h) * 100).toFixed(2)}% -60% -60% -60%)`;

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
/** The box being typed into, and where in it the cursor is. */
export type Aim = { field: Input; index: number } | null;

/**
 * A soft block standing on the machine, as it is seen here: its top a rounded rectangle, and its front the top swept
 * straight down, both edged in the cards' ink.
 */
function Slab({ x0, x1, y0, y1, z, h, tone, r = 8, width = 1.5 }: { x0: number; x1: number; y0: number; y1: number; z: number; h: number; tone: Tone; r?: number; width?: number }) {
  const [, t0] = P(x0, y0, z + h);
  const [, t1] = P(x0, y1, z + h);
  const [, b] = P(x0, y1, z);
  const round = Math.min(r, (x1 - x0) / 2, (b - t0) / 2);
  const top = Math.min(round, (t1 - t0) / 2);
  return (
    <>
      <rect x={x0} y={t0} width={x1 - x0} height={b - t0} rx={round} fill={tone.left} className={deskStyles.fill} />
      <rect x={x0} y={t0} width={x1 - x0} height={t1 - t0} rx={top} fill={tone.top} stroke={EDGE} strokeWidth={width * 0.8} pathLength={1} className={deskStyles.part} />
      <rect x={x0} y={t0} width={x1 - x0} height={b - t0} rx={round} fill="none" stroke={EDGE} strokeWidth={width} pathLength={1} className={deskStyles.part} />
    </>
  );
}

/** A rectangle on the front of something, which faces the viewer at depth y: from x0 to x1 across, and z0 to z1 up. */
const front = (x0: number, x1: number, z0: number, z1: number, y: number) => ({ x: x0, y: y * K - z1, width: x1 - x0, height: z1 - z0 });
/** A rectangle lying on a top face at height z. */
const flat = (x0: number, x1: number, y0: number, y1: number, z: number) => ({ x: x0, y: y0 * K - z, width: x1 - x0, height: (y1 - y0) * K });

/** A box printed on the form, and the soft shadow inside its top and left edges, as the site's fields have. */
function PrintedBox({ box, r = 7 }: { box: Box; r?: number }) {
  const { u0, u1, v0, v1 } = box;
  return (
    <>
      <rect x={u0} y={v0} width={u1 - u0} height={v1 - v0} rx={r} fill="#f7f7f3" stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />
      <path d={`M${u0 + 1.6} ${v1 - r}V${v0 + r}Q${u0 + 1.6} ${v0 + 1.6} ${u0 + r} ${v0 + 1.6}H${u1 - r}`} fill="none" stroke={INK} strokeOpacity={0.18} strokeWidth={2.2} strokeLinecap="round" />
    </>
  );
}

export default function Plotter({ letter, sent, aim, form, onPoke, className }: { letter: Letter; sent: number; aim: Aim; form?: ReactNode; onPoke?: () => void; className?: string }) {
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
  const aimed = useRef(aim);
  const engine = useRef<Engine | null>(null);
  const hints = useRef<Partial<Record<Input, SVGTextElement | null>>>({});
  const paper = useRef<HTMLDivElement>(null);
  /** How big the view is drawn: page pixels to a view box unit. The form over the sheet is scaled by it. */
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const size = () => setScale(el.clientWidth / VB.w);
    size();
    const watch = new ResizeObserver(size);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

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
      if (gantry.current) gantry.current.style.translate = shift(0, v * K);
      if (carriage.current) carriage.current.style.translate = shift(u, v * K);
      if (pen.current) pen.current.style.translate = shift(u, v * K - lift);
    };
    const feed = (by: number, opacity: number) => {
      if (!sheet.current) return;
      sheet.current.style.translate = shift(0, by * K);
      sheet.current.style.opacity = String(opacity);
    };
    const say = (text: string) => {
      if (readout.current) readout.current.textContent = text;
    };

    // what is on the sheet, part by part, and what is still to be written, in order
    const written: Record<Field, Written[]> = { name: [], email: [], message: [], sign: [] };
    let queue: Written[] = [];
    let spots: Record<Input, Spot[]> = { name: [], email: [], message: [] };
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
      const want = layout(latest.current);
      spots = want.spots;
      // the printed hint in a box goes once something is written in it
      (Object.keys(HINTS) as Input[]).forEach((field) => hints.current[field]?.style.setProperty("opacity", latest.current[field] ? "0" : "1"));
      for (const field of FIELDS) {
        const have = written[field];
        const next = want.marks[field];
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
        // between keys, the pen waits over where the next character will go, like a cursor
        const target = aimed.current;
        const spot = target && spots[target.field][Math.min(target.index, spots[target.field].length - 1)];
        if (spot && !hovering && idle < REST_AFTER) {
          hovering = false;
          const to: Point = [spot[0], spot[1] - 4];
          return Math.hypot(to[0] - pos.u, to[1] - pos.v) > 0.8 ? { kind: "travel", to } : null;
        }
        // a pause in the typing, or nothing being typed into: the gantry runs back off the page, so the whole letter can be read
        if (!hovering && idle > (spot ? REST_AFTER : 900)) {
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
        paper.current?.style.setProperty("visibility", "hidden");
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
        paper.current?.style.removeProperty("visibility");
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

    // whatever has been typed already
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
  useEffect(() => {
    aimed.current = aim;
  }, [aim]);

  const layer = styles.layer;
  const start = shift(0, PARK[1] * K);
  const startAt = shift(PARK[0], PARK[1] * K);
  const startPen = shift(PARK[0], PARK[1] * K - LIFT);
  const busyAt = P(PX, PY + CARRIAGE.depth, CARRIAGE.z + 20);

  return (
    <div ref={stage} className={`${styles.stage} ${built ? styles.live : ""} ${className ?? ""}`} onClick={onPoke}>
      {/* ── the machine: the housing at the back with its feed slot and spare pens, the base, the bed and the rails ── */}
      <svg viewBox={VIEW} className={styles.base} aria-hidden="true" focusable="false">
        <g style={drawn(0.04, 0.14)} filter="url(#desk-card)">
          <Slab {...HOUSING} z={0} tone={TONES.paper} r={12} />
        </g>
        <g className={deskStyles.fade} style={between(0.14, 0.06)}>
          <rect {...front(-152, 152, 24.5, 28.5, HOUSING.y1)} rx={2} fill="#7c817a" />
          <text x={-184} y={HOUSING.y1 * K - 33} fontSize={7} fontWeight={700} letterSpacing={1.2} fill="#5e625c">
            MA-02 · PEN PLOTTER
          </text>
        </g>
        <g style={drawn(0.2, 0.28)} filter="url(#desk-chip)">
          <Slab x0={126} x1={190} y0={-156} y1={-134} z={HOUSING.h} h={8} tone={TONES.concrete} r={5} width={1.2} />
        </g>
        {SPARE_PENS.map((colour, j) => (
          <Part key={colour} arrival={{ lift: 36, from: 0.3 + j * 0.035, span: 0.06, fall: true }} style={drawn(0.28 + j * 0.035, 0.3 + j * 0.035, 0.05)}>
            <g filter="url(#desk-chip)">
              <Slab x0={141 + j * 24} x1={149 + j * 24} y0={-149} y1={-141} z={HOUSING.h + 8} h={18} tone={DARK} r={2} width={1} />
              <Slab x0={140.5 + j * 24} x1={149.5 + j * 24} y0={-149.5} y1={-140.5} z={HOUSING.h + 22} h={8} tone={{ top: colour, left: colour, right: colour }} r={2.5} width={1} />
            </g>
          </Part>
        ))}

        <g style={drawn(0, 0.1)} filter="url(#desk-card)">
          <Slab {...BASE} z={0} tone={SAGE} r={16} />
        </g>
        {/* on the front: the display, vents, the feed button and the power light */}
        <g style={drawn(0.08, 0.14)}>
          <Detail d={poly(P(-178, BASE.y1, 18), P(-58, BASE.y1, 18), P(-58, BASE.y1, 4), P(-178, BASE.y1, 4))} fill="#3b3d39" />
          {Array.from({ length: 8 }, (_, i) => (
            <Detail key={i} d={line(P(40 + i * 9, BASE.y1, 6), P(40 + i * 9, BASE.y1, 16))} width={1.4} />
          ))}
          <Detail d={poly(P(128, BASE.y1, 15), P(150, BASE.y1, 15), P(150, BASE.y1, 7), P(128, BASE.y1, 7))} fill="#d0714c" />
          <Detail d={poly(P(160, BASE.y1, 13), P(170, BASE.y1, 13), P(170, BASE.y1, 9), P(160, BASE.y1, 9))} fill="#80966b" />
        </g>
        <text x={131} y={BASE.y1 * K - 9.4} fontSize={4.6} fontWeight={700} fill="#f4f4f0" className={deskStyles.fade} style={between(0.12, 0.05)}>
          FEED
        </text>

        {/* the bed the sheet lies on, lowered in, with a scale along its near edge */}
        <Part arrival={{ lift: 18, from: 0.12, span: 0.1 }} style={drawn(0.1, 0.2)}>
          <g filter="url(#desk-ink)">
            <Slab {...BED} tone={TONES.concrete} r={10} width={1.3} />
          </g>
          {Array.from({ length: 15 }, (_, i) => (
            <Detail key={i} d={line(P(-140 + i * 20, BED.y1 - 3, BED.z + BED.h), P(-140 + i * 20, BED.y1 - (i % 5 ? 8 : 13), BED.z + BED.h))} width={1} />
          ))}
        </Part>

        {/* the rails the gantry runs on */}
        <g style={drawn(0.18, 0.26)} filter="url(#desk-chip)">
          <Slab x0={RAIL_X[0]} x1={RAIL_X[1]} y0={RAIL.y0} y1={RAIL.y1} z={RAIL.z} h={RAIL.h} tone={STEEL} r={4} width={1.2} />
          <Slab x0={RAIL_X[2]} x1={RAIL_X[3]} y0={RAIL.y0} y1={RAIL.y1} z={RAIL.z} h={RAIL.h} tone={STEEL} r={4} width={1.2} />
        </g>
        <g style={drawn(0.24, 0.3)}>
          <Detail d={line(P(-184, RAIL.y0 + 6, RAIL.z + RAIL.h), P(-184, RAIL.y1 - 6, RAIL.z + RAIL.h))} width={1} />
          <Detail d={line(P(184, RAIL.y0 + 6, RAIL.z + RAIL.h), P(184, RAIL.y1 - 6, RAIL.z + RAIL.h))} width={1} />
        </g>
      </svg>

      {/* ── the sheet, with the form printed on it and what is written on it; hidden above the slot as it comes out ── */}
      <div className={styles.slot} style={{ clipPath: SLOT_CLIP }}>
        <svg ref={sheet} viewBox={VIEW} className={`${layer} ${styles.moving}`} aria-hidden="true" focusable="false">
          <g className={deskStyles.fade} style={between(0.62, 0.08)}>
            <rect {...flat(PX, PX + 300, PY, PY + 200, SHEET_Z)} rx={3} fill="#2d2f2b" fillOpacity={0.16} transform="translate(3 3)" />
            <Slab x0={PX} x1={PX + 300} y0={PY} y1={PY + 200} z={SHEET_Z} h={1.5} tone={SHEET} r={3} width={1.1} />
            <g transform={`translate(${PX} ${(PY * K - SHEET_TOP).toFixed(2)}) scale(1 ${K})`}>
              {/* the form, printed: its labels, its boxes with what to write in them, "yours," and the send button */}
              <g fontWeight={700} fill={INK}>
                <text x={FORM.name.u0 + 1} y={FORM.name.v0 - 5} fontSize={6.4} letterSpacing={1.4}>
                  NAME
                </text>
                <text x={FORM.email.u0 + 1} y={FORM.email.v0 - 5} fontSize={6.4} letterSpacing={1.4}>
                  EMAIL
                </text>
                <text x={FORM.message.u0 + 1} y={FORM.message.v0 - 5} fontSize={6.4} letterSpacing={1.4}>
                  MESSAGE
                </text>
                <text x={FORM.message.u1} y={FORM.message.v0 - 5} fontSize={5.2} fontWeight={400} textAnchor="end" fill="#5e625c">
                  10+ characters
                </text>
              </g>
              <g filter="url(#desk-ink)">
                <PrintedBox box={FORM.name} />
                <PrintedBox box={FORM.email} />
                <PrintedBox box={FORM.message} r={9} />
              </g>
              {(Object.keys(HINTS) as Input[]).map((field) => (
                <text
                  key={field}
                  ref={(el) => {
                    hints.current[field] = el;
                  }}
                  x={FORM[field].u0 + 7}
                  y={FORM[field].v0 + 14.5}
                  fontSize={6.6}
                  fill="#9a9f98"
                  style={{ transition: "opacity 0.2s ease" }}
                >
                  {HINTS[field]}
                </text>
              ))}
              <text x={FORM.yours.u} y={FORM.yours.v} fontSize={7.2} fontWeight={700} fill="#5e625c">
                — yours,
              </text>
              <g filter="url(#desk-chip)">
                <rect x={FORM.send.u0} y={FORM.send.v0} width={FORM.send.u1 - FORM.send.u0} height={FORM.send.v1 - FORM.send.v0} rx={9} fill="#cbd7bd" stroke={INK} strokeOpacity={0.55} strokeWidth={1} />
              </g>
              <text x={(FORM.send.u0 + FORM.send.u1) / 2} y={FORM.send.v0 + 13.8} fontSize={7.2} fontWeight={700} letterSpacing={1.2} textAnchor="middle" fill={INK}>
                SEND IT →
              </text>
              {/* the writing, added a stroke at a time as it is written */}
              <g ref={ink} fill="none" stroke={INK} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        </svg>
      </div>

      {/* ── the gantry: its beam across, and a leg on each rail in front of it ── */}
      <svg ref={gantry} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: start }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 44, from: 0.3, span: 0.14 }} style={drawn(0.28, 0.38)}>
          <g filter="url(#desk-card)">
            <Slab x0={-180} x1={180} y0={GANTRY.beamY0} y1={GANTRY.beamY1} z={GANTRY.beamZ} h={14} tone={TONES.sienna} r={6} />
          </g>
          <Detail d={line(P(-170, GANTRY.beamY1, GANTRY.beamZ + 7), P(170, GANTRY.beamY1, GANTRY.beamZ + 7))} width={1} />
          <g filter="url(#desk-card)">
            <Slab x0={-194} x1={-174} y0={GANTRY.y0} y1={GANTRY.y1} z={GANTRY.z} h={GANTRY.top - GANTRY.z} tone={TONES.paper} r={6} />
            <Slab x0={174} x1={194} y0={GANTRY.y0} y1={GANTRY.y1} z={GANTRY.z} h={GANTRY.top - GANTRY.z} tone={TONES.paper} r={6} />
          </g>
          {/* a plate on the right leg */}
          <Detail d={poly(P(178, GANTRY.y1, 72), P(190, GANTRY.y1, 72), P(190, GANTRY.y1, 44), P(178, GANTRY.y1, 44))} fill="#e3e5e0" />
          {Array.from({ length: 3 }, (_, i) => (
            <Detail key={i} d={line(P(181, GANTRY.y1, 50 + i * 8), P(187, GANTRY.y1, 50 + i * 8))} width={1} />
          ))}
        </Part>
      </svg>

      {/* ── the pen, hanging from the carriage ── */}
      <svg ref={pen} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: startPen }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 40, from: 0.56, span: 0.07, fall: true }} style={drawn(0.54, 0.58, 0.05)}>
          <g filter="url(#desk-chip)">
            <Slab x0={PX - PEN.half} x1={PX + PEN.half} y0={PY - PEN.half} y1={PY + PEN.half} z={SHEET_TOP + PEN.tip} h={PEN.body} tone={DARK} r={2} width={1} />
          </g>
          <Detail d={poly(P(PX, PY, SHEET_TOP), P(PX - PEN.half, PY + PEN.half, SHEET_TOP + PEN.tip), P(PX + PEN.half, PY + PEN.half, SHEET_TOP + PEN.tip))} fill="#5e625c" width={1} />
          <rect {...front(PX - PEN.half, PX + PEN.half, SHEET_TOP + 17, SHEET_TOP + 21, PY + PEN.half)} fill={INK} className={deskStyles.fill} />
        </Part>
      </svg>

      {/* ── the carriage, running along the front of the beam ── */}
      <svg ref={carriage} viewBox={VIEW} className={`${layer} ${styles.moving}`} style={{ translate: startAt }} aria-hidden="true" focusable="false">
        <Part arrival={{ lift: 50, from: 0.46, span: 0.08, fall: true }} style={drawn(0.44, 0.5, 0.06)}>
          <g filter="url(#desk-card)">
            <Slab x0={PX - CARRIAGE.half} x1={PX + CARRIAGE.half} y0={PY - CARRIAGE.depth} y1={PY + CARRIAGE.depth} z={CARRIAGE.z} h={CARRIAGE.h} tone={SIENNA} r={6} />
          </g>
          <rect {...front(PX - 10, PX + 10, CARRIAGE.z + 8, CARRIAGE.z + 30, PY + CARRIAGE.depth)} rx={3} fill="#f5dfd5" stroke={EDGE} strokeWidth={1.1} className={deskStyles.fill} />
          <circle ref={busy} cx={busyAt[0]} cy={busyAt[1]} r={2.6} className={styles.busy} />
          <rect {...flat(PX - 6, PX + 6, PY - 6, PY + 6, CARRIAGE.z + CARRIAGE.h)} rx={3} fill="#bc4e26" className={deskStyles.fill} />
        </Part>
      </svg>

      {/* ── the display: what it is doing, and how much of the letter is written ── */}
      <svg viewBox={VIEW} className={layer} aria-hidden="true" focusable="false">
        <g className={deskStyles.fade} style={between(0.8, 0.06)}>
          <text ref={readout} x={-172} y={BASE.y1 * K - 11} fontSize={6} fontWeight={700} letterSpacing={0.6} fill="#cbd7bd">
            READY
          </text>
          <rect x={-172} y={BASE.y1 * K - 8.5} width={98} height={2.2} rx={1} fill="#5e625c" />
          <rect ref={bar} x={-172} y={BASE.y1 * K - 8.5} width={0} height={2.2} rx={1} fill="#9caf88" />
        </g>
      </svg>

      {/* ── the form itself, laid over the sheet at the sheet's own foreshortening: real fields over the printed boxes ── */}
      {form && (
        <div ref={paper} className={styles.paper} style={{ width: VB.w, height: VB.h, "--k": scale } as CSSProperties}>
          <div className={styles.sheetForm} style={{ left: SHEET_AT[0] - VB.x, top: SHEET_AT[1] - VB.y, transform: `scale(1, ${K})` }}>
            {form}
          </div>
        </div>
      )}
    </div>
  );
}
