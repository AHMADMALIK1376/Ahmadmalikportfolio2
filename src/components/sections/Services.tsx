import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import ServiceWallet from "./ServiceWallet";

/** What I do: the heading and the list on one side, the wallet on the other, all in one screen. */
export default function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="gutter py-14 sm:py-20 md:pb-20 md:pt-20">
      <ServiceWallet
        heading={
          <SectionHeading number="02" kicker="what i do" id="services-title" intro="Five kinds of work, kept in one wallet. Open a card to see how each one goes — and watch it run.">
            From the <Highlight ink="sienna">model</Highlight> to the <Highlight mark="underline">pixel</Highlight>.
          </SectionHeading>
        }
      />
    </section>
  );
}
