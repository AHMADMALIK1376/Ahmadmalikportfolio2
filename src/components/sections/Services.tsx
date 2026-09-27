import { SERVICES, type Service } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";
import SketchButton from "@/components/sketch/SketchButton";
import { Sketch } from "@/components/sketch/Doodle";
import { ArrowRight } from "@/components/sketch/Icons";

/** A small working drawing for each kind of work, sketched as the card arrives. */
const DRAWINGS: Record<Service["doodle"], string[]> = {
  // a loss curve, falling
  llm: [
    "M14 8c-1 22 0 45 1 68 32 1 64 0 96-1",
    "M20 16c7 5 11 22 20 32 10 11 21 15 34 17 12 2 24 2 34 2",
    "M40 47h.1M60 60h.1M84 66h.1",
    "M92 20c4 4 7 9 9 14M101 34c-4-1-8-1-12 0",
  ],
  // clients over a gateway over services over data
  architecture: [
    "M10 8h24v13H10zM48 8h24v13H48zM86 8h24v13H86z",
    "M22 21v12M60 21v12M98 21v12",
    "M9 33c34-1 68-1 102 0v12c-34 1-68 1-102 0z",
    "M35 45v10M85 45v10M20 55h30v12H20zM70 55h30v12H70z",
    "M45 76c0-4 30-4 30 0v7c0 4-30 4-30 0zM45 76c0 4 30 4 30 0",
  ],
  // a browser window with a page in it
  web: [
    "M8 10c35-1 70-1 104 0 1 23 1 46 0 70-35 1-70 1-104 0-1-24-1-47 0-70z",
    "M8 22c35 1 70 1 104 0M15 16h.1M21 16h.1M27 16h.1",
    "M18 34h40M18 43h30M18 52h36",
    "M70 32h32v28H70zM70 60l11-12 8 8 5-5 8 9",
    "M18 64h22v8H18z",
  ],
  // a rack of servers, lights on
  backend: [
    "M20 8c27-1 53-1 80 0v20c-27 1-53 1-80 0z",
    "M20 34c27-1 53-1 80 0v20c-27 1-53 1-80 0z",
    "M20 60c27-1 53-1 80 0v20c-27 1-53 1-80 0z",
    "M30 18h.1M30 44h.1M30 70h.1M44 18h40M44 44h40M44 70h40",
  ],
  // a box, its padding, a measurement and a pointer
  frontend: [
    "M22 16c25-1 50-1 74 0 1 17 1 35 0 52-25 1-49 1-74 0-1-17-1-35 0-52z",
    "M34 28h50v28H34z",
    "M10 16v52M7 20l3-4 3 4M7 64l3 4 3-4",
    "M86 50l12 28 4-11 11-4z",
  ],
};

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <article className={`sketch-box sketch-box--lift ink-${service.ink} flex h-full flex-col p-5 sm:p-7`}>
      <div className="flex items-start justify-between gap-4">
        <span className="ink-wobble text-sm font-bold text-(--ink-text)">0{index + 1}</span>
        <span className="grid size-20 place-items-center rounded-[1.2rem] bg-(--ink-fill) sm:size-24 sm:rounded-[1.4rem]">
          <Sketch box="0 0 120 90" paths={DRAWINGS[service.doodle]} className="ink-wobble w-16 text-(--ink-text) sm:w-20" strokeWidth={2.6} duration={0.55} delay={0.2} />
        </span>
      </div>
      <h3 className="mt-4 text-xl sm:mt-5 sm:text-2xl">{service.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted sm:text-[0.95rem]">{service.summary}</p>
      <ol className="mt-5 flex sm:mt-6 flex-wrap items-center gap-x-1.5 gap-y-2" aria-label={`${service.title}, step by step`}>
        {service.steps.map((step, i) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="sketch-chip">{step}</span>
            {i < service.steps.length - 1 && <ArrowRight className="size-3.5 text-concrete-500" />}
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="gutter py-16 sm:py-24 md:py-32">
      <SectionHeading number="02" kicker="what i do" id="services-title" intro="Five kinds of work, from training a model to polishing the last pixel of the interface it lives behind.">
        From the <Highlight ink="sienna">model</Highlight> to the <Highlight mark="underline">pixel</Highlight>.
      </SectionHeading>

      <ul className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <li key={service.title}>
            <Reveal className="h-full" delay={(i % 3) * 0.1} tilt={i % 2 ? 3 : -3}>
              <ServiceCard service={service} index={i} />
            </Reveal>
          </li>
        ))}
        <li>
          <Reveal className="h-full" delay={0.2} tilt={3}>
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-5 rounded-[1.75rem] border-2 border-dashed border-concrete-400 p-6 text-center sm:min-h-72 sm:gap-6 sm:p-8">
              <p className="ink-wobble text-xl font-bold sm:text-2xl">
                Something else
                <br />
                in mind?
              </p>
              <p className="text-muted">If it runs in a browser or on a server, let&apos;s talk about it.</p>
              <SketchButton href="#contact" tone="sienna" icon={<ArrowRight className="sketch-btn__icon" />}>
                Let&apos;s talk
              </SketchButton>
            </div>
          </Reveal>
        </li>
      </ul>
    </section>
  );
}
