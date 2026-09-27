import type { ReactNode } from "react";

/** A section's title: its number and name in the margin, then the heading in ink. */
export default function SectionHeading({ number, kicker, children, intro, id }: { number: string; kicker: string; children: ReactNode; intro?: ReactNode; id?: string }) {
  return (
    <header className="mb-12 md:mb-16">
      <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-muted">
        <span className="text-sienna-600">{number}</span>
        <svg aria-hidden="true" viewBox="0 0 60 8" className="h-2 w-12 text-concrete-400">
          <path d="M2 5c12-3 26-3 56-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {kicker}
      </p>
      <h2 id={id} className="ink-wobble mt-4 text-[clamp(2.1rem,5.5vw,4rem)]">
        {children}
      </h2>
      {intro && <p className="mt-5 max-w-2xl text-lg text-muted">{intro}</p>}
    </header>
  );
}
