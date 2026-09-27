import SketchButton from "@/components/sketch/SketchButton";
import Doodle from "@/components/sketch/Doodle";
import Highlight from "@/components/sketch/Highlight";
import { ArrowRight } from "@/components/sketch/Icons";

export default function NotFound() {
  return (
    <section className="gutter flex min-h-[100svh] flex-col items-center justify-center py-32 text-center">
      <Doodle kind="spiral" now className="w-24 text-sienna-500" duration={1.4} />
      <p className="ink-wobble mt-8 text-[clamp(5rem,20vw,11rem)] font-bold leading-none">404</p>
      <h1 className="ink-wobble mt-4 text-[clamp(1.6rem,4vw,2.6rem)]">
        This page got <Highlight now ink="sienna" delay={0.6}>erased</Highlight>.
      </h1>
      <p className="mt-5 max-w-md text-lg text-muted">Whatever was drawn here has been rubbed out — or it was never sketched in the first place.</p>
      <div className="mt-12">
        <SketchButton href="/" size="lg" lasso icon={<ArrowRight className="sketch-btn__icon" />}>
          Back home
        </SketchButton>
      </div>
    </section>
  );
}
