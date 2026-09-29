import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Doodle from "@/components/sketch/Doodle";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="gutter pb-14 pt-10 sm:py-16 lg:py-10">
      {/* the heading beside the plotter on a wide screen, so the two fit one screen together */}
      <div className="grid items-center gap-6 lg:grid-cols-[0.62fr_1.38fr] lg:gap-10">
        <div>
          <SectionHeading number="06" kicker="contact" id="contact-title" tight intro="Got a project, a role, or an idea? Click the paper in the plotter and type: it writes your letter out as you go, and it lands in my inbox.">
            Let&apos;s build something <Highlight mark="circle" ink="sienna">together</Highlight>.
          </SectionHeading>
          <p aria-hidden="true" className="mt-8 hidden -rotate-3 text-sm font-bold leading-tight text-sienna-600 lg:block">
            click the paper
            <br />
            and type
            <Doodle kind="arrow-curl" className="-mt-5 ml-28 w-16 -rotate-[35deg] text-sienna-500" delay={0.4} />
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
