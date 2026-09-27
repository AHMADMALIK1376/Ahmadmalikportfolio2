import { NAV, PERSON } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Doodle from "@/components/sketch/Doodle";
import { ArrowUp, GitHub, LinkedIn, Mail } from "@/components/sketch/Icons";

export default function Footer() {
  return (
    <footer className="relative mt-16 bg-concrete-800 text-paper">
      {/* a torn, hand-drawn top edge */}
      <svg aria-hidden="true" viewBox="0 0 1200 24" preserveAspectRatio="none" className="absolute -top-[22px] left-0 h-6 w-full text-concrete-800">
        <path d="M0 24V14c60-8 120 6 190-2s130-9 200 0 140 7 210-3 140-6 210 2 150 8 220 0 110-8 170-1v14z" fill="currentColor" />
      </svg>

      <div className="gutter grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_auto] md:gap-10">
        <div>
          <p className="ink-wobble text-2xl font-bold">
            ahmad<span className="text-sienna-300">.</span>malik
          </p>
          <p className="mt-3 max-w-sm text-concrete-300">{PERSON.role} in {PERSON.location}. Drawn by hand, built with Next.js.</p>
          <div className="mt-6 flex gap-5 text-concrete-200">
            <a href={PERSON.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="rounded transition-transform hover:-rotate-6 hover:scale-110 hover:text-sage-300">
              <GitHub className="size-6" />
            </a>
            <a href={PERSON.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="rounded transition-transform hover:rotate-6 hover:scale-110 hover:text-sage-300">
              <LinkedIn className="size-6" />
            </a>
            <a href={`mailto:${PERSON.email}`} aria-label="Email" className="rounded transition-transform hover:-rotate-6 hover:scale-110 hover:text-sienna-300">
              <Mail className="size-6" />
            </a>
          </div>
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-concrete-400">on this page</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="rounded font-bold text-concrete-200 decoration-sage-300 decoration-wavy underline-offset-4 hover:text-paper hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col items-start gap-4 md:items-end">
          {/* the button keeps its own look on the dark band: a paper face */}
          <SketchButton href="#top" size="sm" calm className="bg-paper-2" icon={<ArrowUp className="sketch-btn__icon" />}>
            Back to top
          </SketchButton>
          <Doodle kind="heart" className="mt-2 w-8 text-sienna-300" delay={0.2} />
        </div>
      </div>

      <div className="border-t border-dashed border-concrete-600">
        <p className="gutter py-6 text-xs text-concrete-400">
          © {new Date().getFullYear()} {PERSON.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
