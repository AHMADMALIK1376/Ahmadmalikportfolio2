import { TOOLBOX } from "@/lib/content";
import SkillsTable from "./SkillsTable";

const half = Math.ceil(TOOLBOX.length / 2);
const ROWS = [TOOLBOX.slice(0, half), TOOLBOX.slice(half)];

/** A strip of tape across the page, every tool printed on it, sliding by. */
function Marquee() {
  return (
    <div aria-hidden="true" data-reveal="" className="relative -mx-[5vw] mb-2 mt-9 -rotate-2 select-none sm:mt-10 lg:mt-7">
      <div className="ink-wobble space-y-2 bg-concrete-800 py-3 text-paper shadow-[5px_6px_0_1px_rgb(45_47_43/0.35)] sm:space-y-2.5 sm:py-4">
        {ROWS.map((row, r) => (
          <div key={r} className="flex overflow-hidden">
            <div className={`flex shrink-0 animate-marquee items-center gap-6 pr-6 ${r ? "[animation-direction:reverse] [animation-duration:52s]" : ""}`}>
              {[...row, ...row].map((tool, i) => (
                <span key={i} className="flex items-center gap-6 whitespace-nowrap text-sm font-bold sm:text-lg">
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
    <section id="skills" aria-labelledby="skills-title" className="overflow-x-clip py-14 sm:py-16 lg:pb-6 lg:pt-14">
      <div className="gutter">
        <SkillsTable />
      </div>

      <Marquee />
    </section>
  );
}
