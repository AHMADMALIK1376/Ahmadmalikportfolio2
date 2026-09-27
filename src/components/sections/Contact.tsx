import { PERSON } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import SketchButton from "@/components/sketch/SketchButton";
import LocalTime from "@/components/LocalTime";
import { Clock, GitHub, LinkedIn, Mail, Pin } from "@/components/sketch/Icons";
import ContactForm from "./ContactForm";
import CopyEmail from "./CopyEmail";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="gutter pb-14 pt-10 sm:py-20 md:pb-24 md:pt-16">
      <SectionHeading number="06" kicker="contact" id="contact-title" tight intro="Got a project, a role, or an idea? Write it below: the plotter puts it on paper, and it lands in my inbox.">
        Let&apos;s build something <Highlight mark="circle" ink="sienna">together</Highlight>.
      </SectionHeading>

      <ContactForm
        aside={
          <div className="space-y-3 px-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <a href={`mailto:${PERSON.email}`} className="ink-wobble group inline-flex items-center gap-2 break-all rounded text-sm font-bold sm:text-base">
                <Mail className="size-5 shrink-0 text-sienna-500" />
                <span className="decoration-sienna-500 decoration-wavy decoration-2 underline-offset-4 group-hover:underline">{PERSON.email}</span>
              </a>
              <CopyEmail />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <SketchButton href={PERSON.github} size="sm" calm icon={<GitHub className="sketch-btn__icon" />}>
                GitHub
              </SketchButton>
              <SketchButton href={PERSON.linkedin} size="sm" calm tone="sage" icon={<LinkedIn className="sketch-btn__icon" />}>
                LinkedIn
              </SketchButton>
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Pin className="size-4 text-sienna-500" /> {PERSON.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-sage-600" /> it&apos;s <LocalTime /> here
                </span>
              </span>
            </div>
          </div>
        }
      />
    </section>
  );
}
