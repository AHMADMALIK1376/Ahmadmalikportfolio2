import type { ReactNode } from "react";

/** A section's title: its number and name in the margin, then the heading in ink. */
type Props = { number: string; kicker: string; children: ReactNode; intro?: ReactNode; id?: string; /** less room under it, for a section that must fit one screen */ tight?: boolean };

export default function SectionHeading({ number, kicker, children, intro, id, tight = false }: Props) {
  return (
    <header className={tight ? "mb-3 sm:mb-4" : "mb-7 sm:mb-9 md:mb-10"}>
      <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted sm:text-xs">
        <span className="text-sienna-600">{number}</span>
        <svg aria-hidden="true" viewBox="0 0 60 8" className="h-2 w-10 text-concrete-400">
          <path d="M2 5c12-3 26-3 56-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {kicker}
      </p>
      <h2 id={id} className="ink-wobble mt-2.5 text-[1.45rem] sm:mt-3 sm:text-[clamp(1.75rem,3vw,2.35rem)]">
        {children}
      </h2>
      {intro && <p className={`max-w-xl text-sm text-muted sm:text-base ${tight ? "mt-1.5 sm:mt-2" : "mt-3 sm:mt-4"}`}>{intro}</p>}
    </header>
  );
}
