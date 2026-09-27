"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, PROJECTS, type Category, type Project } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import Reveal from "@/components/sketch/Reveal";
import SketchButton from "@/components/sketch/SketchButton";
import Doodle from "@/components/sketch/Doodle";
import { Close, GitHub, Plus } from "@/components/sketch/Icons";

const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<Category | "all", string>;
const number = (project: Project) => String(PROJECTS.indexOf(project) + 1).padStart(2, "0");

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (p: Project, from: HTMLElement) => void }) {
  const extra = project.stack.length - 4;
  return (
    <article className={`sketch-box sketch-box--lift ink-${project.ink} flex h-full flex-col p-5 sm:p-7`}>
      <div className="flex items-center justify-between gap-3">
        <span className="ink-wobble text-3xl font-bold leading-none text-(--ink-text) sm:text-4xl">#{number(project)}</span>
        <span className="sketch-chip">{LABEL[project.category]}</span>
      </div>
      <h3 className="mt-4 text-xl sm:mt-5 sm:text-2xl">{project.title}</h3>
      <p className="mt-1 text-sm font-bold text-(--ink-text) sm:text-base">{project.tagline}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-[0.95rem]">{project.points[0]}</p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Built with">
        {project.stack.slice(0, 4).map((tool) => (
          <li key={tool} className="sketch-chip">
            {tool}
          </li>
        ))}
        {extra > 0 && <li className="sketch-chip">+{extra}</li>}
      </ul>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6 sm:pt-7">
        <SketchButton size="sm" calm aria-haspopup="dialog" onClick={(e) => onOpen(project, e.currentTarget)} icon={<Plus className="sketch-btn__icon" />}>
          Details<span className="sr-only"> about {project.title}</span>
        </SketchButton>
        {project.repo && (
          <SketchButton href={project.repo} size="sm" calm icon={<GitHub className="sketch-btn__icon" />}>
            Code<span className="sr-only"> for {project.title} on GitHub</span>
          </SketchButton>
        )}
      </div>
    </article>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
    return () => {
      root.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 sm:p-6">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-concrete-900/45 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        className={`sketch-box ink-${project.ink} relative w-full max-w-2xl`}
        initial={{ opacity: 0, y: 70, rotate: -4, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, rotate: 3, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <span className="sketch-tape -top-3 left-1/2 -translate-x-1/2 -rotate-3" />
        <div className="max-h-[85svh] overflow-y-auto p-5 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--ink-text)">
              #{number(project)} · {LABEL[project.category]}
            </p>
            <SketchButton ref={closeButton} size="sm" calm onClick={onClose} icon={<Close className="sketch-btn__icon" />}>
              Close
            </SketchButton>
          </div>

          <h3 id="project-title" className="ink-wobble mt-4 text-[1.5rem] sm:text-[2rem]">
            <Highlight ink={project.ink} now delay={0.35}>
              {project.title}
            </Highlight>
          </h3>
          <p className="mt-2 text-base font-bold sm:text-lg">{project.tagline}</p>
          <p className="mt-4 flex flex-wrap gap-2">
            <span className="sketch-chip">{project.role}</span>
            <span className="sketch-chip">{project.period}</span>
          </p>

          <h4 className="mt-8 text-sm uppercase tracking-[0.2em] text-muted">what i did</h4>
          <ul className="sketch-list mt-4 space-y-3 text-sm leading-relaxed sm:text-base">
            {project.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <h4 className="mt-8 text-sm uppercase tracking-[0.2em] text-muted">built with</h4>
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.stack.map((tool) => (
              <li key={tool} className="sketch-chip">
                {tool}
              </li>
            ))}
          </ul>

          {project.repo && (
            <div className="mt-10">
              <SketchButton href={project.repo} lasso icon={<GitHub className="sketch-btn__icon" />}>
                View the code
              </SketchButton>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [open, setOpen] = useState<Project | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const shown = filter === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  const openProject = (project: Project, from: HTMLElement) => {
    opener.current = from;
    setOpen(project);
  };
  const close = useCallback(() => setOpen(null), []);

  return (
    <section id="work" aria-labelledby="work-title" className="gutter py-14 sm:py-20 md:py-24">
      <SectionHeading number="03" kicker="selected work" id="work-title" intro="Things I've designed, built and shipped — AI engines, full-stack products, and a few tools made for the fun of it.">
        Stuff I&apos;ve <Highlight mark="circle" ink="sienna">built</Highlight>.
      </SectionHeading>

      <div role="group" aria-label="Filter projects" className="-mt-3 mb-9 flex flex-wrap items-center gap-2.5 sm:-mt-4 sm:mb-12 sm:gap-3">
        {CATEGORIES.map((category) => (
          <SketchButton key={category.id} size="sm" calm aria-pressed={filter === category.id} onClick={() => setFilter(category.id)}>
            {category.label}
          </SketchButton>
        ))}
        <Doodle kind="arrow-curl" className="ml-2 hidden w-16 -scale-x-100 rotate-12 text-concrete-400 sm:block" delay={0.4} />
        <span className="hidden text-sm font-bold text-muted sm:inline">pick one!</span>
        <p role="status" className="sr-only">
          Showing {shown.length} {shown.length === 1 ? "project" : "projects"}
        </p>
      </div>

      <Reveal>
        <motion.ul layout className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((project) => (
              <motion.li
                key={project.slug}
                layout
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
              >
                <ProjectCard project={project} onOpen={openProject} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </Reveal>

      <AnimatePresence onExitComplete={() => opener.current?.focus()}>
        {open && <ProjectModal key={open.slug} project={open} onClose={close} />}
      </AnimatePresence>
    </section>
  );
}
