import { at, EDGE, poly, type Point } from "@/components/desk/iso";

/**
 * Ahmad's mark, drawn in the same hand as the factory, the map and the post
 * box: a pen nib standing up in the isometric view, turned to face the
 * right (its face is a right-hand face of the grid), a solid slab with flat
 * pastel faces — its face in sienna, its thickness in a deeper sienna — a
 * wobbling ink edge and the hard offset shadow of the site's cards (the
 * `desk-card` filter). Its slit runs down to the breather hole and on out of
 * the nib as a sage circuit wire, ending in a node: a small sage block. Drawn
 * by hand, built with code.
 *
 * When it is pointed at (the link round it is a `group`), the nib tips, the
 * wire draws itself again from the nib, and the node lights up.
 */

/** The nib's outline, across (u) and up (v), clockwise from the tip. */
const NIB: [number, number][] = [
  [0, 85],
  [30, 42],
  [31, 32],
  [7.5, 2.5],
  [-7.5, 2.5],
  [-31, 32],
  [-30, 42],
];
/** How thick the nib is: its face at x = 0, its back THICK behind it. Across the face (u) runs along -y, so it reads to the right. */
const THICK = 11;
const face = (u: number, v: number, x = 0): Point => at(x, -u, v);

const FACE = "#de9372";
const SIDE = "#bc4e26";
const TOP = "#ecbea9";

/** The sides of the nib the viewer sees: each edge swept back, shaded by the way it faces. */
const SIDES = NIB.flatMap(([u0, v0], i) => {
  const [u1, v1] = NIB[(i + 1) % NIB.length];
  // the edge's outward normal, across and up; across is -y, so it is seen if it faces left or up (the viewer looks from +x, +y and +z)
  const [nu, nv] = [v1 - v0, u0 - u1].map((n) => -n);
  if (nv - nu <= 0.5) return [];
  return [{ d: poly(face(u0, v0), face(u1, v1), face(u1, v1, -THICK), face(u0, v0, -THICK)), fill: nv > -nu ? TOP : SIDE }];
});

/** The breather hole: a circle on the face, seen at the view's slant. */
const HOLE = poly(...Array.from({ length: 16 }, (_, k) => face(Math.cos((k / 16) * Math.PI * 2) * 6.5, 52 + Math.sin((k / 16) * Math.PI * 2) * 6.5)));
/** The wire, a little in front of the face: down from the hole, out of the nib, and across to the node. */
const WIRE = [face(0, 45, 1.5), face(0, 25, 1.5), face(15, 12.5, 1.5), face(15, -4, 1.5)]
  .map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
  .join("");
/** The node: a small block at the wire's end, under u = 15. */
const NODE = { x0: -4, x1: 8, y0: -21, y1: -9, z0: -16, z1: -5 };
const node = (() => {
  const { x0, x1, y0, y1, z0, z1 } = NODE;
  return {
    top: poly(at(x0, y0, z1), at(x1, y0, z1), at(x1, y1, z1), at(x0, y1, z1)),
    left: poly(at(x0, y1, z1), at(x1, y1, z1), at(x1, y1, z0), at(x0, y1, z0)),
    right: poly(at(x1, y0, z1), at(x1, y1, z1), at(x1, y1, z0), at(x1, y0, z0)),
  };
})();

export default function Logo({ className }: { className?: string }) {
  const edge = { stroke: EDGE, strokeWidth: 2.2, strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="312 304 85 119" className={`logo-3d ${className ?? ""}`} aria-hidden="true" focusable="false">
      <g filter="url(#desk-card)">
        {/* the nib: its sides, then its face, the slit and the hole */}
        {SIDES.map((side) => (
          <path key={side.d} d={side.d} fill={side.fill} {...edge} />
        ))}
        <path d={poly(...NIB.map(([u, v]) => face(u, v)))} fill={FACE} {...edge} />
        <path d={`M${face(0, 84).join(" ")}L${face(0, 58.5).join(" ")}`} fill="none" stroke="#2d2f2b" strokeWidth={2.6} strokeLinecap="round" />
        <path d={HOLE} fill="#3b3d39" {...edge} />
        {/* the node */}
        <path d={node.right} fill="#80966b" {...edge} />
        <path d={node.left} fill="#9caf88" {...edge} />
        <path d={node.top} fill="#cbd7bd" {...edge} className="logo-node" />
      </g>
      {/* the wire: an inked edge, its sage, and the light along it, wobbling like the rest */}
      <g filter="url(#desk-ink)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={WIRE} pathLength={1} stroke={EDGE} strokeWidth={7.2} className="logo-trace" />
        <path d={WIRE} pathLength={1} stroke="#9caf88" strokeWidth={5} className="logo-trace" />
        <path d={WIRE} pathLength={1} stroke="#e2e9da" strokeWidth={1.6} transform="translate(-0.8 -1)" className="logo-trace" />
      </g>
    </svg>
  );
}
