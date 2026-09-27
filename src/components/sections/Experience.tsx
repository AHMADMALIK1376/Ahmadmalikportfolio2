import { CERTIFICATIONS, EXPERIENCE } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";
import { ArrowUpRight } from "@/components/sketch/Icons";
import Timeline from "./Timeline";

const STAMP_TILTS = [-3, 2, -1.5, 3];

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="gutter py-14 sm:py-20 md:py-24">
      <SectionHeading number="05" kicker="experience" id="experience-title">
        Where I&apos;ve been <Highlight ink="sienna">shipping</Highlight>.
      </SectionHeading>

      <Timeline>
        <ol className="space-y-9 sm:space-y-12 md:space-y-16">
          {EXPERIENCE.map((role, i) => (
            <li key={`${role.title}-${role.company}`} className={`ink-${role.ink} relative pl-10 sm:pl-12 md:pl-20`}>
              {/* the knot where this role sits on the line */}
              <span aria-hidden="true" className="absolute left-0 top-7 grid size-7 place-items-center rounded-full bg-paper-2 shadow-[2px_2px_0_1px_rgb(45_47_43/0.4)] md:left-2 md:size-8">
                <span className="size-3 rounded-full bg-(--ink-accent)" />
              </span>
              <Reveal delay={0.05} tilt={i % 2 ? 2 : -2}>
                <article className="sketch-box sketch-box--lift p-5 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="sketch-chip">{role.period}</span>
                    <span className="text-xs font-bold text-muted sm:text-sm">{role.detail}</span>
                  </div>
                  <h3 className="mt-3 text-lg sm:mt-4 sm:text-2xl">{role.title}</h3>
                  <p className="mt-1 text-base font-bold text-(--ink-text) sm:text-lg">
                    {role.url ? (
                      <a href={role.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 rounded hover:underline hover:decoration-wavy hover:underline-offset-4">
                        {role.company}
                        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    ) : (
                      role.company
                    )}
                  </p>
                  <ul className="sketch-list mt-4 space-y-3 text-sm leading-relaxed text-ink/90 sm:mt-5 sm:text-base">
                    {role.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </Timeline>

      <div className="mt-14 sm:mt-20">
        <h3 className="ink-wobble text-lg sm:text-2xl">
          Badges &amp; <Highlight mark="underline" ink="sage">hackathons</Highlight>
        </h3>
        <ul className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {CERTIFICATIONS.map((cert, i) => (
            <li key={cert.title}>
              <Reveal delay={i * 0.08} tilt={STAMP_TILTS[i] * 3} rest={STAMP_TILTS[i]}>
                <div className={`sketch-box sketch-box--tinted sketch-box--lift ${i % 2 ? "ink-sienna" : "ink-sage"} flex h-full flex-col p-4 sm:p-5`}>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-(--ink-text)">{cert.kind}</span>
                  <span className="mt-2 text-sm font-bold leading-snug sm:text-base">{cert.title}</span>
                  <span className="mt-1 text-sm text-muted">{cert.where}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
