import { BUILDING_SINCE, CERTIFICATIONS, EDUCATION, EXPERIENCE, PROFILE, PROJECTS, TOOLBOX } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";
import Counter from "@/components/sketch/Counter";
import Doodle from "@/components/sketch/Doodle";
import Polaroid from "@/components/Polaroid";

const now = EXPERIENCE[0];

/** Quick facts, worn as badges under the photo. */
const BADGES = [
  { value: new Date().getFullYear() - BUILDING_SINCE, suffix: "+", label: "years building", ink: "ink-sage", tilt: -3 },
  { value: PROJECTS.length, suffix: "", label: "projects", ink: "ink-sienna", tilt: 2 },
  { value: TOOLBOX.length, suffix: "+", label: "tools", ink: "ink-concrete", tilt: 2.5 },
  { value: CERTIFICATIONS.filter((c) => c.kind === "Hackathon").length, suffix: "", label: "hackathons", ink: "ink-sage", tilt: -2 },
];

/**
 * About: the heading, the photo with its badges, the three paragraphs and two
 * small cards, sized to be seen all at once on a laptop screen.
 */
export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="gutter py-14 sm:py-20 md:pb-24 md:pt-20">
      <SectionHeading number="01" kicker="about me" id="about-title">
        I turn hard <Highlight>AI problems</Highlight> into things people can use.
      </SectionHeading>

      <div className="grid items-start gap-10 md:grid-cols-[16rem_1fr] md:gap-12 lg:grid-cols-[17rem_1fr] lg:gap-16">
        <div>
          <Reveal tilt={8} y={40}>
            <Polaroid />
          </Reveal>

          <ul className="mx-auto mt-9 flex max-w-[17rem] flex-wrap justify-center gap-x-2.5 gap-y-3" aria-label="Quick facts">
            {BADGES.map((badge, i) => (
              <li key={badge.label}>
                <Reveal delay={0.2 + i * 0.07} y={14} tilt={badge.tilt * 3} rest={badge.tilt}>
                  <span className={`sketch-badge ${badge.ink}`}>
                    <span className="sketch-badge__value">
                      <Counter to={badge.value} suffix={badge.suffix} />
                    </span>
                    {badge.label}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="space-y-4 text-[0.95rem] leading-relaxed sm:text-base">
            {PROFILE.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Reveal delay={0.2} tilt={-3} rest={-0.8} className="h-full">
              <div className="sketch-box sketch-box--tinted ink-sienna h-full rounded-[1.4rem] p-4 sm:p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-sienna-600">currently</p>
                <p className="mt-1.5 text-base font-bold leading-snug">
                  {now.title} @{" "}
                  {now.url ? (
                    <a href={now.url} target="_blank" rel="noopener noreferrer" className="underline decoration-sienna-500 decoration-wavy decoration-2 underline-offset-4 hover:text-sienna-600">
                      {now.company}
                    </a>
                  ) : (
                    now.company
                  )}
                </p>
                <p className="mt-1.5 text-xs text-muted">{now.detail}</p>
                <Doodle kind="bulb" className="absolute -right-2 -top-6 w-9 rotate-12 text-sienna-500" />
              </div>
            </Reveal>

            <Reveal delay={0.3} tilt={3} rest={0.6} className="h-full">
              <div className="sketch-box h-full rounded-[1.4rem] p-4 sm:p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-sage-700">education</p>
                <p className="mt-1.5 text-base font-bold leading-snug">{EDUCATION.degree}</p>
                <p className="mt-0.5 text-xs text-muted">{EDUCATION.school}</p>
                <p className="mt-2.5 inline-block sketch-chip ink-sage">{EDUCATION.period}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
