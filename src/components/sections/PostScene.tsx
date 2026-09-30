"use client";

import { useEffect, useRef, type RefObject } from "react";
import { at, Block, COS, Detail, frontFace, line, onFront, onSide, rounded, sideFace, topFace, TONES, type Tone } from "@/components/desk/iso";
import { moveBy, plus, rigDrawing, RigShape, v3, type Rig, type V3 } from "@/components/desk/rig";
import { Tree } from "./MapScenes";
import styles from "./Postcard.module.css";

/**
 * The post box at the corner of the contact section, in the factory's 3D hand:
 * soft blocks in paper and pastel, a wobbling ink edge and a hard shadow.
 *
 * A letter is posted through the slot at the top of the box's front (its flap
 * lifts to take it). Then a post truck drives up from the foot of the picture
 * and stops beside the box, and a robot on wheels rolls down to it from the
 * top: its arm opens the collection door in the side of the box, takes the
 * letter out, shuts the door, and drops the letter into the mail crate on the
 * truck. The truck drives off up the road, and the robot rolls away down its
 * lane.
 *
 * The truck is moved by its layer's CSS translate; the robot's body and its
 * arm are in one layer together, the arm drawn afresh from its pose as it
 * moves, so the two never part.
 */

// ── the view, and moving within it ──────────────────────────────────────
const VB = { x: 250, y: 300, w: 186, h: 156 };
const VIEW = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
const move = (dx: number, dy: number) => `${(((COS * (dx - dy)) / VB.w) * 100).toFixed(3)}% ${((((dx + dy) / 2) / VB.h) * 100).toFixed(3)}%`;

// ── the scene, in its own units: x across to the right, y towards the viewer, z up ──
/** The road the truck comes along, and where it stops on it; and the robot's lane, and where it stops on that. */
const ROAD = { y: 46, half: 16 };
const LANE = { x: 46, half: 12 };
const TRUCK_IN = 270;
const BOT = { y: 4, deck: 20, shoulder: 30, off: 230 };
/** The post box's collection door, on its right side, and the slot at the top of its front. */
const DOOR = { x: 11, y0: -7, y1: 7, z0: 10, z1: 32 };
const SLOT = { y: 11, x0: -7, x1: 7, z0: 46, z1: 49.5 };

const SIENNA: Tone = { top: "#de9372", left: "#d0714c", right: "#bc4e26" };
const BRICK: Tone = { top: "#bc4e26", left: "#9c3f1d", right: "#7b3117" };
const SAGE: Tone = { top: "#cbd7bd", left: "#b1c29f", right: "#9caf88" };
const STEEL: Tone = { top: "#b8bcb5", left: "#9a9f98", right: "#7c817a" };
const WOOD: Tone = { top: "#e2b5a1", left: "#d0a58f", right: "#c0947f" };
const PAPER: Tone = { top: "#fbfbf8", left: "#f1f1ec", right: "#e3e5e0" };
const ROAD_TONE: Tone = { top: "#dcded8", left: "#cfd2cb", right: "#b9bdb6" };
const FLOOR: Tone = { top: "#eceee9", left: "#dcded8", right: "#cfd2cb" };

/** The arm on the robot. */
const ARM: Rig = { upper: 44, fore: 42, widths: [10, 9], turret: { base: BOT.deck, w: 14, tone: TONES.dark }, tone: SAGE, joints: [6.5, 5.5, 4.5], hub: "#d0714c" };
/** Its wrist as it rolls along, over its deck; and where it goes to open the door, take the letter, and put it in the crate. */
const CARRY = v3(-8, 0, 36);
const TOUCH = v3(20, 5, 40);
const GRAB = v3(15, 0, 41);
const OUT = v3(27, 0, 50);
const CRATE = { x: 1, y: ROAD.y };
const CRATE_ABOVE = v3(CRATE.x, CRATE.y, 76);
const CRATE_IN = v3(CRATE.x, CRATE.y, 62);

/** A letter in an envelope, standing on its edge: what the arm carries, drawn with its top at the origin. */
const LETTER = (
  <g filter="url(#desk-chip)">
    <Block x0={-1.2} x1={1.2} y0={-10} y1={10} z={-16} h={16} tone={PAPER} r={1} width={0.9} />
    <Detail d={line(at(1.2, -9, -2.5), at(1.2, 9, -2.5))} stroke="#d0714c" width={1.4} />
  </g>
);

export type PostApi = {
  /** Where the slot is on the page, to post the letter into. */
  slot: () => DOMRect | null;
  /** The slot's flap, lifted to take the letter, or let fall. */
  flap: (open: boolean) => void;
  /** The letter is in the box: the truck and the robot come for it, and go. */
  collect: () => Promise<void>;
};

/** A wheel on the side of something facing the viewer on the left (at depth y) or on the right (at x). */
function Wheel({ x, y, z = 6, r = 6, side = "front" }: { x: number; y: number; z?: number; r?: number; side?: "front" | "side" }) {
  return (
    <g transform={side === "front" ? onFront(at(x, y, z)) : onSide(at(x, y, z))}>
      <circle r={r} fill="#3b3d39" stroke="rgba(45,47,43,0.7)" strokeWidth={1.1} />
      <path className={styles.spoke} d={`M${-r * 0.6} 0H${r * 0.6}M0 ${-r * 0.6}V${r * 0.6}`} stroke="#b8bcb5" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}

export default function PostScene({ apiRef }: { apiRef: RefObject<PostApi | null> }) {
  const view = useRef<SVGSVGElement>(null);
  const truck = useRef<SVGSVGElement>(null);
  const botLayer = useRef<SVGSVGElement>(null);
  const botBody = useRef<SVGGElement>(null);
  const flapShut = useRef<SVGGElement>(null);
  const flapOpen = useRef<SVGGElement>(null);
  const doorShut = useRef<SVGGElement>(null);
  const doorOpen = useRef<SVGGElement>(null);
  const inside = useRef<SVGGElement>(null);
  const crated = useRef<SVGGElement>(null);

  useEffect(() => {
    const show = (el: Element | null, on: boolean) => el?.setAttribute("display", on ? "inline" : "none");
    const arm = rigDrawing([botLayer.current], ARM);
    const state = { truck: TRUCK_IN, bot: -BOT.off, w: plus(v3(LANE.x, BOT.y - BOT.off, BOT.shoulder), CARRY) };
    const shoulder = () => v3(LANE.x, BOT.y + state.bot, BOT.shoulder);
    const drawTruck = () => {
      if (truck.current) truck.current.style.translate = move(state.truck, 0);
    };
    const drawBot = () => {
      botBody.current?.setAttribute("transform", moveBy(0, state.bot));
      arm.draw(shoulder(), state.w);
    };
    drawTruck();
    drawBot();

    const tween = (ms: number, fn: (k: number) => void) =>
      new Promise<void>((done) => {
        let start = -1;
        const step = (now: number) => {
          if (start < 0) start = now;
          const k = Math.min(1, (now - start) / ms);
          fn(k);
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      });
    const out = (k: number) => 1 - (1 - k) ** 3;
    const inn = (k: number) => k ** 2.4;
    const both = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
    const armTo = (to: V3, ms: number) => {
      const from = state.w;
      return tween(ms, (k) => {
        const e = both(k);
        state.w = v3(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e, from.z + (to.z - from.z) * e);
        drawBot();
      });
    };
    const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));
    const driving = (el: Element | null, on: boolean) => el?.toggleAttribute("data-driving", on);

    apiRef.current = {
      slot: () => {
        const svg = view.current;
        if (!svg) return null;
        const box = svg.getBoundingClientRect();
        const k = box.width / VB.w;
        const [ax, ay] = at(SLOT.x0, SLOT.y, SLOT.z1);
        const [bx, by] = at(SLOT.x1, SLOT.y, SLOT.z0);
        return new DOMRect(box.left + (ax - VB.x) * k, box.top + (Math.min(ay, by) - VB.y) * k, (bx - ax) * k, Math.abs(by - ay) * k + 4 * k);
      },
      flap: (open) => {
        show(flapShut.current, !open);
        show(flapOpen.current, open);
      },
      collect: async () => {
        show(crated.current, false);
        state.truck = TRUCK_IN;
        state.bot = -BOT.off;
        state.w = plus(shoulder(), CARRY);
        drawTruck();
        drawBot();
        // the truck comes up the road from the foot of the picture, and the robot down its lane from the top
        driving(truck.current, true);
        await tween(1500, (k) => {
          state.truck = TRUCK_IN * (1 - out(k));
          drawTruck();
        });
        driving(truck.current, false);
        driving(botBody.current, true);
        await tween(1300, (k) => {
          state.bot = -BOT.off * (1 - out(k));
          state.w = plus(shoulder(), CARRY);
          drawBot();
        });
        driving(botBody.current, false);
        // it opens the door, takes the letter out, and shuts the door
        await armTo(TOUCH, 520);
        show(doorShut.current, false);
        show(doorOpen.current, true);
        await pause(180);
        await armTo(GRAB, 360);
        show(inside.current, false);
        arm.hold(true);
        await armTo(OUT, 340);
        show(doorOpen.current, false);
        show(doorShut.current, true);
        // and drops it into the mail crate on the truck
        await armTo(CRATE_ABOVE, 760);
        await armTo(CRATE_IN, 280);
        arm.hold(false);
        show(crated.current, true);
        await armTo(CRATE_ABOVE, 220);
        await armTo(plus(shoulder(), CARRY), 480);
        // the truck drives off up the road, and the robot rolls away down its lane
        driving(truck.current, true);
        await tween(1500, (k) => {
          state.truck = -TRUCK_IN * inn(k);
          drawTruck();
        });
        driving(truck.current, false);
        driving(botBody.current, true);
        await tween(1300, (k) => {
          state.bot = BOT.off * inn(k);
          state.w = plus(shoulder(), CARRY);
          drawBot();
        });
        driving(botBody.current, false);
        // off stage again, the truck and the robot wait where they came in
        state.truck = TRUCK_IN;
        state.bot = -BOT.off;
        state.w = plus(shoulder(), CARRY);
        drawTruck();
        drawBot();
        show(inside.current, true);
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  const [treeX, treeY] = at(-27, 21, 0);
  return (
    <div className={styles.scene} aria-hidden="true">
      {/* ── the ground, the post box, a tree and a lamp ── */}
      <svg ref={view} viewBox={VIEW} className={styles.sceneBase} focusable="false">
        {/* the road, and the robot's lane down to it */}
        <Block x0={-400} x1={400} y0={ROAD.y - ROAD.half} y1={ROAD.y + ROAD.half} z={-6} h={4} tone={ROAD_TONE} r={4} width={1.2} />
        <path d={line(at(-400, ROAD.y, -2), at(400, ROAD.y, -2))} fill="none" stroke="#fafaf7" strokeWidth={1.6} strokeDasharray="8 7" />
        <Block x0={LANE.x - LANE.half} x1={LANE.x + LANE.half} y0={-400} y1={ROAD.y - ROAD.half} z={-6} h={4} tone={ROAD_TONE} r={4} width={1.2} />
        <path d={line(at(LANE.x, -400, -2), at(LANE.x, ROAD.y - ROAD.half - 2, -2))} fill="none" stroke="#de9372" strokeWidth={1.4} strokeDasharray="6 5" />
        {/* the pavement the box stands on */}
        <g filter="url(#desk-card)">
          <Block x0={-34} x1={30} y0={-34} y1={27} z={-6} h={6} tone={FLOOR} r={9} />
        </g>
        <Tree x={treeX} y={treeY} r={9} />

        {/* a lamp */}
        <g filter="url(#desk-chip)">
          <Block x0={19} x1={22} y0={-29} y1={-26} z={0} h={62} tone={STEEL} r={1} width={1} />
          <Block x0={15} x1={26} y0={-32} y1={-23} z={62} h={6} tone={SIENNA} r={3} width={1} />
        </g>

        {/* the post box: a pillar box on a base, with its cap */}
        <g filter="url(#desk-card)">
          <Block x0={-13} x1={13} y0={-13} y1={13} z={0} h={4} tone={TONES.dark} r={5} />
          <Block x0={-11} x1={11} y0={-11} y1={11} z={4} h={54} tone={SIENNA} r={9} />
          <Block x0={-14} x1={14} y0={-14} y1={14} z={58} h={7} tone={BRICK} r={11} />
          <Block x0={-5} x1={5} y0={-5} y1={5} z={65} h={4} tone={BRICK} r={4} width={1.2} />
        </g>
        {/* on its front: the slot, and a plate with its name and the collection times */}
        <Detail d={rounded(frontFace(SLOT.x0, SLOT.x1, SLOT.z0, SLOT.z1, SLOT.y + 0.1), 1)} fill="#2d2f2b" />
        <Detail d={rounded(frontFace(-8, 8, 20, 38, 11.1), 2)} fill="#fafaf7" />
        <text transform={onFront(at(-6.5, 11.1, 33))} fontSize={4.8} fontWeight={700} letterSpacing={0.8} fill="#9c3f1d">
          POST
        </text>
        <g transform={onFront(at(-6.5, 11.1, 29))} fontSize={2.6} fontWeight={700} fill="#5e625c">
          <text y={0}>COLLECTION</text>
          <text y={3.4}>ANY TIME ✓</text>
        </g>
        <Detail d={line(at(-6, 11.1, 22.5), at(6, 11.1, 22.5))} stroke="#d0714c" width={1} />
        {/* the slot's flap: down, or lifted to take a letter */}
        <g ref={flapShut}>
          <Detail d={rounded(frontFace(-8.5, 8.5, 49.5, 53.5, 11.3), 1.5)} fill="#9c3f1d" />
        </g>
        <g ref={flapOpen} display="none">
          <Detail d={rounded([at(-8.5, 11.3, 53.5), at(8.5, 11.3, 53.5), at(8.5, 19, 56), at(-8.5, 19, 56)], 1.5)} fill="#bc4e26" />
        </g>
        {/* the collection door on its side: shut, or swung open with the letter inside */}
        <g ref={doorShut}>
          <Detail d={rounded(sideFace(DOOR.x, DOOR.y0, DOOR.y1, DOOR.z0, DOOR.z1), 2)} fill="#c65f35" />
          <Detail d={rounded(sideFace(DOOR.x + 0.1, DOOR.y1 - 4, DOOR.y1 - 2, 19, 24), 0.8)} fill="#5e625c" />
        </g>
        <g ref={doorOpen} display="none">
          <Detail d={rounded(sideFace(DOOR.x, DOOR.y0, DOOR.y1, DOOR.z0, DOOR.z1), 2)} fill="#2d2f2b" />
          <g ref={inside}>
            <Detail d={rounded(sideFace(DOOR.x + 0.2, -5, 5, 11, 27), 1)} fill="#fbfbf8" />
            <Detail d={line(at(DOOR.x + 0.3, -4, 24), at(DOOR.x + 0.3, 4, 24))} stroke="#d0714c" width={1} />
          </g>
          <Detail d={rounded(frontFace(DOOR.x, DOOR.x + 14, DOOR.z0, DOOR.z1, DOOR.y0), 2)} fill="#de9372" />
        </g>
      </svg>

      {/* ── the post truck: its layer slid along the road ── */}
      <svg ref={truck} viewBox={VIEW} className={`${styles.sceneLayer} ${styles.truck}`} focusable="false">
        {[-38, 18].map((x) => (
          <Wheel key={x} x={x} y={ROAD.y - 15} />
        ))}
        <g filter="url(#desk-card)">
          <Block x0={-24} x1={30} y0={ROAD.y - 15} y1={ROAD.y + 15} z={6} h={8} tone={TONES.concrete} r={4} />
          <Block x0={-50} x1={-24} y0={ROAD.y - 14} y1={ROAD.y + 14} z={6} h={34} tone={SIENNA} r={8} />
        </g>
        <Detail d={rounded(frontFace(-46, -30, 26, 36, ROAD.y + 14), 2.5)} fill="#cbd7bd" />
        <Detail d={rounded(topFace(-45, -29, ROAD.y - 8, ROAD.y + 8, 40), 3)} fill="#fafaf7" />
        <text transform={onFront(at(-47.5, ROAD.y + 14, 14))} fontSize={6} fontWeight={700} letterSpacing={0.8} fill="#fafaf7">
          POST
        </text>
        {/* the mail crate on its bed */}
        <g filter="url(#desk-chip)">
          <Block x0={-13} x1={15} y0={ROAD.y - 11} y1={ROAD.y + 11} z={14} h={16} tone={WOOD} r={2.5} width={1.1} />
        </g>
        <Detail d={rounded(topFace(-10, 12, ROAD.y - 8, ROAD.y + 8, 30), 2)} fill="#7c5e4f" />
        <text transform={onFront(at(-9, ROAD.y + 11, 19))} fontSize={5.4} fontWeight={700} letterSpacing={1.2} fill="#7b3117">
          MAIL
        </text>
        {/* the letter, once it is in the crate */}
        <g ref={crated} display="none">
          <g filter="url(#desk-chip)">
            <Block x0={CRATE.x - 1.2} x1={CRATE.x + 1.2} y0={ROAD.y - 7} y1={ROAD.y + 7} z={24} h={14} tone={PAPER} r={1} width={0.9} />
          </g>
        </g>
        {/* its side walls */}
        <g filter="url(#desk-chip)">
          <Block x0={-24} x1={30} y0={ROAD.y + 12} y1={ROAD.y + 15} z={14} h={6} tone={PAPER} r={1.5} width={1} />
        </g>
        {[-38, 18].map((x) => (
          <Wheel key={x} x={x} y={ROAD.y + 15} />
        ))}
      </svg>

      {/* ── the robot on wheels, and its arm: in one layer, so the two never part ── */}
      <svg ref={botLayer} viewBox={VIEW} className={styles.sceneLayer} focusable="false">
        <g ref={botBody} className={styles.bot}>
          {[-6, 12].map((y) => (
            <Wheel key={`b${y}`} x={LANE.x - 12} y={y} side="side" r={5.5} />
          ))}
          <g filter="url(#desk-card)">
            <Block x0={LANE.x - 12} x1={LANE.x + 12} y0={BOT.y - 12} y1={BOT.y + 12} z={4} h={10} tone={SIENNA} r={4} />
            <Block x0={LANE.x - 13} x1={LANE.x + 13} y0={BOT.y - 13} y1={BOT.y + 13} z={14} h={BOT.deck - 14} tone={TONES.concrete} r={3} />
          </g>
          <Detail d={rounded(frontFace(LANE.x - 9, LANE.x + 9, 7, 12, BOT.y + 12), 1.5)} fill="#fafaf7" />
          <text transform={onFront(at(LANE.x - 8, BOT.y + 12, 8.3))} fontSize={4} fontWeight={700} letterSpacing={0.6} fill="#2d2f2b">
            BOT-3
          </text>
          {[-6, 12].map((y) => (
            <Wheel key={`f${y}`} x={LANE.x + 12} y={y} side="side" r={5.5} />
          ))}
        </g>
        <RigShape rig={ARM} s={v3(LANE.x, BOT.y - BOT.off, BOT.shoulder)} w={plus(v3(LANE.x, BOT.y - BOT.off, BOT.shoulder), CARRY)} held={LETTER} />
      </svg>
    </div>
  );
}
