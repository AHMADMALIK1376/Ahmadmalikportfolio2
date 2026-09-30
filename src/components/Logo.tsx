import { useId } from "react";

/**
 * Ahmad's mark, in 3D: a pen nib whose slit runs on into a circuit trace, ending
 * in a node — drawn by hand, built with code. The nib is a solid sienna slab,
 * its thickness running back to the lower right and its face lit from the top
 * left, with a breather hole cut through it; the trace is a raised sage wire
 * with its own shadow, and the node a small glossy sphere. When it is pointed
 * at (the link round it is a `group`), the nib turns a little in space, the
 * trace draws itself again from the nib and the node lights up.
 */

const NIB = "M22 3 34 18c1.5 2 1.4 4-.2 6L24 36h-4L10.2 24c-1.6-2-1.7-4-.2-6Z";
const TRACE = "M22 19v8l6 5v6";
/** How far the nib's thickness runs back, in steps. */
const DEPTH = [3.2, 2.8, 2.4, 2, 1.6, 1.2, 0.8, 0.4];

export default function Logo({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 44 48" className={`logo-3d ${className ?? ""}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-face`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#f5c0a6" />
          <stop offset="0.45" stopColor="#e2916d" />
          <stop offset="1" stopColor="#c9643d" />
        </linearGradient>
        <radialGradient id={`${id}-node`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#f0f3ec" />
          <stop offset="0.45" stopColor="#b1c29f" />
          <stop offset="1" stopColor="#4c5e3e" />
        </radialGradient>
        <radialGradient id={`${id}-hole`} cx="0.6" cy="0.65" r="0.7">
          <stop offset="0" stopColor="#7b3117" />
          <stop offset="1" stopColor="#1f2120" />
        </radialGradient>
      </defs>

      {/* its hard shadow on the page */}
      <path d={NIB} transform="translate(5.2 5.2)" fill="#2d2f2b" fillOpacity={0.22} />

      {/* the nib's thickness, running back to the lower right, and its back edge */}
      <path d={NIB} transform={`translate(${DEPTH[0]} ${DEPTH[0]})`} fill="#7b3117" stroke="#1f2120" strokeOpacity={0.75} strokeWidth={1.3} strokeLinejoin="round" />
      {DEPTH.slice(1).map((d, k) => (
        <path key={d} d={NIB} transform={`translate(${d} ${d})`} fill={k < 3 ? "#8f3a1a" : "#a9492a"} />
      ))}

      {/* its face, lit from the top left, with a gleam down its left edge */}
      <path d={NIB} fill={`url(#${id}-face)`} stroke="#1f2120" strokeOpacity={0.8} strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M21.2 5.4 12 17.4c-1 1.4-1 2.8.1 4.2" fill="none" stroke="#fdf3ee" strokeOpacity={0.8} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M20.4 34.6h3.2" stroke="#fdf3ee" strokeOpacity={0.45} strokeWidth={0.9} strokeLinecap="round" />

      {/* the slit, and the breather hole cut through, its inner wall catching the light */}
      <path d="M22 3v10" stroke="#1f2120" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={22} cy={16} r={3.2} fill={`url(#${id}-hole)`} stroke="#1f2120" strokeWidth={1.2} />
      <path d="M19.6 17.6a3 3 0 0 0 4.8 0" fill="none" stroke="#de9372" strokeWidth={0.9} strokeLinecap="round" />

      {/* the circuit trace: a raised wire, with its shadow under it and the light along it */}
      <path d={TRACE} transform="translate(1.3 1.3)" fill="none" stroke="#2d2f2b" strokeOpacity={0.3} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={TRACE} pathLength={1} fill="none" stroke="#80966b" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="logo-trace" />
      <path d={TRACE} pathLength={1} transform="translate(-0.45 -0.45)" fill="none" stroke="#e2e9da" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" className="logo-trace" />

      {/* the node: a glossy sphere, and its shadow */}
      <ellipse cx={29.2} cy={44.6} rx={3.4} ry={1.3} fill="#2d2f2b" fillOpacity={0.25} />
      <circle cx={28} cy={41} r={3.5} fill={`url(#${id}-node)`} stroke="#1f2120" strokeOpacity={0.7} strokeWidth={1} className="logo-node" />
      <circle cx={26.9} cy={39.9} r={0.9} fill="#fafaf7" fillOpacity={0.9} />
    </svg>
  );
}
