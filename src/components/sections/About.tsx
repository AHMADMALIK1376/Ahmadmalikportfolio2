import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import AboutSheet from "./AboutSheet";

/**
 * About: the heading, and the spec sheet — the photo with its callouts, and
 * the rating plate under it — sized to be seen all at once on a laptop screen.
 */
export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="gutter py-14 sm:py-16 lg:pb-8 lg:pt-14">
      <SectionHeading number="01" kicker="about me · the spec sheet" id="about-title" tight>
        I turn hard <Highlight>AI problems</Highlight> into things people can use.
      </SectionHeading>

      <div className="mt-5 lg:mt-4">
        <AboutSheet />
      </div>
    </section>
  );
}
