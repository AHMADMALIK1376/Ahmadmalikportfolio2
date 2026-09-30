import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import ServiceWallet from "./ServiceWallet";

/** What I do: the heading and the list on one side, the wallet on the other, all in one screen. */
export default function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="gutter py-14 sm:py-20 lg:pb-10 lg:pt-14">
      <ServiceWallet
        heading={
          <SectionHeading number="02" kicker="what i do" id="services-title" tight intro="Five kinds of work, kept in one wallet. Open a card to watch how each one goes.">
            From the <Highlight ink="sienna">model</Highlight> to the <Highlight mark="underline">pixel</Highlight>.
          </SectionHeading>
        }
      />
    </section>
  );
}
