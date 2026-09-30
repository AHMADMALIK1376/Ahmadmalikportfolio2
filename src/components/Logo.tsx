/**
 * Ahmad's mark: a pen nib whose slit runs on into a circuit trace, ending in a
 * node — drawn by hand, built with code. The nib is sienna with an ink edge and
 * its breather hole; the trace is sage. When it is pointed at (the link round
 * it is a `group`), the trace draws itself again from the nib and the node
 * lights up.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 46" className={className} aria-hidden="true" focusable="false">
      <g className="ink-wobble">
        {/* the nib */}
        <path d="M22 3 34 18c1.5 2 1.4 4-.2 6L24 36h-4L10.2 24c-1.6-2-1.7-4-.2-6Z" fill="#de9372" stroke="#1f2120" strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M22 3 12.8 16.6" fill="none" stroke="#fafaf7" strokeOpacity={0.45} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M22 3v6.5" stroke="#1f2120" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={22} cy={16} r={3} fill="#333532" stroke="#1f2120" strokeWidth={1.2} />
      </g>
      {/* its slit, running on as a circuit trace to a node */}
      <path
        d="M22 19v8l6 5v6"
        pathLength={1}
        fill="none"
        stroke="#b1c29f"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="logo-trace"
      />
      <circle cx={28} cy={41} r={2.7} fill="#b1c29f" className="logo-node" />
    </svg>
  );
}
