import { SKILLS, TOOLBOX } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";

const TILTS = [-2.2, 1.6, -1.2, 2, -1.8, 1.2, -2.6];
const half = Math.ceil(TOOLBOX.length / 2);
const ROWS = [TOOLBOX.slice(0, half), TOOLBOX.slice(half)];

/** A strip of tape across the page, every tool printed on it, sliding by. */
function Marquee() {
  return (
    <div aria-hidden="true" className="relative -mx-[5vw] my-16 -rotate-2 select-none md:my-20">
      <div className="ink-wobble space-y-3 bg-concrete-800 py-5 text-paper shadow-[5px_6px_0_1px_rgb(45_47_43/0.35)]">
        {ROWS.map((row, r) => (
          <div key={r} className="flex overflow-hidden">
            <div className={`flex shrink-0 animate-marquee items-center gap-6 pr-6 ${r ? "[animation-direction:reverse] [animation-duration:52s]" : ""}`}>
              {[...row, ...row].map((tool, i) => (
                <span key={i} className="flex items-center gap-6 whitespace-nowrap text-lg font-bold sm:text-xl">
                  {tool}
                  <span className={i % 2 ? "text-sage-300" : "text-sienna-300"}>✶</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="py-24 md:py-32">
      <div className="gutter">
        <SectionHeading number="04" kicker="toolbox" id="skills-title" intro="The tools I reach for, pinned to the wall where I can see them.">
          My <Highlight>toolbox</Highlight>.
        </SectionHeading>
      </div>

      <Marquee />

      <div className="gutter">
        <ul className="columns-1 gap-8 sm:columns-2 lg:columns-3">
          {SKILLS.map((group, i) => (
            <li key={group.name} className="mb-10 break-inside-avoid">
              <Reveal delay={(i % 3) * 0.08} tilt={TILTS[i] * 3} rest={TILTS[i]}>
                <div className={`sketch-box sketch-box--tinted sketch-box--lift ink-${group.ink} px-6 pb-7 pt-10`}>
                  {/* a pushpin */}
                  <span aria-hidden="true" className="absolute left-1/2 top-3 size-4 -translate-x-1/2 rounded-full bg-(--ink-accent) shadow-[2px_3px_0_0_rgb(45_47_43/0.35)] ring-2 ring-paper-2" />
                  <h3 className="ink-wobble text-xl">{group.name}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2 [--ink-fill:var(--color-paper-2)]">
                    {group.items.map((item) => (
                      <li key={item} className="sketch-chip">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
