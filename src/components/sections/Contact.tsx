import { PERSON } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";
import SketchButton from "@/components/sketch/SketchButton";
import Doodle from "@/components/sketch/Doodle";
import LocalTime from "@/components/LocalTime";
import { Clock, GitHub, LinkedIn, Mail, Pin } from "@/components/sketch/Icons";
import ContactForm from "./ContactForm";
import CopyEmail from "./CopyEmail";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="gutter py-14 sm:py-20 md:py-24">
      <SectionHeading number="06" kicker="contact" id="contact-title">
        Let&apos;s build something <Highlight mark="circle" ink="sienna">together</Highlight>.
      </SectionHeading>

      <div className="grid gap-12 sm:gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <Reveal>
          <div className="space-y-7 sm:space-y-8">
            <p className="text-[0.95rem] leading-relaxed sm:text-lg">
              Got a project, a role, or just an idea you want to think out loud about? My inbox is open — I read everything and reply to everything.
            </p>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">email me</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <a href={`mailto:${PERSON.email}`} className="ink-wobble group inline-flex items-center gap-2 break-all rounded text-base font-bold sm:text-xl">
                  <Mail className="size-5 shrink-0 text-sienna-500 sm:size-6" />
                  <span className="decoration-sienna-500 decoration-wavy decoration-2 underline-offset-4 group-hover:underline">{PERSON.email}</span>
                </a>
                <CopyEmail />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">find me on</p>
              <div className="mt-4 flex flex-wrap gap-4">
                <SketchButton href={PERSON.github} size="sm" icon={<GitHub className="sketch-btn__icon" />}>
                  GitHub
                </SketchButton>
                <SketchButton href={PERSON.linkedin} size="sm" tone="sage" icon={<LinkedIn className="sketch-btn__icon" />}>
                  LinkedIn
                </SketchButton>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-muted sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Pin className="size-4 text-sienna-500" /> {PERSON.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-sage-600" /> it&apos;s <LocalTime /> here
              </span>
            </div>

            <Doodle kind="arrow-curl" className="hidden w-36 rotate-[20deg] text-sage-500 lg:ml-auto lg:mr-6 lg:block" delay={0.3} />
          </div>
        </Reveal>

        <Reveal delay={0.15} tilt={-3} rest={-0.5}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
