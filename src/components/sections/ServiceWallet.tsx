"use client";

import { AnimatePresence, useInView } from "motion/react";
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SERVICES } from "@/lib/content";
import { Sketch } from "@/components/sketch/Doodle";
import Doodle from "@/components/sketch/Doodle";
import { DRAWINGS } from "./drawings";
import ServiceModal from "./ServiceModal";
import styles from "./Wallet.module.css";

/**
 * What I do: the list of the five kinds of work, and the wallet they are kept
 * in. Naming one in the list lifts its card out of the wallet; clicking either
 * opens the card, with its working drawing.
 */

const POCKET =
  "M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z";
const STITCH =
  "M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z";

export default function ServiceWallet({ heading }: { heading: ReactNode }) {
  const wallet = useRef<HTMLDivElement>(null);
  const seen = useInView(wallet, { once: true, amount: 0.35 });
  const [peek, setPeek] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const opener = useRef<HTMLElement | null>(null);

  const show = (index: number, from: HTMLElement) => {
    opener.current = from;
    setDirection(1);
    setOpen(index);
  };
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((by: number) => {
    setDirection(by);
    setOpen((i) => (i === null ? i : (i + by + SERVICES.length) % SERVICES.length));
  }, []);

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-8">
      {/* the heading, and the list: every kind of work, by name */}
      <div className="min-w-0">
        {heading}
        <ol className="-mx-3 mt-2 space-y-0.5 lg:space-y-0" aria-label="What I do">
          {SERVICES.map((service, i) => (
            <li key={service.title} data-reveal="" style={{ "--reveal-i": i + 2 } as CSSProperties}>
              <button
                type="button"
                onClick={(e) => show(i, e.currentTarget)}
                onPointerEnter={() => setPeek(i)}
                onPointerLeave={() => setPeek(null)}
                onFocus={() => setPeek(i)}
                onBlur={() => setPeek(null)}
                className={`ink-${service.ink} group flex w-full items-baseline gap-4 rounded-2xl px-3 py-2 text-left lg:py-1.5 transition-colors hover:bg-(--ink-fill) focus-visible:bg-(--ink-fill)`}
              >
                <span className="text-xs font-bold text-sienna-600">0{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="ink-wobble relative isolate inline-block text-base font-bold sm:text-lg">
                    <span className="absolute inset-x-0 bottom-0.5 -z-10 h-[0.45em] origin-left scale-x-0 rounded bg-(--ink-hl) transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                    {service.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{service.steps.join(" → ")}</span>
                </span>
                <span className="text-xs font-bold text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">open ↗</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* the wallet */}
      <div className="relative" data-reveal="" style={{ "--reveal-i": 3 } as CSSProperties}>
        <div ref={wallet} className={styles.wallet} data-in={seen ? "" : undefined} data-open={peek !== null ? "" : undefined}>
          <div className={styles.back} />

          {SERVICES.map((service, i) => (
            <button
              key={service.title}
              type="button"
              className={`${styles.card} ink-${service.ink}`}
              data-peek={peek === i ? "" : undefined}
              onClick={(e) => show(i, e.currentTarget)}
              aria-label={`${service.title}: open`}
            >
              <span className={styles.inner}>
                <span>
                  <span className={styles.top}>
                    <span className={styles.name}>
                      <span className={styles.number}>0{i + 1}</span>
                      {service.title}
                    </span>
                    <Sketch box="0 0 120 90" paths={DRAWINGS[service.doodle]} className={styles.icon} strokeWidth={3.4} duration={0.4} delay={0.6 + i * 0.1} />
                  </span>
                  <span className={styles.summary}>{service.summary}</span>
                </span>
                <span className={styles.bottom}>
                  <span>
                    <span className={styles.label}>flow</span>
                    {service.steps[0]} → {service.steps[service.steps.length - 1]}
                  </span>
                  <span className={styles.hidden}>• • • •</span>
                </span>
              </span>
              <span className={styles.reveal}>open ↗</span>
            </button>
          ))}

          {/* the pocket the cards are tucked into */}
          <div className={styles.pocket} aria-hidden="true">
            <svg viewBox="0 0 280 160" preserveAspectRatio="none" fill="none">
              <path d={POCKET} fill="#5c7449" />
              <path d={STITCH} stroke="#9caf88" strokeWidth={1.5} strokeDasharray="6 4" />
            </svg>
            <div className={styles.pocketContent}>
              <div className="relative">
                <span className={styles.stars}>* * * * *</span>
                <span className={styles.count}>05 ways I build</span>
              </div>
              <span className={styles.pocketLabel}>what i do</span>
              <span className={styles.eye}>
                <svg className={styles.eyeShut} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="3" y1="3" x2="21" y2="21" />
                </svg>
                <svg className={styles.eyeOpen} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* a note in the margin */}
        <p aria-hidden="true" className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-sienna-600 [@media(hover:none)]:hidden">
          <Doodle kind="arrow-down" className="h-8 w-5 rotate-180 text-sienna-500" />
          point at the wallet · click a card
        </p>
        <p aria-hidden="true" className="mt-3 hidden text-center text-sm font-bold text-sienna-600 [@media(hover:none)]:block">
          tap a card to open it
        </p>
      </div>

      <AnimatePresence onExitComplete={() => opener.current?.focus()}>
        {open !== null && <ServiceModal key="service" index={open} direction={direction} onClose={close} onStep={step} />}
      </AnimatePresence>
    </div>
  );
}
