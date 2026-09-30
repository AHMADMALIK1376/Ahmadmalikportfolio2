import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="gutter pb-14 pt-10 sm:py-16 lg:pb-10 lg:pt-14">
      <div className="mx-auto max-w-[62rem]">
        <SectionHeading number="06" kicker="contact" id="contact-title" tight intro="Got a project, a role, or an idea? Write it on the card and post it — it lands in my inbox.">
          Let&apos;s build something <Highlight mark="circle" ink="sienna">together</Highlight>.
        </SectionHeading>

        <div className="mt-4">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
