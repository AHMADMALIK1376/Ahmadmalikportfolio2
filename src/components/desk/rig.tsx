import type { ReactNode } from "react";
import { at, COS, rounded, type Point, type Tone } from "./iso";

/**
 * Robot arms, in the drawing kit's hand: drawn in 3D from their pose, every
 * link a block whose visible faces are shaded by the way they face, the turret
 * turned to face where the arm reaches, the elbow bent so the two links reach
 * the wrist, and a gripper hanging from the wrist with a finger either side of
 * whatever it holds. Used by the factory in the hero and the post box in the
 * contact section.
 */

// ── points in the scene ─────────────────────────────────────────────────
export type V3 = { x: number; y: number; z: number };
export const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
export const plus = (a: V3, b: V3) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
export const minus = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
export const times = (a: V3, k: number) => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const unit = (a: V3) => times(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
export const flat = (p: V3) => at(p.x, p.y, p.z);
export const above = (p: V3, by: number) => v3(p.x, p.y, p.z + by);
/** How near the viewer a point is: the viewer looks down from along x, y and z at once. */
export const depthOf = (p: V3) => p.x + p.y + p.z;
/** A move in the scene, as an SVG transform in the view's own units: dx along x, dy along y, dz up. */
export const moveBy = (dx: number, dy: number, dz = 0) => `translate(${(COS * (dx - dy)).toFixed(2)} ${((dx + dy) / 2 - dz).toFixed(2)})`;

// ── the arms ────────────────────────────────────────────────────────────

/** How far the wrist is above the underside of the gripper. */
export const HAND = 14;
const GRIPPER: Tone = { top: "#7c817a", left: "#5e625c", right: "#4a4d48" };

/** A robot arm: the length and thickness of its two links, its turret, and its colours. */
export type Rig = { upper: number; fore: number; widths: [number, number]; turret: { base: number; w: number; tone: Tone }; tone: Tone; joints: [number, number, number]; hub: string };

type Face = { d: string; fill: string };
const NO_FACE: Face = { d: "", fill: "none" };

/**
 * A block from a to b, `w` across and `t` through, and turned about its length so that its width lies level (or along
 * `across`, if it stands upright): the faces of it the viewer sees, shaded by which way each one faces.
 */
function beam(a: V3, b: V3, w: number, t: number, tone: Tone, across = v3(1, 0, 0)): Face[] {
  const d = unit(minus(b, a));
  let h = cross(d, v3(0, 0, 1));
  if (Math.hypot(h.x, h.y, h.z) < 0.25) h = across;
  h = unit(minus(h, times(d, dot(h, d))));
  const u = cross(h, d);
  const H = times(h, w / 2);
  const U = times(u, t / 2);
  const c = (p: V3, sh: number, su: number) => flat(plus(plus(p, times(H, sh)), times(U, su)));
  const faces: [V3, Point[]][] = [
    [u, [c(a, 1, 1), c(b, 1, 1), c(b, -1, 1), c(a, -1, 1)]],
    [times(u, -1), [c(a, 1, -1), c(b, 1, -1), c(b, -1, -1), c(a, -1, -1)]],
    [h, [c(a, 1, 1), c(b, 1, 1), c(b, 1, -1), c(a, 1, -1)]],
    [times(h, -1), [c(a, -1, 1), c(b, -1, 1), c(b, -1, -1), c(a, -1, -1)]],
    [d, [c(b, 1, 1), c(b, -1, 1), c(b, -1, -1), c(b, 1, -1)]],
    [times(d, -1), [c(a, 1, 1), c(a, -1, 1), c(a, -1, -1), c(a, 1, -1)]],
  ];
  const shown: Face[] = faces
    .filter(([n]) => n.x + n.y + n.z > 0.02)
    .map(([n, points]) => ({ d: rounded(points, 1.4), fill: n.z > 0.55 ? tone.top : n.y > n.x ? tone.left : tone.right }));
  while (shown.length < 3) shown.push(NO_FACE);
  return shown.slice(0, 3);
}

/** A part of a robot arm, and how near the viewer it is: the parts are painted furthest first. */
type RigPart = { key: string; depth: number; faces?: Face[]; joint?: { c: Point; r: number }; box?: string };

/**
 * A robot arm with its shoulder at `s` and its wrist at `w`: its turret turned to face the wrist, its upper arm lifted
 * and its elbow bent so the two links reach it, and its gripper hanging from the wrist with a finger either side of
 * what it holds. What it holds is drawn with its top at the origin, hanging down from there.
 */
function rigParts(rig: Rig, s: V3, w: V3): RigPart[] {
  const dx = w.x - s.x;
  const dy = w.y - s.y;
  const r = Math.hypot(dx, dy);
  const dir = r > 0.5 ? { x: dx / r, y: dy / r } : { x: -1, y: 0 };
  const rise = w.z - s.z;
  const span = Math.min(rig.upper + rig.fore - 0.5, Math.max(Math.abs(rig.upper - rig.fore) + 1, Math.hypot(r, rise)));
  const lift = Math.atan2(rise, r) + Math.acos(Math.min(1, Math.max(-1, (rig.upper ** 2 + span ** 2 - rig.fore ** 2) / (2 * rig.upper * span))));
  const out = rig.upper * Math.cos(lift);
  const e = v3(s.x + dir.x * out, s.y + dir.y * out, s.z + rig.upper * Math.sin(lift));
  const g = w.z - HAND;
  const foot = v3(s.x, s.y, rig.turret.base);
  const finger = (y: number) => beam(v3(w.x, y, g), v3(w.x, y, g - 10), 8, 2.5, GRIPPER);
  return [
    { key: "turret", depth: depthOf(foot), faces: beam(foot, above(s, rig.turret.w * 0.3), rig.turret.w, rig.turret.w, rig.turret.tone, v3(-dir.y, dir.x, 0)) },
    { key: "upper", depth: depthOf(times(plus(s, e), 0.5)), faces: beam(s, e, rig.widths[0], rig.widths[0], rig.tone) },
    { key: "fore", depth: depthOf(times(plus(e, w), 0.5)), faces: beam(e, w, rig.widths[1], rig.widths[1], rig.tone) },
    { key: "hand", depth: depthOf(v3(w.x, w.y, g + 4)), faces: [...beam(w, v3(w.x, w.y, g + 3), 8, 8, GRIPPER), ...beam(v3(w.x, w.y - 14, g + 1.5), v3(w.x, w.y + 14, g + 1.5), 9, 3, GRIPPER)] },
    { key: "far", depth: depthOf(v3(w.x, w.y - 12.5, g - 5)), faces: finger(w.y - 12.5) },
    { key: "near", depth: depthOf(v3(w.x, w.y + 12.5, g - 5)), faces: finger(w.y + 12.5) },
    { key: "box", depth: depthOf(v3(w.x, w.y, g - 10)), box: moveBy(w.x, w.y, g - 1) },
    ...[s, e, w].map((p, k) => ({ key: `j${k}`, depth: depthOf(p) + 12, joint: { c: flat(p), r: rig.joints[k] } })),
  ];
}

/**
 * Keeps the drawing of a robot arm in step with its pose: its parts redrawn, and put back in painting order when that
 * changes. Its parts may be split between layers; each layer keeps its own order.
 */
export function rigDrawing(svgs: (SVGSVGElement | null)[], rig: Rig) {
  const holders = svgs.flatMap((svg) => svg?.querySelector<SVGGElement>("[data-rig]") ?? []);
  const groups = new Map<string, SVGGElement>();
  holders.forEach((holder) => holder.querySelectorAll<SVGGElement>(":scope > [data-part]").forEach((g) => groups.set(g.dataset.part ?? "", g)));
  const paths = new Map([...groups].map(([key, g]) => [key, Array.from(g.querySelectorAll<SVGPathElement>(":scope > path"))]));
  let order = "";
  return {
    draw(s: V3, w: V3) {
      const parts = rigParts(rig, s, w);
      for (const part of parts) {
        const g = groups.get(part.key);
        part.faces?.forEach((face, k) => {
          const path = paths.get(part.key)?.[k];
          path?.setAttribute("d", face.d);
          path?.setAttribute("fill", face.fill);
        });
        if (part.joint) g?.firstElementChild?.setAttribute("transform", `translate(${part.joint.c[0].toFixed(1)} ${part.joint.c[1].toFixed(1)})`);
        if (part.box) g?.firstElementChild?.setAttribute("transform", part.box);
      }
      const sorted = parts.sort((a, b) => a.depth - b.depth).map((part) => part.key);
      const next = sorted.join();
      if (next !== order) {
        order = next;
        for (const holder of holders) holder.append(...sorted.flatMap((key) => (groups.get(key)?.parentNode === holder ? (groups.get(key) ?? []) : [])));
      }
    },
    hold(on: boolean) {
      groups.get("box")?.setAttribute("display", on ? "inline" : "none");
    },
  };
}

/**
 * A robot arm as first drawn, before it moves: the same parts the script redraws, in painting order; or some of them.
 * `held` is what its gripper carries, drawn with its top at the origin.
 */
export function RigShape({ rig, s, w, held, only }: { rig: Rig; s: V3; w: V3; held: ReactNode; only?: (key: string) => boolean }) {
  const parts = rigParts(rig, s, w)
    .filter((part) => !only || only(part.key))
    .sort((a, b) => a.depth - b.depth);
  return (
    <g data-rig="">
      {parts.map((part) => (
        <g key={part.key} data-part={part.key} display={part.box ? "none" : undefined}>
          {part.faces?.map((face, k) => (
            <path key={k} d={face.d} fill={face.fill} stroke="rgba(45,47,43,0.62)" strokeWidth={1} strokeLinejoin="round" />
          ))}
          {part.joint && (
            <g transform={`translate(${part.joint.c[0].toFixed(1)} ${part.joint.c[1].toFixed(1)})`}>
              <circle r={part.joint.r} fill="#fafaf7" stroke="rgba(45,47,43,0.62)" strokeWidth={1.1} />
              <circle r={part.joint.r * 0.42} fill={rig.hub} />
            </g>
          )}
          {part.box && <g transform={part.box}>{held}</g>}
        </g>
      ))}
    </g>
  );
}
