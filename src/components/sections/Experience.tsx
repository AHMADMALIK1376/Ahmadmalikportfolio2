import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import CareerMap from "./CareerMap";

export default function Experience() {
  return (
    <CareerMap
      heading={
        <SectionHeading number="05" kicker="experience" id="experience-title" intro="Scroll down the road: the van drives it with you, and every place I've been opens up as it arrives.">
          Where I&apos;ve been <Highlight ink="sienna">shipping</Highlight>.
        </SectionHeading>
      }
    />
  );
}
