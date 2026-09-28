"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { NAV, PERSON, RESUME_PDF } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import { Close, Download, GitHub, LinkedIn, Menu } from "@/components/sketch/Icons";
import Doodle from "@/components/sketch/Doodle";

/**
 * The bar along the top. It steps out of the way while you read down the page
 * and comes back the moment you scroll up; the section you are in stays
 * highlighted; and a pencil line along its bottom edge shows how far down the
 * page you are.
 */
export default function Nav() {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    setHidden(y > 240 && y > previous + 2 && !open);
    if (y < previous - 2) setHidden(false);
  });

  // which section is in the middle of the screen
  useEffect(() => {
    // the first screen is watched too, so nothing is highlighted while you are on it
    const sections = ["top", ...NAV.map((item) => item.id)].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id === "top" ? null : entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // the open menu covers the page: hold the page still, and close on Escape
  useEffect(() => {
    if (!open) return;
    const toggle = menuButton.current;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = before;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={false}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <div className={`transition-colors duration-300 ${scrolled ? "bg-paper/85 backdrop-blur-md" : "bg-transparent"}`}>
          <nav aria-label="Main" className="gutter-wide flex h-(--nav-h) items-center justify-between gap-4">
            <a href="#top" className="group flex items-center gap-2 rounded-lg text-base font-bold tracking-tight sm:text-xl" aria-label={`${PERSON.name}, back to the top`}>
              <span className="text-sienna-500 transition-transform duration-500 group-hover:rotate-[200deg]">
                <Doodle kind="sparkle" now className="size-6" strokeWidth={4} duration={0.6} />
              </span>
              <span className="ink-wobble">
                ahmad<span className="text-sienna-500">.</span>malik
              </span>
            </a>

            <ul className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <li key={item.id}>
                  <SketchButton href={`#${item.id}`} size="sm" calm className="sketch-btn--ghost" aria-current={current === item.id ? "location" : undefined}>
                    {item.label}
                  </SketchButton>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <SketchButton href={RESUME_PDF} download="M-Ahmad-Malik-Resume.pdf" size="sm" tone="sage" calm icon={<Download className="sketch-btn__icon" />} className="hidden sm:inline-flex">
                Resume
              </SketchButton>
              <SketchButton
                ref={menuButton}
                size="sm"
                calm
                className="lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((v) => !v)}
                icon={open ? <Close className="sketch-btn__icon" /> : <Menu className="sketch-btn__icon" />}
              >
                {open ? "Close" : "Menu"}
              </SketchButton>
            </div>
          </nav>
        </div>

        {/* how far down the page: a pencil line drawn along the bar's bottom edge */}
        <motion.div aria-hidden="true" className="ink-wobble h-[3px] origin-left bg-sienna-500/80" style={{ scaleX: progress }} />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-40 overflow-y-auto bg-paper pt-(--nav-h) lg:hidden"
            initial={{ clipPath: "circle(0% at 92% 2.2rem)" }}
            animate={{ clipPath: "circle(150% at 92% 2.2rem)" }}
            exit={{ clipPath: "circle(0% at 92% 2.2rem)" }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="gutter flex min-h-full flex-col py-8">
              <motion.ul
                className="flex flex-col gap-2"
                initial="closed"
                animate="open"
                variants={{ open: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
              >
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.id}
                    variants={{ closed: { opacity: 0, x: -30, rotate: -3 }, open: { opacity: 1, x: 0, rotate: 0 } }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline gap-4 rounded-lg py-2 text-3xl font-bold sm:text-5xl"
                      aria-current={current === item.id ? "location" : undefined}
                    >
                      <span className="text-base text-sienna-600">0{i + 1}</span>
                      <span className="ink-wobble relative isolate">
                        <span className="absolute inset-x-0 bottom-1 -z-10 h-[0.45em] origin-left scale-x-0 rounded bg-(--hl-sage) transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=location]:scale-x-100" />
                        {item.label.toLowerCase()}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-auto flex flex-wrap items-center gap-4 pt-12">
                <SketchButton href={RESUME_PDF} download="M-Ahmad-Malik-Resume.pdf" tone="sage" icon={<Download className="sketch-btn__icon" />}>
                  Resume
                </SketchButton>
                <SketchButton href={PERSON.github} calm icon={<GitHub className="sketch-btn__icon" />}>
                  GitHub
                </SketchButton>
                <SketchButton href={PERSON.linkedin} calm icon={<LinkedIn className="sketch-btn__icon" />}>
                  LinkedIn
                </SketchButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
