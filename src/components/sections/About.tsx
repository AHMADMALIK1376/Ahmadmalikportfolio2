import { BUILDING_SINCE, CERTIFICATIONS, EDUCATION, EXPERIENCE, PROFILE, PROJECTS, TOOLBOX } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";
import Counter from "@/components/sketch/Counter";
import Doodle from "@/components/sketch/Doodle";
import Polaroid from "@/components/Polaroid";

const now = EXPERIENCE[0];

const STATS = [
  { value: new Date().getFullYear() - BUILDING_SINCE, suffix: "+", label: "years building for clients", ink: "ink-sage" },
  { value: PROJECTS.length, suffix: "", label: "projects on this page", ink: "ink-sienna" },
  { value: TOOLBOX.length, suffix: "+", label: "tools in the kit", ink: "ink-concrete" },
  { value: CERTIFICATIONS.filter((c) => c.kind === "Hackathon").length, suffix: "", label: "hackathons shipped", ink: "ink-sage" },
];

const TILTS = [-2, 1.5, 1, -1.5];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="gutter py-24 md:py-32">
      <SectionHeading number="01" kicker="about me" id="about-title">
        I turn hard <Highlight>AI problems</Highlight> into things people can use.
      </SectionHeading>

      <div className="grid items-start gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal tilt={8} y={40}>
          <Polaroid />
        </Reveal>

        <div>
          <div className="space-y-6 text-lg leading-relaxed">
            {PROFILE.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-7 sm:grid-cols-2">
            <Reveal delay={0.2} tilt={-3} rest={-1} className="h-full">
              <div className="sketch-box sketch-box--tinted ink-sienna h-full p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sienna-600">currently</p>
                <p className="mt-2 text-xl font-bold">
                  {now.title} @{" "}
                  {now.url ? (
                    <a href={now.url} target="_blank" rel="noopener noreferrer" className="underline decoration-sienna-500 decoration-wavy decoration-2 underline-offset-4 hover:text-sienna-600">
                      {now.company}
                    </a>
                  ) : (
                    now.company
                  )}
                </p>
                <p className="mt-2 text-sm text-muted">{now.detail}</p>
                <Doodle kind="bulb" className="absolute -right-3 -top-8 w-12 rotate-12 text-sienna-500" />
              </div>
            </Reveal>

            <Reveal delay={0.3} tilt={3} rest={0.8} className="h-full">
              <div className="sketch-box h-full p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sage-700">education</p>
                <p className="mt-2 text-xl font-bold">{EDUCATION.degree}</p>
                <p className="text-sm text-muted">{EDUCATION.school}</p>
                <p className="mt-3 inline-block sketch-chip ink-sage">{EDUCATION.period}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <ul className="mt-20 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <li key={stat.label}>
            <Reveal delay={i * 0.08} tilt={TILTS[i] * 3} rest={TILTS[i]}>
              <div className={`sketch-box sketch-box--tinted sketch-box--lift ${stat.ink} flex aspect-[1/0.8] flex-col justify-between p-5`}>
                <span className="ink-wobble text-[clamp(2.4rem,5vw,3.4rem)] font-bold leading-none text-(--ink-text)">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm font-bold leading-snug">{stat.label}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
