"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { CATEGORIES, PROJECTS } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Highlight from "@/components/sketch/Highlight";
import { ArrowRight, Close, GitHub } from "@/components/sketch/Icons";
import { PROJECT_RIGS } from "@/components/rigs/projects";

/**
 * One project, opened from the ring: everything about it on one side, and on
 * the other its working drawing — the first portfolio's project animations,
 * redrawn in this one's hand — which builds itself as the card opens and then
 * runs. The arrows (and the keyboard's) step to the next or previous project.
 * All of it fits on one screen.
 */

const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>;

type Props = { index: number; direction: number; onClose: () => void; onStep: (by: number) => void };

export default function ProjectModal({ index, direction, onClose, onStep }: Props) {
  const project = PROJECTS[index];
  const Rig = PROJECT_RIGS[project.slug];
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

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
    <div className="fixed inset-0 z-[60] grid place-items-center p-2 sm:p-6">
      <motion.div aria-hidden="true" className="absolute inset-0 bg-concrete-900/45 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        className={`sketch-box ink-${project.ink} relative w-full max-w-5xl`}
        initial={{ opacity: 0, y: 80, rotate: -3, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, rotate: 2, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 210, damping: 22 }}
      >
        <span className="sketch-tape -top-3 left-10 -rotate-6" />
        <span className="sketch-tape -top-3 right-10 rotate-6" />

        <div className="max-h-[calc(100svh-1rem)] overflow-y-auto p-3.5 sm:max-h-[92svh] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-(--ink-text) sm:text-xs">
              #{String(index + 1).padStart(2, "0")} · {LABEL[project.category]}
            </p>
            <div className="flex items-center gap-2">
              <SketchButton size="sm" calm onClick={() => onStep(-1)} icon={<ArrowRight className="sketch-btn__icon rotate-180" />}>
                <span className="sr-only">Previous project</span>
              </SketchButton>
              <SketchButton size="sm" calm onClick={() => onStep(1)} icon={<ArrowRight className="sketch-btn__icon" />}>
                <span className="sr-only">Next project</span>
              </SketchButton>
              <SketchButton ref={closeButton} size="sm" calm onClick={onClose} icon={<Close className="sketch-btn__icon" />}>
                Close
              </SketchButton>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={index}
              className="mt-3 grid gap-4 md:mt-5 md:gap-5 md:grid-cols-[1fr_1.1fr] md:gap-8"
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* the working drawing, building itself and then running */}
              <div className="order-first h-[8.5rem] rounded-[1.4rem] bg-paper-3/55 p-2 shadow-[inset_3px_3px_0_1px_rgb(45_47_43/0.12)] sm:h-[15rem] md:order-last md:h-auto md:min-h-[21rem]">
                {Rig && <Rig className="h-full w-full" />}
              </div>

              <div>
                <h3 id="project-title" className="ink-wobble text-[1.3rem] sm:text-[1.7rem]">
                  <Highlight ink={project.ink} now delay={0.3}>
                    {project.title}
                  </Highlight>
                </h3>
                <p className="mt-1.5 text-[0.8rem] font-bold sm:text-sm">{project.tagline}</p>
                <p className="mt-2 flex flex-wrap gap-1.5 sm:mt-2.5">
                  <span className="sketch-chip">{project.role}</span>
                  <span className="sketch-chip">{project.period}</span>
                </p>

                <h4 className="mt-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted sm:mt-4">how it works</h4>
                <ol className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                  {project.flow.map((step, i) => (
                    <motion.li key={step} className="flex items-center gap-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}>
                      <span className="sketch-chip">{step}</span>
                      {i < project.flow.length - 1 && <ArrowRight className="size-3 text-concrete-500" />}
                    </motion.li>
                  ))}
                </ol>

                <h4 className="mt-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted sm:mt-4">what i did</h4>
                <ul className="sketch-list mt-2 space-y-1 text-[0.7rem] leading-snug sm:text-[0.78rem]">
                  {project.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <ul className="flex flex-wrap gap-1.5 [--ink-fill:var(--color-paper-2)]" aria-label="Built with">
                    {project.stack.map((tool) => (
                      <li key={tool} className="sketch-chip">
                        {tool}
                      </li>
                    ))}
                  </ul>
                  {project.repo && (
                    <SketchButton href={project.repo} size="sm" tone="sage" icon={<GitHub className="sketch-btn__icon" />}>
                      Code
                    </SketchButton>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
