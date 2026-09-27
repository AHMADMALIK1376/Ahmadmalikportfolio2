"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ComponentType } from "react";
import { PROJECTS, SERVICES } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Highlight from "@/components/sketch/Highlight";
import { ArrowRight, Close } from "@/components/sketch/Icons";
import LlmRig from "@/components/rigs/LlmRig";
import ArchRig from "@/components/rigs/ArchRig";
import WebRig from "@/components/rigs/WebRig";
import BackendRig from "@/components/rigs/BackendRig";
import FrontendRig from "@/components/rigs/FrontendRig";

/**
 * One kind of work, opened out of the wallet: everything about it on the left,
 * and on the right its working drawing, which builds itself as the card opens
 * and then runs — the same five animations as the first portfolio's What I do,
 * redrawn in this one's hand. The arrows (and the keyboard's) step to the next
 * or the previous card, which builds itself again.
 */

const RIGS: Record<(typeof SERVICES)[number]["doodle"], ComponentType<{ className?: string }>> = {
  llm: LlmRig,
  architecture: ArchRig,
  web: WebRig,
  backend: BackendRig,
  frontend: FrontendRig,
};
const NAMES = Object.fromEntries(PROJECTS.map((p) => [p.slug, p.title]));

type Props = { index: number; direction: number; onClose: () => void; onStep: (by: number) => void };

export default function ServiceModal({ index, direction, onClose, onStep }: Props) {
  const service = SERVICES[index];
  const Rig = RIGS[service.doodle];
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const count = SERVICES.length;

  useEffect(() => {
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      root.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key !== "Tab" || !panel.current) return;
      // keep the keyboard inside the dialog
      const stops = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-3 sm:p-6">
      <motion.div aria-hidden="true" className="absolute inset-0 bg-concrete-900/45 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-title"
        className={`sketch-box ink-${service.ink} relative w-full max-w-5xl`}
        initial={{ opacity: 0, y: 80, rotate: -3, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, rotate: 2, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 210, damping: 22 }}
      >
        <span className="sketch-tape -top-3 left-10 -rotate-6" />
        <span className="sketch-tape -top-3 right-10 rotate-6" />

        <div className="max-h-[88svh] overflow-y-auto p-5 sm:p-8">
          {/* where this card is among them, the arrows, and the way out */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-(--ink-text)">
              0{index + 1} / 0{count} · what i do
            </p>
            <div className="flex items-center gap-2">
              <SketchButton size="sm" calm onClick={() => onStep(-1)} icon={<ArrowRight className="sketch-btn__icon rotate-180" />}>
                <span className="sr-only">Previous</span>
              </SketchButton>
              <SketchButton size="sm" calm onClick={() => onStep(1)} icon={<ArrowRight className="sketch-btn__icon" />}>
                <span className="sr-only">Next</span>
              </SketchButton>
              <SketchButton ref={closeButton} size="sm" calm onClick={onClose} icon={<Close className="sketch-btn__icon" />}>
                Close
              </SketchButton>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              className="mt-6 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-10"
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* the working drawing, building itself and then running */}
              <div className="order-first h-[15rem] rounded-[1.4rem] bg-paper-3/55 p-2 shadow-[inset_3px_3px_0_1px_rgb(45_47_43/0.12)] sm:h-[20rem] md:order-last md:h-[26rem]">
                <Rig className="h-full w-full" />
              </div>

              <div>
                <h3 id="service-title" className="ink-wobble text-[1.5rem] sm:text-[2rem]">
                  <Highlight ink={service.ink} now delay={0.3}>
                    {service.title}
                  </Highlight>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{service.summary}</p>

                <h4 className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">how it goes</h4>
                <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {service.steps.map((step, i) => (
                    <motion.li key={step} className="flex items-center gap-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}>
                      <span className="sketch-chip">{step}</span>
                      {i < service.steps.length - 1 && <ArrowRight className="size-3.5 text-concrete-500" />}
                    </motion.li>
                  ))}
                </ol>

                <h4 className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">what you get</h4>
                <ul className="sketch-list mt-3 space-y-2.5 text-sm leading-relaxed">
                  {service.delivers.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <h4 className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">tools</h4>
                <ul className="mt-3 flex flex-wrap gap-2 [--ink-fill:var(--color-paper-2)]">
                  {service.tools.map((tool) => (
                    <li key={tool} className="sketch-chip">
                      {tool}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-xs text-muted">
                  <span className="font-bold uppercase tracking-[0.2em]">seen in</span>{" "}
                  {service.seenIn.map((slug, i) => (
                    <span key={slug}>
                      <span className="font-bold text-ink">{NAMES[slug]}</span>
                      {i < service.seenIn.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
