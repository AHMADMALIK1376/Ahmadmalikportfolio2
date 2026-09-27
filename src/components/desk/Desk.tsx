"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./Desk.module.css";
import Computer, { CHARACTER, KEYBOARD_PORT, MOUSE_PORT, POINTER_REST, RUN_BUTTON, SCREEN, type ComputerTiming } from "./Computer";
import Mouse, { MOUSE_CABLE_START, type MouseTiming } from "./Mouse";
import { at, bend, between, Box, COS, Detail, dot, drawn, INK, line, onFront, onTop, Part, poly, Wire, type Point, type Tone } from "./iso";
import { lineLength, PROGRAM, typedPart } from "./program";

/**
 * The desk in the hero: a mechanical keyboard printed with the stack Ahmad
 * works in, a mouse, and the old computer they are plugged into — sketched in
 * the sketchbook's own hand, and in its three inks.
 *
 * When the page opens it draws itself: the outlines go down stroke by stroke,
 * the colour goes in after them, the monitor is lowered onto the computer, the
 * keycaps drop onto the board one after another, and the screen comes on. From
 * then on code types itself onto the screen, scrolling as it goes, with a key
 * going down for every character; and every so often the mouse slides over its
 * pad, its pointer crosses the screen to click RUN, and its wheel scrolls.
 *
 * Once it is built a visitor can press the keys and the mouse buttons, switch
 * the computer off and on, and pull either cable out: without the keyboard the
 * typing stops, and without the mouse the pointer does.
 */

const CASE: Tone = { top: "#b1c29f", left: "#9caf88", right: "#80966b" };
const RIM = "#647a52";
const BOARD: Tone = { top: "#464943", left: "#383b36", right: "#2d2f2b" };
const CAP: Tone = { top: "#f4f4f0", left: "#dcded8", right: "#c4c8c1" };
const PLUG: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
// the colours a keycap's dish is printed in, in turn
const DISHES = ["#e2e9da", "#f5dfd5", "#e3e5e0", "#cbd7bd", "#f8ebe4", "#eef1ea"];

// ── the keys ────────────────────────────────────────────────────────────
const U = 40; // one key width
const ROWS: [label: string, width: number][][] = [
  [["Python", 1.25], ["TypeScript", 1.5], ["React", 1], ["Tailwind", 1.25], ["Vite", 1], ["HTML", 1], ["CSS", 1]],
  [["Node.js", 1.25], ["Express", 1.25], ["FastAPI", 1.5], ["JWT", 1], ["REST", 1], ["Java", 1], ["C++", 1]],
  [["Claude", 1.5], ["LLMs", 1], ["Vision", 1], ["PostgreSQL", 2], ["MongoDB", 1.5], ["Firebase", 1]],
  [["Docker", 1.25], ["AWS", 1], ["GCP", 1], ["FULL-STACK AI", 3.5], ["Playwright", 1.25]],
];

// back row first and left to right, which is also the order they must be painted in
const KEYS = ROWS.flatMap((row, r) => {
  let offset = 0;
  return row.map(([label, width]) => {
    const x0 = -160 + offset * U + 3;
    offset += width;
    const x1 = -160 + offset * U - 3;
    const y0 = -80 + r * U + 3;
    const y1 = y0 + U - 6;
    return { label, x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  });
});
const SPACE = KEYS.findIndex((key) => key.label === "FULL-STACK AI");

const BOARD_Z = 22;
const CAP_Z = 26;
const CAP_TOP = CAP_Z + 12;

// ── the opening, in progress from 0 to 1 ───────────────────────────────
/** How long the desk takes to draw itself, and how long it waits for the words to arrive first, in milliseconds. */
const INTRO = 4200;
const DELAY = 450;
const SHADOWS = between(0.02, 0.2);
const KEYBOARD = { case: 0, board: 0.08, lower: { from: 0.2, span: 0.1 } };
const COMPUTER: ComputerTiming = { unit: 0.05, monitor: 0.13, lower: 0.3, span: 0.14, on: 0.86 };
const MOUSE: MouseTiming = { draw: 0.04, lower: 0.26, span: 0.1 };
// the keycaps drop in a scattered order, as typing would, rather than row by row
const capAt = (i: number) => 0.36 + ((i * 11) % KEYS.length) * 0.011;
const CAP_FALL = 0.07;
const CABLES = drawn(0.7, 0.7, 0.14);
const LIGHTS_ON = 0.84;

// ── the typing, in real time ────────────────────────────────────────────
const KEYSTROKE = 55; // milliseconds a character
const END_OF_LINE = 260;
const KEY_DOWN = 90;
const SVG = "http://www.w3.org/2000/svg";

// ── the mouse, in real time: once a cycle it glides to RUN, clicks, moves into the code and scrolls ──
const MOUSE_CYCLE = 9000;
const RUN: Point = [RUN_BUTTON.u + RUN_BUTTON.w / 2, RUN_BUTTON.v + RUN_BUTTON.h / 2];
const REST: Point = [POINTER_REST.u, POINTER_REST.v];
const CODE: Point = [96, 66];
// each step: when it ends in the cycle, where the pointer goes, and whether the button is down or the wheel turning
const MOUSE_STEPS: { until: number; to: Point; down?: boolean; scroll?: boolean }[] = [
  { until: 3500, to: REST },
  { until: 4600, to: RUN },
  { until: 4650, to: RUN },
  { until: 4850, to: RUN, down: true },
  { until: 4950, to: RUN },
  { until: 6150, to: CODE },
  // a double click in the code, then a scroll
  { until: 6250, to: CODE, down: true },
  { until: 6350, to: CODE },
  { until: 6450, to: CODE, down: true },
  { until: 6550, to: CODE },
  { until: 7350, to: CODE, scroll: true },
  { until: MOUSE_CYCLE, to: REST },
];
// how far the mouse moves on its pad, in the scene, for each unit the pointer moves on the screen
const MOUSE_TRAVEL = 0.14;

/** Where the pointer is `ms` into the mouse's cycle, and what the mouse is doing. */
function mouseAt(ms: number) {
  let from = REST;
  let start = 0;
  for (const step of MOUSE_STEPS) {
    if (ms < step.until) {
      const u = (ms - start) / (step.until - start);
      const ease = u * u * (3 - 2 * u);
      const point: Point = [from[0] + (step.to[0] - from[0]) * ease, from[1] + (step.to[1] - from[1]) * ease];
      return { point, down: !!step.down, scroll: step.scroll ? u : -1 };
    }
    from = step.to;
    start = step.until;
  }
  return { point: REST, down: false, scroll: -1 };
}

type End = { x: number; y: number; z: number };

/**
 * A coiled cable from the back of the keyboard, across the gap, to `end`. Each point knows whether it is on the near
 * side of its turn, so the near half of every turn can be drawn over the far half.
 */
function coil(end: End) {
  const points = Array.from({ length: 321 }, (_, i) => {
    const t = i / 320;
    const x = 130 + (end.x - 130) * t;
    const y = -94 + (end.y - -94) * Math.sin((t * Math.PI) / 2);
    const loose = 1.5 + Math.sin(t * Math.PI) * 5; // tight at the ends, loose in the middle
    const turn = t * Math.PI * 2 * 16;
    const [dx, dz] = [Math.cos(turn) * loose, Math.sin(turn) * loose];
    // the viewer looks along (1, 1, 1), so an offset towards them has a positive dx + dz
    return { point: at(x + dx, y, 6 + t * (end.z - 6) + dz + Math.sin(t * Math.PI) * 5), near: dx + dz > 0 };
  });
  return {
    far: line(...points.map(({ point }) => point)),
    near: points.map(({ point, near }, i) => (near ? `${i && points[i - 1].near ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}` : "")).join(""),
  };
}
// the keyboard's plug, pushed into the computer's side, or pulled out and lying on the desk nearby
const KEYBOARD_PLUG = { in: { x: KEYBOARD_PORT.x + 10, y: KEYBOARD_PORT.y, z: KEYBOARD_PORT.z }, out: { x: KEYBOARD_PORT.x + 46, y: KEYBOARD_PORT.y + 18, z: 4 } };
const COILS = { in: coil(KEYBOARD_PLUG.in), out: coil(KEYBOARD_PLUG.out) };
// pulled out, the mouse's plug lies on the desk between the mouse and the computer, where the keyboard does not hide it
const MOUSE_PLUG_OUT = { x: MOUSE_PORT.x - 32, y: MOUSE_PORT.y + 34, z: 4 };
/**
 * The mouse's cable, from the front of the mouse back along the desk to the port on the front of the computer,
 * with the mouse moved (dx, dy) from its place: its end at the mouse goes with it, and the length nearest the
 * mouse follows part of the way, while the rest stays where it lies.
 */
const mouseCable = (dx: number, dy: number, pulled = false) =>
  bend(
    [
      at(MOUSE_CABLE_START.x + dx, MOUSE_CABLE_START.y + dy, MOUSE_CABLE_START.z),
      at(MOUSE_CABLE_START.x + dx * 0.6, -60 + dy * 0.6, 2),
      ...(pulled
        ? [at(MOUSE_PLUG_OUT.x, -96, 2), at(MOUSE_PLUG_OUT.x, MOUSE_PLUG_OUT.y + 10, MOUSE_PLUG_OUT.z)]
        : [at(MOUSE_PORT.x, -110, 2), at(MOUSE_PORT.x, MOUSE_PORT.y + 24, 2), at(MOUSE_PORT.x, MOUSE_PORT.y + 10, MOUSE_PORT.z)]),
    ],
    16,
  );

/** A shadow on the desk under something, drawn in pencil: the outline of its footprint, hatched, a little down and right. */
const shadow = (x0: number, x1: number, y0: number, y1: number) => poly(at(x0, y0, 0), at(x1, y0, 0), at(x1, y1, 0), at(x0, y1, 0));

export default function Desk({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const [built, setBuilt] = useState(false);
  // the computer's power: switched off, the screen goes dark and the typing and the mouse stop where they are
  const [powered, setPowered] = useState(true);
  const togglePower = () => setPowered((on) => !on);
  // the cables can be pulled out and pushed back in
  const [plugged, setPlugged] = useState({ keyboard: true, mouse: true });
  const pluggedNow = useRef(plugged);
  const togglePlug = (device: "keyboard" | "mouse") => setPlugged((now) => ({ ...now, [device]: !now[device] }));
  const mouseAway = useRef({ dx: 0, dy: 0 });
  const rows = useRef<(SVGTextElement | null)[]>([]);
  const caret = useRef<SVGRectElement | null>(null);
  const caps = useRef<(SVGGElement | null)[]>([]);
  const pointer = useRef<SVGGElement | null>(null);
  const run = useRef<SVGGElement | null>(null);
  const mouse = useRef<SVGGElement>(null);
  const mouseWire = useRef<SVGGElement>(null);
  const mouseButton = useRef<SVGGElement>(null);
  const wheel = useRef<SVGGElement>(null);
  // where the typing has got to, kept across pauses: lines finished, and characters into the next
  const cursor = useRef({ line: 0, character: 0 });

  // the opening: --p runs from 0 to 1, and every part of the drawing works out from it where it is
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : INTRO;
    const start = performance.now() + (length ? DELAY : 0);
    let frame = 0;
    const tick = (now: number) => {
      const p = length ? Math.min(1, Math.max(0, (now - start) / length)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setBuilt(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // the typing reads what is plugged in as it goes; when the mouse's plug moves, its cable is redrawn from wherever the mouse is
  useEffect(() => {
    pluggedNow.current = plugged;
    const { dx, dy } = mouseAway.current;
    const cable = mouseCable(dx, dy, !plugged.mouse);
    mouseWire.current?.querySelectorAll("path").forEach((path) => path.setAttribute("d", cable));
  }, [plugged]);

  useEffect(() => {
    const screen = rows.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const show = (row: number, tokens: (typeof PROGRAM)[number]) => {
      const el = screen[row];
      if (!el) return;
      el.replaceChildren(
        ...tokens.map((token) => {
          const span = document.createElementNS(SVG, "tspan");
          span.setAttribute("fill", token.colour);
          // SVG text collapses runs of spaces, which would flatten the indentation
          span.textContent = token.text.replaceAll(" ", " ");
          return span;
        }),
      );
    };

    // like an editor: the screen fills from the top, then scrolls to keep the line being typed at the bottom
    const paint = (full: boolean) => {
      const { line: current, character } = cursor.current;
      const top = Math.max(0, current - (SCREEN.rows - 1));
      const currentRow = current - top;
      for (let row = 0; row < SCREEN.rows; row++) {
        if (!full && row !== currentRow) continue;
        const index = top + row;
        if (index > current) show(row, []);
        else {
          const tokens = PROGRAM[index % PROGRAM.length];
          show(row, index === current ? typedPart(tokens, character) : tokens);
        }
      }
      caret.current?.setAttribute("x", String(SCREEN.pad + character * CHARACTER));
      caret.current?.setAttribute("y", String(SCREEN.firstBaseline + currentRow * SCREEN.lineHeight - 7));
    };

    if (reduced) {
      // no typing: the screen simply shows the first screenful
      cursor.current = { line: SCREEN.rows - 1, character: lineLength(PROGRAM[SCREEN.rows - 1]) };
      paint(true);
      return;
    }
    paint(true);
    if (!built || !powered) return;

    const pressed: { el: SVGGElement; up: number }[] = [];
    let frame = 0;
    let due = performance.now() + KEYSTROKE;
    const mouseStart = performance.now();
    let turned = 0;

    const moveMouse = (now: number) => {
      const { point, down, scroll } = mouseAt(Math.max(0, now - mouseStart) % MOUSE_CYCLE);
      pointer.current?.setAttribute("transform", `translate(${point[0].toFixed(1)} ${point[1].toFixed(1)})`);
      // the mouse on its pad follows the pointer: right on the screen is along x, down it is towards the viewer
      const dx = (point[0] - REST[0]) * MOUSE_TRAVEL;
      const dy = (point[1] - REST[1]) * MOUSE_TRAVEL;
      mouseAway.current = { dx, dy };
      mouse.current?.setAttribute("transform", `translate(${((dx - dy) * COS).toFixed(2)} ${((dx + dy) / 2).toFixed(2)})`);
      // and its cable is pulled along with it
      const cable = mouseCable(dx, dy);
      mouseWire.current?.querySelectorAll("path").forEach((path) => path.setAttribute("d", cable));
      mouseButton.current?.setAttribute("transform", down ? "translate(0 2.6)" : "");
      run.current?.toggleAttribute("data-lit", down);
      if (scroll >= 0) turned = scroll * 540;
      wheel.current?.setAttribute("transform", `rotate(${turned.toFixed(1)})`);
    };

    const press = (now: number, seed: number) => {
      const el = caps.current[seed % KEYS.length];
      if (!el) return;
      el.style.transform = "translateY(3px)";
      el.dataset.down = "";
      pressed.push({ el, up: now + KEY_DOWN });
    };

    // the mouse's cycle is timed from when it last moved, so pulling its plug out and back in carries on from there
    let mouseTime = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - last);
      last = now;
      if (pluggedNow.current.mouse) {
        mouseTime += elapsed;
        moveMouse(mouseStart + mouseTime);
      }
      while (pressed.length && pressed[0].up <= now) {
        const { el } = pressed.shift()!;
        el.style.transform = "";
        delete el.dataset.down;
      }
      if (!pluggedNow.current.keyboard) {
        due = now + KEYSTROKE;
      } else if (now >= due) {
        const state = cursor.current;
        const tokens = PROGRAM[state.line % PROGRAM.length];
        if (state.character < lineLength(tokens)) {
          state.character++;
          const typed = typedPart(tokens, state.character);
          const last = typed[typed.length - 1].text;
          if (last.at(-1) !== " ") press(now, last.charCodeAt(last.length - 1) + state.line);
          paint(false);
          due = now + KEYSTROKE * (0.6 + Math.random() * 0.8);
        } else {
          state.line++;
          state.character = 0;
          press(now, SPACE); // a new line: the big key
          paint(true);
          due = now + END_OF_LINE;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    // only type while the desk is on screen
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        due = performance.now() + KEYSTROKE;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    if (svg.current) watch.observe(svg.current);

    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      for (const { el } of pressed) {
        el.style.transform = "";
        delete el.dataset.down;
      }
    };
  }, [built, powered]);

  const unplugged = [...(plugged.keyboard ? [] : ["KEYBOARD"]), ...(plugged.mouse ? [] : ["MOUSE"])];

  return (
    <>
      <svg ref={svg} viewBox="36 -92 580 648" className={`${styles.desk} ${built ? styles.live : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
        <defs>
          {/* pencil shading, for faces turned away from the light and for shadows */}
          <pattern id="desk-hatch" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
            <path d="M0 0V4.5" stroke={INK} strokeOpacity="0.2" strokeWidth="1.1" />
          </pattern>
        </defs>

        {/* shadows on the desk, a little down and to the right of everything */}
        <g className={styles.fade} style={SHADOWS} transform="translate(10 7)">
          {[shadow(-255, 5, -270, -156), shadow(-174, 174, -94, 94), shadow(-266, -200, -27, 96)].map((d) => (
            <g key={d}>
              <path d={d} fill="#2d2f2b" fillOpacity={0.06} />
              <path d={d} fill="url(#desk-hatch)" />
            </g>
          ))}
        </g>

        <Computer
          timing={COMPUTER}
          rowRef={(row, el) => {
            rows.current[row] = el;
          }}
          caretRef={(el) => {
            caret.current = el;
          }}
          pointerRef={(el) => {
            pointer.current = el;
          }}
          runRef={(el) => {
            run.current = el;
          }}
          powered={powered}
          onPower={togglePower}
          unplugged={unplugged}
        />

        {/* the mouse's cable, and its plug, in the front of the computer or pulled out onto the desk; click either to pull it out or push it in */}
        <g style={CABLES} className={`${styles.hit} ${styles.plug}`} onClick={() => togglePlug("mouse")}>
          <g ref={mouseWire}>
            <Wire d={mouseCable(0, 0, !plugged.mouse)} width={2.4} />
          </g>
          {plugged.mouse ? (
            <g>
              <Box x0={MOUSE_PORT.x - 4} x1={MOUSE_PORT.x + 4} y0={MOUSE_PORT.y} y1={MOUSE_PORT.y + 10} z={MOUSE_PORT.z - 4} h={8} tone={PLUG} width={1} />
              <Detail d={line(at(MOUSE_PORT.x - 4, MOUSE_PORT.y + 10, MOUSE_PORT.z - 1), at(MOUSE_PORT.x + 4, MOUSE_PORT.y + 10, MOUSE_PORT.z - 1))} stroke={MOUSE_PORT.colour} width={1.6} />
            </g>
          ) : (
            <Box x0={MOUSE_PLUG_OUT.x - 4} x1={MOUSE_PLUG_OUT.x + 4} y0={MOUSE_PLUG_OUT.y} y1={MOUSE_PLUG_OUT.y + 10} z={0} h={8} tone={PLUG} width={1} />
          )}
          <circle cx={at(MOUSE_PORT.x, MOUSE_PORT.y + 10, MOUSE_PORT.z)[0]} cy={at(MOUSE_PORT.x, MOUSE_PORT.y + 10, MOUSE_PORT.z)[1]} r={16} fill="transparent" />
        </g>

        {/* the mouse, to the left of the keyboard and further back along its side, so drawn before it */}
        <Mouse timing={MOUSE} bodyRef={mouse} buttonRef={mouseButton} wheelRef={wheel} />

        {/* ── the keyboard's case, its coiled cable, a name plate and three status lights ── */}
        <g style={drawn(KEYBOARD.case, KEYBOARD.case + 0.1)}>
          <g style={CABLES}>
            <Box x0={122} x1={138} y0={-102} y1={-94} z={2} h={10} tone={PLUG} width={1} />
            <g className={`${styles.hit} ${styles.plug}`} onClick={() => togglePlug("keyboard")}>
              {/* the far half of every turn, in shadow, then the near half over it in the light */}
              <Wire d={COILS[plugged.keyboard ? "in" : "out"].far} width={2.8} colour="#242623" light="#333532" />
              <Wire d={COILS[plugged.keyboard ? "in" : "out"].near} width={2.8} colour="#5e625c" light="#b8bcb5" />
              {plugged.keyboard ? (
                <g>
                  <Box x0={KEYBOARD_PORT.x} x1={KEYBOARD_PORT.x + 10} y0={KEYBOARD_PORT.y - 4} y1={KEYBOARD_PORT.y + 4} z={KEYBOARD_PORT.z - 4} h={8} tone={PLUG} width={1} />
                  <Detail d={line(at(KEYBOARD_PORT.x + 10, KEYBOARD_PORT.y + 4, KEYBOARD_PORT.z - 1), at(KEYBOARD_PORT.x + 10, KEYBOARD_PORT.y - 4, KEYBOARD_PORT.z - 1))} stroke={KEYBOARD_PORT.colour} width={1.6} />
                </g>
              ) : (
                <Box x0={KEYBOARD_PLUG.out.x - 10} x1={KEYBOARD_PLUG.out.x} y0={KEYBOARD_PLUG.out.y - 4} y1={KEYBOARD_PLUG.out.y + 4} z={0} h={8} tone={PLUG} width={1} />
              )}
              <circle cx={at(KEYBOARD_PLUG.in.x, KEYBOARD_PLUG.in.y, KEYBOARD_PLUG.in.z)[0]} cy={at(KEYBOARD_PLUG.in.x, KEYBOARD_PLUG.in.y, KEYBOARD_PLUG.in.z)[1]} r={16} fill="transparent" />
            </g>
          </g>
          <Box x0={-174} x1={174} y0={-94} y1={94} z={0} h={BOARD_Z} tone={CASE} hatch />
          <Detail d={poly(at(-166, -86, BOARD_Z), at(166, -86, BOARD_Z), at(166, 86, BOARD_Z), at(-166, 86, BOARD_Z))} stroke={RIM} />
          <Detail d={poly(at(-150, 94, 5), at(-96, 94, 5), at(-96, 94, 17), at(-150, 94, 17))} fill={INK} />
          <text transform={onFront(at(-123, 94, 11))} y={2.6} textAnchor="middle" fontSize={7.5} fontWeight={700} letterSpacing={1} fill="#f4f4f0" className={styles.fade} style={between(0.14, 0.05)}>
            MA-01
          </text>
          {["#d0714c", "#e6e8e3", "#9caf88"].map((colour, i) => (
            <Detail key={colour} d={dot(at(112 + i * 16, -90, BOARD_Z), 2.6)} fill={colour} width={0.9} style={{ "--fs": LIGHTS_ON + i * 0.02, "--fl": 0.02 } as CSSProperties} />
          ))}
        </g>

        {/* ── the board, lowered into the case: dark concrete, with sienna traces and its screws ── */}
        <Part arrival={{ lift: 20, ...KEYBOARD.lower }} style={drawn(KEYBOARD.board, KEYBOARD.board + 0.1)}>
          <Box x0={-164} x1={164} y0={-84} y1={84} z={BOARD_Z} h={4} tone={BOARD} />
          <Detail d={[0, 1, 2, 3].map((r) => line(at(-150, -60 + r * U, BOARD_Z + 4), at(150, -60 + r * U, BOARD_Z + 4))).join("")} stroke="#d0714c" width={1.2} />
          <Detail d={[-156, 156].flatMap((x) => [-76, 76].map((y) => dot(at(x, y, BOARD_Z + 4), 2.6))).join("")} fill="#9a9f98" width={0.8} />
        </Part>

        {/* ── the keycaps, each dropped onto the board in its turn ── */}
        {KEYS.map((key, i) => {
          const inset = 4;
          const legend = Math.min(8.6, (key.x1 - key.x0 - 8) / (key.label.length * 0.6));
          const dish = poly(
            at(key.x0 + inset, key.y0 + inset, CAP_TOP),
            at(key.x1 - inset, key.y0 + inset, CAP_TOP),
            at(key.x1 - inset, key.y1 - inset, CAP_TOP),
            at(key.x0 + inset, key.y1 - inset, CAP_TOP),
          );
          const start = capAt(i);
          return (
            <Part
              key={key.label}
              arrival={{ lift: 30, from: start, span: CAP_FALL, fall: true }}
              className={`${styles.hit} ${styles.key}`}
              style={drawn(start - 0.02, start + 0.02, 0.05)}
            >
              {/* pressed by the typing, which moves this inner group */}
              <g
                ref={(el) => {
                  caps.current[i] = el;
                }}
                className={styles.cap}
              >
                <Box x0={key.x0} x1={key.x1} y0={key.y0} y1={key.y1} z={CAP_Z} h={12} tone={CAP} width={1.1} />
                <Detail d={dish} fill={i === SPACE ? "#cbd7bd" : DISHES[i % DISHES.length]} stroke="#b8bcb5" width={0.9} />
                <path d={dish} fill="#ffffff" className={styles.flash} />
                <text
                  transform={onTop(at(key.cx, key.cy, CAP_TOP))}
                  y={legend * 0.35}
                  textAnchor="middle"
                  fontSize={legend.toFixed(2)}
                  fontWeight={700}
                  fill={INK}
                  className={styles.fade}
                  style={between(start + 0.04, 0.04)}
                >
                  {key.label}
                </text>
              </g>
            </Part>
          );
        })}
      </svg>

      {/* the same controls for the keyboard, shown when they are reached with it */}
      {built && (
        <div className="absolute bottom-0 left-0 flex gap-2">
          <button type="button" className="sketch-chip sr-only focus:not-sr-only" onClick={togglePower}>
            {powered ? "Switch the computer off" : "Switch the computer on"}
          </button>
          <button type="button" className="sketch-chip sr-only focus:not-sr-only" onClick={() => togglePlug("keyboard")}>
            {plugged.keyboard ? "Unplug the keyboard" : "Plug the keyboard in"}
          </button>
          <button type="button" className="sketch-chip sr-only focus:not-sr-only" onClick={() => togglePlug("mouse")}>
            {plugged.mouse ? "Unplug the mouse" : "Plug the mouse in"}
          </button>
          <p className="sr-only" aria-live="polite">
            {unplugged.map((device) => `${device.toLowerCase()} unplugged.`).join(" ")}
          </p>
        </div>
      )}
    </>
  );
}
