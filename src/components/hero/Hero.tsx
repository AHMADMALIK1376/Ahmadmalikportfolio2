import type { CSSProperties } from "react";
import { PERSON, RESUME_PDF } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Highlight from "@/components/sketch/Highlight";
import Doodle from "@/components/sketch/Doodle";
import { ArrowDown, Download, Pin, Clock } from "@/components/sketch/Icons";
import LocalTime from "@/components/LocalTime";
import Typewriter from "./Typewriter";
import HeroPhoto from "./HeroPhoto";

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col pt-[calc(var(--nav-h)+2.5rem)] pb-16">
      <div className="gutter grid flex-1 items-center gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
        <div>
          <p className="hero-rise flex items-center gap-2 text-base font-bold text-muted sm:text-lg" style={rise(0)}>
            <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1.2s_infinite]" aria-hidden="true">
              👋
            </span>
            hello, world — i&apos;m
          </p>

          <h1 id="hero-title" className="hero-rise ink-wobble mt-4 text-[clamp(2.5rem,6.6vw,5.4rem)] leading-[0.98]" style={rise(1)}>
            {PERSON.first}
            <br />
            <Highlight now delay={1.1}>
              {PERSON.last}
            </Highlight>
          </h1>

          <p className="hero-rise mt-6 min-h-[1.6em] text-[clamp(1.15rem,2.4vw,1.6rem)] font-bold" style={rise(2)}>
            <Typewriter words={PERSON.titles} />
          </p>

          <p className="hero-rise mt-5 max-w-xl text-lg text-muted" style={rise(3)}>
            {PERSON.line}
          </p>

          <div className="hero-rise mt-10 flex flex-wrap items-center gap-x-5 gap-y-6" style={rise(4)}>
            <SketchButton href="#work" size="lg" lasso>
              See my work
            </SketchButton>
            <SketchButton href="#contact" tone="sage">
              Say hello
            </SketchButton>
            <SketchButton href={RESUME_PDF} download="M-Ahmad-Malik-Resume.pdf" calm icon={<Download className="sketch-btn__icon" />}>
              Resume
            </SketchButton>
          </div>

          <p className="hero-rise mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-muted" style={rise(5)}>
            <span className="inline-flex items-center gap-1.5">
              <Pin className="size-4 text-sienna-500" /> {PERSON.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-sage-600" /> <LocalTime />
            </span>
          </p>
        </div>

        <HeroPhoto />
      </div>

      <a href="#about" className="hero-rise group mx-auto mt-12 flex flex-col items-center gap-1 rounded-lg text-xs font-bold uppercase tracking-[0.3em] text-muted" style={rise(7)}>
        scroll
        <span className="bob">
          <ArrowDown className="size-6 text-sienna-500 transition-transform group-hover:scale-125" />
        </span>
      </a>

      <Doodle kind="squiggle" className="pointer-events-none absolute bottom-6 left-4 hidden w-40 text-sage-400 md:block" delay={2.4} now />
    </section>
  );
}
