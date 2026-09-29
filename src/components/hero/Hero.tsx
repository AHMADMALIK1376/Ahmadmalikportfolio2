import type { CSSProperties } from "react";
import { PERSON, RESUME_PDF } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Highlight from "@/components/sketch/Highlight";
import Doodle from "@/components/sketch/Doodle";
import { ArrowDown, Download, Pin, Clock } from "@/components/sketch/Icons";
import Factory from "@/components/factory/Factory";
import LocalTime from "@/components/LocalTime";
import Typewriter from "./Typewriter";

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col pt-[calc(var(--nav-h)+1.5rem)] pb-12 sm:pt-[calc(var(--nav-h)+2.5rem)] sm:pb-16 lg:pt-[calc(var(--nav-h)+1rem)] lg:pb-10">
      <div className="gutter grid flex-1 items-center gap-12 sm:gap-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-6">
        {/* the words, over the factory: its trucks drive off behind them */}
        <div className="relative z-10">
          <p className="hero-rise flex items-center gap-2 text-sm font-bold text-muted sm:text-base" style={rise(0)}>
            <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1.2s_infinite]" aria-hidden="true">
              👋
            </span>
            hello, world — i&apos;m
          </p>

          <h1 id="hero-title" className="hero-rise ink-wobble mt-3 text-[2.15rem] leading-[1] sm:mt-4 sm:text-[3.1rem] lg:text-[clamp(2.9rem,4.7vw,4.4rem)] lg:leading-[0.98]" style={rise(1)}>
            {PERSON.first}
            <br />
            <Highlight now delay={1.1}>
              {PERSON.last}
            </Highlight>
          </h1>

          <p className="hero-rise mt-4 min-h-[1.6em] text-base font-bold sm:mt-5 sm:text-[clamp(1.05rem,1.9vw,1.4rem)]" style={rise(2)}>
            <Typewriter words={PERSON.titles} />
          </p>

          <p className="hero-rise mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-base" style={rise(3)}>
            {PERSON.line}
          </p>

          <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-4 gap-y-5 sm:mt-9 sm:gap-x-5 sm:gap-y-6" style={rise(4)}>
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

          <p className="hero-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-muted sm:mt-12 sm:text-sm" style={rise(5)}>
            <span className="inline-flex items-center gap-1.5">
              <Pin className="size-4 text-sienna-500" /> {PERSON.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-sage-600" /> <LocalTime />
            </span>
          </p>
        </div>

        {/* the factory: ideas in, apps out. Its own stacking, under the words, so its trucks drive off behind them */}
        <div className="relative isolate mx-auto w-full max-w-[26rem] sm:max-w-[36rem] lg:ml-auto lg:[--bleed:clamp(0px,calc((100vw_-_76rem)/2_-_0.5rem),20rem)] lg:-mr-(--bleed) lg:w-[min(calc(100%_+_var(--bleed)),calc((100svh_-_12.5rem)*1.455))] lg:max-w-none">
          <Factory />

          {/* margin notes, written once the factory is built */}
          {/* to the left of the machines, clear of their smoke and of the live server, pointing at the line */}
          <div aria-hidden="true" className="hero-rise pointer-events-none absolute left-[5%] top-[27%] hidden -rotate-3 text-sm font-bold leading-tight text-sienna-600 xl:block" style={rise(34)}>
            ideas in,
            <br />
            apps out
            <Doodle kind="arrow-curl" now delay={4.4} className="-mt-6 ml-24 w-16 -rotate-[20deg] text-sienna-500" />
          </div>
          <div aria-hidden="true" className="hero-rise pointer-events-none absolute bottom-[9%] right-[3%] hidden rotate-[-3deg] text-right text-sm font-bold leading-tight text-sage-700 lg:block" style={rise(36)}>
            <Doodle kind="loop" now delay={4.8} className="mb-1 ml-auto mr-10 w-24 rotate-[190deg] text-sage-500" />
            click it to drop
            <br />
            in an idea
          </div>
        </div>
      </div>

      <a href="#about" className="hero-rise group mx-auto mt-8 flex flex-col items-center gap-1 sm:mt-12 lg:mt-3 rounded-lg text-xs font-bold uppercase tracking-[0.3em] text-muted" style={rise(7)}>
        scroll
        <span className="bob">
          <ArrowDown className="size-6 text-sienna-500 transition-transform group-hover:scale-125" />
        </span>
      </a>

      <Doodle kind="squiggle" className="pointer-events-none absolute bottom-6 left-4 hidden w-40 text-sage-400 md:block" delay={2.4} now />
    </section>
  );
}
