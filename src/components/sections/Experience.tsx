import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import CareerMap from "./CareerMap";

export default function Experience() {
  return (
    <CareerMap
      heading={
        <SectionHeading number="05" kicker="experience" id="experience-title" tight intro="Scroll to drive. The van stops at every place I've been.">
          Where I&apos;ve been <Highlight ink="sienna">shipping</Highlight>.
        </SectionHeading>
      }
    />
  );
}
