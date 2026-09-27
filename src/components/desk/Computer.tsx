import type { CSSProperties } from "react";
import styles from "./Desk.module.css";
import { at, between, Block, Detail, drawn, EDGE, line, onFront, Part, rounded, type Point, type Tone } from "./iso";

/**
 * An old desktop computer standing behind the keyboard, made like one of the
 * site's cards: a paper-coloured monitor with a dark screen, a sage power
 * light and vents down its side, on a system unit with a floppy drive, a port
 * on its front for the mouse and one on its side for the keyboard.
 *
 * The unit is drawn first; the monitor is drawn in the air above it and
 * lowered onto its stand; then the screen comes on like a tube warming up. The
 * screen faces the keyboard, so everything on it is set on the monitor's front
 * face and leans with it: a title bar with a RUN button, rows of code that the
 * desk types in, a caret and a mouse pointer. The body goes through the cards'
 * wobble and shadow; what is on the screen does not, so the code stays crisp.
 */

export const SCREEN = { rows: 10, size: 8.6, pad: 9, firstBaseline: 28, lineHeight: 12.4 };
// a Courier character is 0.6 of the font size wide
export const CHARACTER = SCREEN.size * 0.6;

const X = -125; // the computer sits behind the left half of the keyboard, clear of it
const PAPER: Tone = { top: "#f4f4f0", left: "#e3e5e0", right: "#d2d5cf" };
const SHADED: Tone = { top: "#e6e8e3", left: "#d6d9d3", right: "#c4c8c1" };
const GLASS = "#2d2f2b";
const GLASS_LIT = "#333532";
const POWER = "#9caf88";

const UNIT = { x0: X - 130, x1: X + 130, y0: -270, y1: -156, z: 0, h: 52 };
const TUBE = { x0: X - 100, x1: X + 100, y0: -282, y1: -210, z: 76, h: 150 };
const MONITOR = { x0: X - 126, x1: X + 126, y0: -210, y1: -164, z: 56, h: 186 };
const FRONT = MONITOR.y1;
const GLASS_EDGE = { x0: X - 110, x1: X + 110, z0: 80, z1: 228 };

/** The keyboard's port, on the unit's right side, and the mouse's, on its front, in the scene's space. */
export const KEYBOARD_PORT = { x: UNIT.x1, y: -218, z: 20, colour: "#d0714c" };
export const MOUSE_PORT = { x: -180, y: UNIT.y1, z: 18, colour: "#80966b" };

/** Where the mouse pointer rests on the screen, in the screen's own units, and where its RUN button is. */
export const POINTER_REST = { u: 150, v: 90 };
export const RUN_BUTTON = { u: 182, v: 2.5, w: 30, h: 10 };

/** The corners of a rectangle on a face turned towards the viewer at depth `y`. */
const frontFace = (x0: number, x1: number, z0: number, z1: number, y: number): Point[] => [at(x0, y, z1), at(x1, y, z1), at(x1, y, z0), at(x0, y, z0)];
/** The corners of a rectangle on a face turned to the right at `x`. */
const sideFace = (x: number, y0: number, y1: number, z0: number, z1: number): Point[] => [at(x, y1, z1), at(x, y0, z1), at(x, y0, z0), at(x, y1, z0)];

export type ComputerTiming = {
  /** when the unit, and then the monitor, are drawn; each is coloured a little after */
  unit: number;
  monitor: number;
  /** when the monitor is lowered onto the unit, over `span` */
  lower: number;
  span: number;
  /** when the power light and then the picture come on */
  on: number;
};

type Props = {
  timing: ComputerTiming;
  rowRef: (row: number, el: SVGTextElement | null) => void;
  caretRef: (el: SVGRectElement | null) => void;
  pointerRef: (el: SVGGElement | null) => void;
  runRef: (el: SVGGElement | null) => void;
  powered: boolean;
  onPower: () => void;
  unplugged: string[];
};

export default function Computer({ timing, rowRef, caretRef, pointerRef, runRef, powered, onPower, unplugged }: Props) {
  const { x0, x1, z0, z1 } = GLASS_EDGE;
  const width = x1 - x0;
  const height = z1 - z0;
  const lit = { "--fs": timing.on, "--fl": 0.03 } as CSSProperties;

  return (
    <g>
      {/* ── the system unit, with its stand on top ── */}
      <g style={drawn(timing.unit, timing.unit + 0.1)} filter="url(#desk-card)">
        <Block {...UNIT} tone={PAPER} r={12} />
        {/* on the front: a badge, the floppy drive and its slot, and the mouse's port */}
        <Detail d={rounded(frontFace(X - 112, X - 84, 18, 36, UNIT.y1), 3)} fill={SHADED.right} />
        <Detail d={rounded(frontFace(X - 10, X + 104, 18, 32, UNIT.y1), 4)} fill={SHADED.left} />
        <Detail d={rounded(frontFace(X, X + 94, 23, 27, UNIT.y1), 2)} fill="#5e625c" />
        <Detail d={rounded(frontFace(MOUSE_PORT.x - 8, MOUSE_PORT.x + 8, MOUSE_PORT.z - 8, MOUSE_PORT.z + 8, UNIT.y1), 3)} fill={MOUSE_PORT.colour} />
        <Detail d={rounded(frontFace(MOUSE_PORT.x - 4.5, MOUSE_PORT.x + 4.5, MOUSE_PORT.z - 4.5, MOUSE_PORT.z + 4.5, UNIT.y1), 1.5)} fill="#3b3d39" />
        {/* on the side: the keyboard's port, the power socket and a column of vents */}
        <Detail d={rounded(sideFace(UNIT.x1, KEYBOARD_PORT.y - 8, KEYBOARD_PORT.y + 8, KEYBOARD_PORT.z - 8, KEYBOARD_PORT.z + 8), 3)} fill={KEYBOARD_PORT.colour} />
        <Detail d={rounded(sideFace(UNIT.x1, KEYBOARD_PORT.y - 4.5, KEYBOARD_PORT.y + 4.5, KEYBOARD_PORT.z - 4.5, KEYBOARD_PORT.z + 4.5), 1.5)} fill="#3b3d39" />
        <Detail d={rounded(sideFace(UNIT.x1, -256, -240, 10, 20), 2.5)} fill="#5e625c" />
        <Detail d={Array.from({ length: 8 }, (_, i) => line(at(UNIT.x1, -264 + i * 11, 30), at(UNIT.x1, -264 + i * 11, 42))).join("")} width={1.6} />
        <Block x0={X - 60} x1={X + 60} y0={-240} y1={-180} z={UNIT.h} h={4} tone={SHADED} r={10} />
      </g>

      {/* ── the monitor, drawn above the unit and lowered onto its stand ── */}
      <Part arrival={{ lift: 46, from: timing.lower, span: timing.span }} style={drawn(timing.monitor, timing.monitor + 0.1)}>
        <g filter="url(#desk-card)">
          <Block {...TUBE} tone={SHADED} r={16} />
          <Block {...MONITOR} tone={PAPER} r={16} />
          <Detail d={Array.from({ length: 8 }, (_, i) => line(at(MONITOR.x1, -202, 122 + i * 12), at(MONITOR.x1, -182, 122 + i * 12))).join("")} width={1.6} />
          <Detail d={rounded(frontFace(x1 - 16, x1 - 4, 62, 70, FRONT), 3)} fill={POWER} style={lit} />
          {!powered && <path d={rounded(frontFace(x1 - 16, x1 - 4, 62, 70, FRONT), 3)} fill="#b8bcb5" stroke={EDGE} strokeWidth={1.2} />}
          {/* the bezel and the glass */}
          <Detail d={rounded(frontFace(x0 - 6, x1 + 6, z0 - 6, z1 + 6, FRONT), 12)} fill={SHADED.top} />
          <Detail d={rounded(frontFace(x0, x1, z0, z1, FRONT), 10)} fill={GLASS} width={1.5} />
        </g>

        <text transform={onFront(at(x0 + 2, FRONT, 67))} y={2.5} fontSize={7.5} fontWeight={700} letterSpacing={1.2} fill="#9a9f98" className={styles.fade} style={between(timing.monitor + 0.12, 0.05)}>
          MA-01
        </text>

        {/* the power button: a round key in a recess, which a visitor can press */}
        <g className={`${styles.hit} ${styles.powerKey}`} onClick={onPower} filter="url(#desk-chip)">
          <g className={styles.knob}>
            <Detail d={rounded(frontFace(x1 - 42, x1 - 26, 59, 73, FRONT), 6)} fill={powered ? "#f5dfd5" : "#e3e5e0"} />
            <g transform={onFront(at(x1 - 34, FRONT, 66))} className={styles.fade} style={between(timing.monitor + 0.12, 0.05)}>
              <path d="M-2.4 -2.2A3.2 3.2 0 1 0 2.4 -2.2M0 -3.8V-0.4" fill="none" stroke={powered ? "#bc4e26" : "#7c817a"} strokeWidth={1.1} strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* ── what the screen shows once it is on ── */}
        <g className={styles.picture} data-off={powered ? undefined : ""}>
          <g className={styles.crt} style={between(timing.on + 0.02, 0.07)}>
            <path d={rounded(frontFace(x0 + 4, x1 - 4, z0 + 4, z1 - 4, FRONT), 7)} fill={GLASS_LIT} />
            <clipPath id="desk-screen">
              <rect x={4} y={4} width={width - 8} height={height - 8} rx={7} />
            </clipPath>
            <g transform={onFront(at(x0, FRONT, z1))} clipPath="url(#desk-screen)" style={{ whiteSpace: "pre" }}>
              {/* the title bar: three lights, the file, and a RUN button the pointer clicks */}
              <rect x={4} y={4} width={width - 8} height={12} fill="#262825" />
              {["#d0714c", "#9a9f98", "#9caf88"].map((colour, i) => (
                <circle key={colour} cx={12 + i * 8} cy={10} r={2.3} fill={colour} />
              ))}
              <text x={width / 2} y={12.4} textAnchor="middle" fontSize={6.4} fontWeight={700} fill="#868b84">
                ahmad@ma-01: ~/code
              </text>
              <g ref={runRef} className={styles.run}>
                <rect x={RUN_BUTTON.u} y={RUN_BUTTON.v + 2} width={RUN_BUTTON.w} height={RUN_BUTTON.h} rx={5} fill="#3b3d39" />
                <text x={RUN_BUTTON.u + RUN_BUTTON.w / 2} y={RUN_BUTTON.v + 9.6} textAnchor="middle" fontSize={6.2} fontWeight={700} fill="#b1c29f">
                  RUN ▶
                </text>
              </g>
              <g fontSize={SCREEN.size} fontWeight={700}>
                {Array.from({ length: SCREEN.rows }, (_, row) => (
                  <text key={row} ref={(el) => rowRef(row, el)} x={SCREEN.pad} y={SCREEN.firstBaseline + row * SCREEN.lineHeight} />
                ))}
              </g>
              <rect ref={caretRef} x={SCREEN.pad} y={SCREEN.firstBaseline - 7} width={5} height={8.6} fill="#9caf88" className={styles.blink} />
              {/* the mouse pointer, moved about by the mouse on the desk */}
              <g ref={pointerRef} transform={`translate(${POINTER_REST.u} ${POINTER_REST.v})`}>
                <path d="M0 0V13L3.4 9.8L6 15L8.2 14L5.6 8.8H10.4Z" fill="#f4f4f0" stroke="#262825" strokeWidth={0.9} strokeLinejoin="round" />
              </g>
              {/* a note for each device that has been unplugged */}
              {unplugged.length > 0 && (
                <g textAnchor="middle">
                  <rect x={36} y={48} width={width - 72} height={28 + unplugged.length * 14} rx={8} fill="#f5dfd5" />
                  <text x={width / 2} y={61} fontSize={6.8} fontWeight={700} fill="#9c3f1d" className={styles.blink}>
                    ! DEVICE DISCONNECTED
                  </text>
                  {unplugged.map((device, i) => (
                    <text key={device} x={width / 2} y={77 + i * 14} fontSize={8.6} fontWeight={700} fill="#2d2f2b">
                      {device} UNPLUGGED
                    </text>
                  ))}
                </g>
              )}
            </g>
          </g>
        </g>
        {/* the last light of the tube, a line across the middle of the glass that fades as the power goes */}
        <path d={rounded(frontFace(x0 + 12, x1 - 12, (z0 + z1) / 2 - 1.5, (z0 + z1) / 2 + 1.5, FRONT), 1.5)} fill="#eaebe6" className={styles.lastLight} />
      </Part>
    </g>
  );
}
