import type { Ref } from "react";
import styles from "./Desk.module.css";
import { at, Box, Detail, dot, drawn, line, onSide, Part, type Tone } from "./iso";

/**
 * A mouse on its pad, to the left of the keyboard. The pad and the base are
 * sketched, the shell is drawn in the air and lowered onto them, and from then
 * on the desk moves it: `bodyRef` slides the whole mouse over its pad,
 * `buttonRef` presses the left button, and `wheelRef` turns the wheel, which is
 * drawn on its own side so that turning it in that plane turns it in 3D. A
 * visitor can press either button themselves.
 */

const PAD: Tone = { top: "#464943", left: "#383b36", right: "#2d2f2b" };
const BASE: Tone = { top: "#5e625c", left: "#4a4d48", right: "#3b3d39" };
const SHELL: Tone = { top: "#f4f4f0", left: "#dcded8", right: "#c4c8c1" };
const HUMP: Tone = { top: "#fafaf7", left: "#e3e5e0", right: "#cdd0ca" };

// the mouse's footprint, a little clear of the keyboard's left end, its pad, and where its wheel turns; the buttons face the computer
const BODY = { x0: -258, x1: -204, y0: -19, y1: 89 };
const PAD_AREA = { x0: -266, x1: -200, y0: -27, y1: 96 };
const MID = (BODY.x0 + BODY.x1) / 2;
const SHELL_Z = 9;
const BUTTON_Z = 27;
const WHEEL = { y: 8, z: 37, r: 10, x0: MID - 2.5, x1: MID + 2.5 };
/** Where the mouse's cable leaves its front, in the scene's space. */
export const MOUSE_CABLE_START = { x: MID, y: BODY.y0, z: 12 };

/** A circle in a face's own units. */
const circle = (r: number) => `M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

export type MouseTiming = { draw: number; lower: number; span: number };

type Props = {
  timing: MouseTiming;
  bodyRef: Ref<SVGGElement>;
  buttonRef: Ref<SVGGElement>;
  wheelRef: Ref<SVGGElement>;
};

export default function Mouse({ timing, bodyRef, buttonRef, wheelRef }: Props) {
  const { draw, lower, span } = timing;
  const shell = { lift: 34, from: lower, span };

  return (
    <g>
      {/* the pad it slides over */}
      <g style={drawn(draw, draw + 0.08)}>
        <Box {...PAD_AREA} z={0} h={3} tone={PAD} />
        <Detail d={line(at(PAD_AREA.x0 + 5, PAD_AREA.y0 + 5, 3), at(PAD_AREA.x1 - 5, PAD_AREA.y0 + 5, 3), at(PAD_AREA.x1 - 5, PAD_AREA.y1 - 5, 3))} stroke="#7c817a" width={1} />
      </g>

      <g ref={bodyRef}>
        {/* the base, and its feet */}
        <g style={drawn(draw + 0.03, draw + 0.11)}>
          <Box {...BODY} z={3} h={6} tone={BASE} />
        </g>

        {/* the shell's body, and the left button, which the pointer's clicks press */}
        <Part arrival={shell} style={drawn(draw + 0.06, draw + 0.14)}>
          <Box {...BODY} z={SHELL_Z} h={BUTTON_Z - SHELL_Z} tone={SHELL} />
          <Detail d={line(at(BODY.x0, BODY.y1, 18), at(BODY.x1, BODY.y1, 18), at(BODY.x1, BODY.y0, 18))} stroke="#b8bcb5" width={1} />
          <g ref={buttonRef} className={`${styles.hit} ${styles.mouseKey}`}>
            <Box x0={BODY.x0 + 1} x1={WHEEL.x0 - 0.5} y0={BODY.y0} y1={11} z={BUTTON_Z} h={9} tone={SHELL} width={1.1} />
          </g>
        </Part>

        {/* the wheel, standing in the gap between the buttons: its far rim, and its near rim with the grip that turns */}
        <Part arrival={shell} style={drawn(draw + 0.1, draw + 0.18)}>
          <g transform={onSide(at(WHEEL.x0, WHEEL.y, WHEEL.z))}>
            <Detail d={circle(WHEEL.r)} fill="#2d2f2b" width={1} />
          </g>
          <g transform={onSide(at(WHEEL.x1, WHEEL.y, WHEEL.z))}>
            <Detail d={circle(WHEEL.r)} fill="#5e625c" width={1.1} />
            <g ref={wheelRef}>
              <Detail
                d={Array.from({ length: 10 }, (_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  return `M${(Math.cos(a) * 5).toFixed(2)} ${(Math.sin(a) * 5).toFixed(2)}L${(Math.cos(a) * 9.2).toFixed(2)} ${(Math.sin(a) * 9.2).toFixed(2)}`;
                }).join("")}
                stroke="#a3a8a1"
                width={1.3}
              />
            </g>
          </g>
        </Part>

        {/* the right button, and the hump under the palm with a sienna dot on it, both nearer than the wheel */}
        <Part arrival={shell} style={drawn(draw + 0.06, draw + 0.14)}>
          <g className={`${styles.hit} ${styles.mouseKey}`}>
            <Box x0={WHEEL.x1 + 0.5} x1={BODY.x1 - 1} y0={BODY.y0} y1={11} z={BUTTON_Z} h={9} tone={SHELL} width={1.1} />
          </g>
          <Box x0={BODY.x0 + 3} x1={BODY.x1 - 3} y0={11} y1={86} z={BUTTON_Z} h={12} tone={HUMP} />
          <Detail d={dot(at(MID, 56, BUTTON_Z + 12), 5)} fill="#bc4e26" width={0.8} />
        </Part>
      </g>
    </g>
  );
}
