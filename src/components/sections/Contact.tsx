import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="gutter pb-14 pt-10 sm:py-20 md:pb-24 md:pt-16">
      <SectionHeading number="06" kicker="contact" id="contact-title" tight intro="Got a project, a role, or an idea? Click the paper in the plotter and type: it writes your letter out as you go, and it lands in my inbox.">
        Let&apos;s build something <Highlight mark="circle" ink="sienna">together</Highlight>.
      </SectionHeading>

      <ContactForm />
    </section>
  );
}
