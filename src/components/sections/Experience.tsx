import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import CareerMap from "./CareerMap";

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="gutter pb-14 pt-10 sm:py-20 md:pb-24 md:pt-16">
      <SectionHeading number="05" kicker="experience" id="experience-title" intro="Pick a pin, or let the van drive.">
        Where I&apos;ve been <Highlight ink="sienna">shipping</Highlight>.
      </SectionHeading>
      <CareerMap />
    </section>
  );
}
