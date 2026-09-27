"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { CERTIFICATIONS, EDUCATION, EXPERIENCE, type Ink, type Role } from "@/lib/content";
import { ArrowUpRight } from "@/components/sketch/Icons";
import { BRIDGE, FUTURE, Ground, H, ROAD, Scenery, Sky, W } from "./MapArt";
import styles from "./Map.module.css";

/**
 * Experience, as a road trip: a hand-drawn map with every role on one road,
 * in order, and the workshop and hackathons as flags just off it.
 *
 * When the map comes into view the road draws itself, the pins drop onto it,
 * and a small van drives from the first stop to the last, pausing at each while
 * its details are read beside the map. Pointing at a pin puts up its road sign;
 * choosing one (on the map or in the key) sends the van there and ends the tour.
 */

type Glyph = "laptop" | "cap" | "branch" | "pen" | "steps" | "bolt" | "atom" | "spark";

type Stop = {
  id: string;
  kind: "Role" | "Education" | "Workshop" | "Hackathon";
  /** on the road itself, or a landmark just off it */
  road: boolean;
  at: [number, number];
  /** what its road sign says, and what the key calls it */
  sign: string;
  short: string;
  glyph: Glyph;
  ink: Ink;
  title: string;
  org: string;
  url?: string;
  period?: string;
  detail: string;
  points: string[];
  /** the passport stamp: a word above, the date, a word below */
  stamp: [string, string, string];
  side?: "above" | "below";
  align?: "start" | "end";
  /** where its name is written on the map */
  label: "left" | "right" | "above" | "below";
};

function role(title: string): Role {
  const found = EXPERIENCE.find((r) => r.title === title);
  if (!found) throw new Error(`No role called ${title}`);
  return found;
}

function badge(title: string) {
  const found = CERTIFICATIONS.find((c) => c.title === title);
  if (!found) throw new Error(`No badge called ${title}`);
  return found;
}

const fromRole = (r: Role) => ({ title: r.title, org: r.company, url: r.url, period: r.period, detail: r.detail, points: r.points, ink: r.ink });

const WORKSHOP = badge("GitHub Open Source Collaboration");
const CUST = badge("CUST Hackathon 2026");
const ATOM = badge("Atom Camp Hackathon");

/** In the order they happened. */
const STOPS: Stop[] = [
  {
    id: "freelance",
    label: "above",
    kind: "Role",
    road: true,
    at: [84, 300],
    sign: "Freelance · 2023",
    short: "Freelance",
    glyph: "laptop",
    ...fromRole(role("Freelance Full-Stack Developer")),
    stamp: ["since", "2023", "freelance"],
    align: "start",
  },
  {
    id: "iqra",
    label: "left",
    kind: "Education",
    road: true,
    at: [196, 214],
    sign: "Iqra University",
    short: "Iqra Uni",
    glyph: "cap",
    ink: "concrete",
    title: EDUCATION.degree,
    org: EDUCATION.school,
    period: EDUCATION.period,
    detail: "Undergraduate · in progress",
    points: [EDUCATION.note],
    stamp: ["since", "dec 23", "bs cs"],
    align: "start",
  },
  {
    id: "workshop",
    label: "left",
    kind: "Workshop",
    road: false,
    at: [138, 170],
    sign: "Open-source workshop",
    short: "Git workshop",
    glyph: "branch",
    ink: "sage",
    title: WORKSHOP.title,
    org: WORKSHOP.where,
    detail: "Workshop",
    points: [WORKSHOP.note],
    stamp: ["iqra", "git", "workshop"],
  },
  {
    id: "uiux",
    label: "below",
    kind: "Role",
    road: true,
    at: [316, 268],
    sign: "UI/UX design · 2025",
    short: "UI/UX",
    glyph: "pen",
    ...fromRole(role("UI/UX Designer")),
    stamp: ["since", "nov 25", "design"],
    side: "below",
  },
  {
    id: "growstep",
    label: "left",
    kind: "Role",
    road: true,
    at: [404, 170],
    sign: "Growstep · 2026",
    short: "Growstep",
    glyph: "steps",
    ...fromRole(role("Website Development Intern")),
    stamp: ["jan–apr", "2026", "intern"],
  },
  {
    id: "cust",
    label: "below",
    kind: "Hackathon",
    road: false,
    at: [452, 238],
    sign: "CUST Hackathon",
    short: "CUST",
    glyph: "bolt",
    ink: "sage",
    title: CUST.title,
    org: CUST.where,
    period: "2026",
    detail: "Hackathon",
    points: [CUST.note],
    stamp: ["cust", "2026", "hackathon"],
    side: "below",
  },
  {
    id: "atom",
    label: "below",
    kind: "Hackathon",
    road: false,
    at: [540, 192],
    sign: "Atom Camp · Jun 2026",
    short: "Atom Camp",
    glyph: "atom",
    ink: "sage",
    title: ATOM.title,
    org: "Atom Camp",
    period: "16–17 Jun 2026",
    detail: "Agentic AI",
    points: [ATOM.note],
    stamp: ["jun 16–17", "2026", "hackathon"],
    side: "below",
  },
  {
    id: "anma",
    label: "above",
    kind: "Role",
    road: true,
    at: [534, 112],
    sign: "Anma Tech · now",
    short: "Anma Tech",
    glyph: "spark",
    ...fromRole(role("Full Stack AI Engineer")),
    stamp: ["jul", "2026", "now"],
  },
];

const LAST = STOPS.length - 1;
const ROAD_COUNT = STOPS.filter((s) => s.road).length;
/** each stop's number on the road, or 0 for the landmarks */
const NUMBER = STOPS.reduce<number[]>((acc, stop) => [...acc, stop.road ? acc.filter(Boolean).length + 1 : 0], []);

/** how long the road takes to draw, and how long the van waits at each stop, in ms */
const DRAW = 2200;
const PAUSE = 3200;
/** how far short of a town the van parks, so the pin stands clear of it */
const PARK = 15;

const percent = ([x, y]: [number, number]) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

export default function CareerMap() {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [touring, setTouring] = useState(false);
  const [driving, setDriving] = useState(false);
  const road = useRef<SVGPathElement>(null);
  const van = useRef<SVGGElement>(null);
  const keys = useRef<(HTMLButtonElement | null)[]>([]);
  // the van's trip, kept out of React: where it is on the road, where each town is, and its clocks
  const trip = useRef({ at: 0, towns: [] as number[], frame: 0, timer: 0, touring: false });
  const ids = useId();
  const mask = `${ids}-road`;
  const panel = `${ids}-panel`;

  /** Where along the road each town is. */
  const measure = () => {
    const path = road.current;
    if (!path || trip.current.towns.length) return;
    const total = path.getTotalLength();
    trip.current.towns = STOPS.map((stop) => {
      let best = 0;
      let bestGap = Infinity;
      for (let k = 0; k <= 400; k++) {
        const s = (total * k) / 400;
        const p = path.getPointAtLength(s);
        const gap = (p.x - stop.at[0]) ** 2 + (p.y - stop.at[1]) ** 2;
        if (gap < bestGap) {
          bestGap = gap;
          best = s;
        }
      }
      return best;
    });
  };

  /** Puts the van at `s` along the road, facing the way it is going. */
  const place = (s: number, way: number) => {
    const path = road.current;
    if (!path || !van.current) return;
    const total = path.getTotalLength();
    const p = path.getPointAtLength(s);
    const ahead = path.getPointAtLength(Math.min(total, s + 2));
    const behind = path.getPointAtLength(Math.max(0, s - 2));
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI + (way < 0 ? 180 : 0);
    van.current.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
  };

  /** Drives the van to stop `i`, easing off and on, then calls `then`. */
  const driveTo = (i: number, then?: () => void) => {
    const t = trip.current;
    cancelAnimationFrame(t.frame);
    const town = t.towns[i] ?? 0;
    const from = t.at;
    const way = town >= from ? 1 : -1;
    const to = Math.max(0, town - way * PARK);
    const distance = to - from;
    if (Math.abs(distance) < 1) {
      then?.();
      return;
    }
    const ms = Math.min(2400, Math.max(700, Math.abs(distance) * 5));
    let start = -1;
    setDriving(true);
    const step = (now: number) => {
      if (start < 0) start = now;
      const k = Math.min(1, (now - start) / ms);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      t.at = from + distance * eased;
      place(t.at, way);
      if (k < 1) {
        t.frame = requestAnimationFrame(step);
      } else {
        setDriving(false);
        then?.();
      }
    };
    t.frame = requestAnimationFrame(step);
  };

  const endTour = () => {
    trip.current.touring = false;
    clearTimeout(trip.current.timer);
    setTouring(false);
  };

  /** From the first stop to the last, pausing at each; landmarks are looked at from the road. */
  const tour = () => {
    const t = trip.current;
    endTour();
    measure();
    cancelAnimationFrame(t.frame);
    t.touring = true;
    t.at = 0;
    place(0, 1);
    setTouring(true);
    setActive(0);
    driveTo(0);
    const visit = (i: number) => {
      if (!t.touring) return;
      if (i > LAST) {
        endTour();
        return;
      }
      const arrive = () => {
        if (!t.touring) return;
        setActive(i);
        t.timer = window.setTimeout(() => visit(i + 1), PAUSE);
      };
      if (STOPS[i].road) driveTo(i, arrive);
      else arrive();
    };
    t.timer = window.setTimeout(() => visit(1), PAUSE);
  };

  const choose = (i: number) => {
    endTour();
    measure();
    setActive(i);
    if (STOPS[i].road) driveTo(i);
  };

  // once the map is seen: draw the road, then set off (or, for reduced motion, simply be at the last stop)
  const onSeen = useEffectEvent(() => {
    if (reduced) {
      measure();
      const t = trip.current;
      t.at = Math.max(0, (t.towns[LAST] ?? 0) - PARK);
      place(t.at, 1);
      setActive(LAST);
      return;
    }
    tour();
  });
  useEffect(() => {
    if (!seen) return;
    const timer = window.setTimeout(onSeen, reduced ? 0 : DRAW + 350);
    return () => clearTimeout(timer);
  }, [seen, reduced]);

  useEffect(() => {
    const t = trip.current;
    return () => {
      cancelAnimationFrame(t.frame);
      clearTimeout(t.timer);
    };
  }, []);

  // the row of stops can be walked with the arrow keys
  const walk = (event: KeyboardEvent<HTMLOListElement>) => {
    const by = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!by) return;
    event.preventDefault();
    const next = (active + by + STOPS.length) % STOPS.length;
    choose(next);
    keys.current[next]?.focus();
  };

  const stop = STOPS[active];
  const drawn = seen || reduced;

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8 xl:items-stretch">
      {/* the map */}
      <div ref={box} className={`sketch-box p-1.5 sm:p-2 ${styles.map}`} data-in={drawn ? "" : undefined} data-touring={touring ? "" : undefined}>
        <div className={styles.canvas}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.art} aria-hidden="true" focusable="false">
            <defs>
              <clipPath id={`${ids}-frame`}>
                <rect width={W} height={H} rx={18} />
              </clipPath>
              <clipPath id={`${ids}-bridge`}>
                <circle cx={BRIDGE.x} cy={BRIDGE.y} r={13} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${ids}-frame)`}>
            <Ground clip={`${ids}-sea`} />

            {/* the road: drawn in as the map arrives */}
            <defs>
              <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                <motion.path
                  d={ROAD}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={34}
                  strokeLinecap="round"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: drawn ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : DRAW / 1000, ease: [0.45, 0, 0.3, 1] }}
                />
              </mask>
            </defs>
            <path d={FUTURE} fill="none" stroke="#7c817a" strokeWidth={2} strokeDasharray="1.5 6" strokeLinecap="round" className={styles.future} />
            <g mask={`url(#${mask})`}>
              {/* the bridge: the road's edges, stood up as parapets where it crosses the river */}
              <g clipPath={`url(#${ids}-bridge)`} fill="none">
                <path d={ROAD} stroke="#2d2f2b" strokeOpacity={0.7} strokeWidth={20} />
                <path d={ROAD} stroke="#e8ebe1" strokeWidth={16.6} />
              </g>
              <g filter="url(#desk-ink)" fill="none" strokeLinecap="round">
                <path d={ROAD} stroke="#2d2f2b" strokeOpacity={0.55} strokeWidth={12.5} />
                <path d={ROAD} stroke="#f7f7f3" strokeWidth={9.6} />
              </g>
              <path ref={road} d={ROAD} fill="none" stroke="#bc4e26" strokeWidth={2.2} strokeDasharray="7 7" strokeLinecap="round" />
              {STOPS.map((s, i) =>
                s.road ? <circle key={s.id} cx={s.at[0]} cy={s.at[1]} r={5.2} fill="#f4f4f0" stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={1.5} data-at={i} /> : null,
              )}
            </g>
            <text x={54} y={342} fontSize={7.5} fontWeight={700} letterSpacing={1.6} textAnchor="middle" fill="#5e625c" className={styles.start}>
              START
            </text>

            <Scenery />

            {/* the van */}
            <g ref={van} className={styles.van} transform="translate(84 300) rotate(-46)" data-driving={driving ? "" : undefined}>
              <g className={styles.vanBody}>
                <rect x={-9} y={-4} width={20} height={11} rx={3.5} fill="#2d2f2b" fillOpacity={0.35} />
                <rect x={-11} y={-6} width={20} height={11} rx={3.5} fill="#d0714c" stroke="#2d2f2b" strokeOpacity={0.75} strokeWidth={1.2} />
                <rect x={2} y={-4.5} width={4.6} height={8} rx={1.6} fill="#f4f4f0" stroke="#2d2f2b" strokeOpacity={0.5} strokeWidth={0.8} />
                <rect x={-8.6} y={-4.5} width={2.8} height={8} rx={1} fill="#f4f4f0" fillOpacity={0.75} />
                <rect x={-4.6} y={-5} width={5.6} height={9} rx={1} fill="#bc4e26" />
              </g>
            </g>

            <Sky />
            </g>
          </svg>

          {/* the places: pins on the road, flags off it, and the sign each puts up */}
          <div className={styles.stops}>
            {STOPS.map((s, i) => {
              const on = i === active || i === hover;
              return (
                <div
                  key={s.id}
                  className={styles.stop}
                  style={{ ...percent(s.at), "--d": `${s.road ? 0.08 + (NUMBER[i] - 1) * 0.48 : DRAW / 1000 + 0.1 + i * 0.05}s` } as CSSProperties}
                  data-road={s.road ? "" : undefined}
                  data-active={i === active ? "" : undefined}
                  data-on={on ? "" : undefined}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className={styles.pin}
                    onClick={() => choose(i)}
                    onPointerEnter={() => setHover(i)}
                    onPointerLeave={() => setHover(null)}
                  >
                    {s.road ? <Pin n={NUMBER[i]} now={i === LAST} /> : <Flag />}
                  </button>
                  {on && (
                    <span className={styles.sign} data-side={s.side ?? "above"} data-align={s.align} data-kind={s.road ? "road" : "landmark"}>
                      <span className={styles.signIcon}>
                        <Icon glyph={s.glyph} />
                      </span>
                      {s.sign}
                    </span>
                  )}
                  {!on && (
                    <span className={styles.label} data-label={s.label}>
                      {s.short}
                    </span>
                  )}
                  {i === LAST && <span className={styles.here}>you are here</span>}
                </div>
              );
            })}

            {/* where the road goes next */}
            <a href="#contact" className={styles.next} style={percent([618, 56])} aria-label="Next stop: your team? Get in touch">
              ?<span className={styles.nextSign}>next stop: your team?</span>
            </a>
          </div>
        </div>
      </div>

      {/* the log: the chosen stop in full, and every stop in a row to step through */}
      <div className="flex min-w-0 flex-col xl:h-0 xl:min-h-full">
        <div id={panel} className={`sketch-box ink-${stop.ink} ${styles.log}`}>
          <div className={styles.page}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="flex flex-wrap items-center gap-2 pr-16 sm:pr-20">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-sienna-600 sm:text-[0.65rem]">
                    {stop.road ? `stop ${NUMBER[active]} of ${ROAD_COUNT}` : "along the way"}
                  </span>
                  <span className="sketch-chip !text-[0.62rem] sm:!text-[0.68rem]">{stop.kind}</span>
                </p>
                <h3 className="mt-2 pr-14 text-[0.95rem] leading-snug sm:mt-3 sm:pr-16 sm:text-lg">{stop.title}</h3>
                <p className="mt-0.5 text-[0.82rem] font-bold text-(--ink-text) sm:mt-1 sm:text-base">
                  {stop.url ? (
                    <a href={stop.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 rounded hover:underline hover:decoration-wavy hover:underline-offset-4">
                      {stop.org}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  ) : (
                    stop.org
                  )}
                </p>
                <p className="mt-1 text-[0.66rem] font-bold text-muted sm:text-xs">
                  {stop.period && <span>{stop.period} · </span>}
                  {stop.detail}
                </p>
                <svg viewBox="0 0 24 24" className={styles.doodle} aria-hidden="true">
                <motion.path
                  d={GLYPHS[stop.glyph]}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduced ? 0 : 1.2, ease: "easeInOut", delay: 0.25 }}
                />
              </svg>
              <ul className="sketch-list mt-2.5 space-y-1.5 text-[0.7rem] leading-relaxed text-ink/90 sm:mt-3.5 sm:space-y-2 sm:text-[0.78rem]">
                  {stop.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.foot}>
            <ol className={styles.steps} aria-label="Stops on the map" onKeyDown={walk}>
              {STOPS.map((s, i) => (
                <li key={s.id}>
                  <button
                    ref={(el) => {
                      keys.current[i] = el;
                    }}
                    type="button"
                    className={styles.step}
                    aria-label={`${s.short}: ${s.kind.toLowerCase()}`}
                    aria-pressed={i === active}
                    aria-controls={panel}
                    data-road={s.road ? "" : undefined}
                    onClick={() => choose(i)}
                    onPointerEnter={() => setHover(i)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                  >
                    {s.road ? NUMBER[i] : <FlagMark />}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={tour} className={styles.replay} disabled={touring}>
              {touring ? "driving…" : "↻ replay"}
            </button>
          </div>

          {/* the passport stamp for this stop, thumped on */}
          <AnimatePresence initial={false}>
            <motion.span
              key={stop.id}
              aria-hidden="true"
              className={styles.stamp}
              initial={{ opacity: 0, scale: 1.6, rotate: -30 }}
              animate={{ opacity: 0.9, scale: 1, rotate: -12 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ type: "spring", stiffness: 460, damping: 17, delay: 0.16 }}
            >
              <span>{stop.stamp[0]}</span>
              <strong>{stop.stamp[1]}</strong>
              <span>{stop.stamp[2]}</span>
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── the marks ────────────────────────────────────────────────────────────

function Pin({ n, now }: { n: number; now: boolean }) {
  return (
    <svg viewBox="0 0 28 36" className="size-full overflow-visible">
      <path d="M14 35C14 35 3 22.5 3 13.5A11 11 0 0 1 25 13.5C25 22.5 14 35 14 35Z" fill={now ? "#bc4e26" : "#d0714c"} stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M7.6 10.4A7.4 7.4 0 0 1 11.4 6.6" fill="none" stroke="#f4f4f0" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={14} cy={13.5} r={6.6} fill="#f4f4f0" stroke="#2d2f2b" strokeOpacity={0.5} strokeWidth={1.1} />
      <text x={14} y={16.7} textAnchor="middle" fontSize={9} fontWeight={700} fill="#2d2f2b">
        {n}
      </text>
    </svg>
  );
}

function Flag() {
  return (
    <svg viewBox="0 0 28 36" className="size-full overflow-visible">
      <ellipse cx={6} cy={35} rx={5.5} ry={1.8} fill="#2d2f2b" fillOpacity={0.25} />
      <path d="M6 35V3.5" stroke="#2d2f2b" strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" />
      <path className={styles.cloth} d="M7 4.5C12 2.5 16 7.5 24 4.5V16C16 19 12 14 7 16Z" fill="#9caf88" stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={1.3} strokeLinejoin="round" />
      <circle cx={6} cy={3} r={1.8} fill="#bc4e26" />
    </svg>
  );
}

function FlagMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-[0.8em]">
      <path d="M3.5 15V1.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M4.5 2C8 0.8 10 4 14 2.5V9C10 10.5 8 7.5 4.5 9Z" fill="currentColor" />
    </svg>
  );
}

const GLYPHS: Record<Glyph, string> = {
  laptop: "M5 6.5c4.7-.3 9.4-.3 14 0 .3 2.9.3 5.8 0 8.6-4.7.3-9.4.3-14 0-.3-2.8-.3-5.7 0-8.6ZM2.5 18.2c6.4.4 12.7.4 19 0",
  cap: "M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5ZM6.5 11.6v4.2c3.6 2.4 7.4 2.4 11 0v-4.2M21.3 9.8v5",
  branch: "M7 4.5v15M7 12.5c5.5.2 9.5-2.3 10-6.3M17 6.2a1.8 1.8 0 1 0 0-.1M7 4.4a1.8 1.8 0 1 0 0-.1M7 19.6a1.8 1.8 0 1 0 0-.1",
  pen: "M4 20c.6-2.4 1.3-4.6 2.3-6.6L16 3.8c1.4 1.2 2.9 2.6 4.1 4.1l-9.6 9.8c-2.1 1-4.2 1.7-6.5 2.3ZM13.6 6.3c1.5 1.2 2.9 2.6 4.1 4.1",
  steps: "M3.5 20h5v-5h5v-5h5V5h2.5M3.5 20.2c5.5.2 11 .1 17-.2",
  bolt: "M13.2 2.8 5.8 13.2h5.4l-1.4 8 7.6-10.6H12l1.2-7.8Z",
  atom: "M12 12.1a1.3 1.3 0 1 0 0-.1M12 4c-2.3 0-4 3.6-4 8s1.7 8 4 8 4-3.6 4-8-1.7-8-4-8ZM5 8c-1.2 2 1.4 5.4 5.7 7.8s8.6 2.8 9.8.8M19 8c1.2 2-1.4 5.4-5.7 7.8S4.7 18.6 3.5 16.6",
  spark: "M12 3c.6 4.4 2.6 6.8 7.5 7.6-4.9.8-6.9 3.2-7.5 7.9-.6-4.7-2.7-7.1-7.6-7.9 4.9-.8 7-3.2 7.6-7.6ZM18.6 16.4c.2 1.4.9 2.2 2.4 2.4-1.5.3-2.2 1-2.4 2.5-.2-1.5-.9-2.2-2.4-2.5 1.5-.2 2.2-1 2.4-2.4Z",
};

function Icon({ glyph }: { glyph: Glyph }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={GLYPHS[glyph]} />
    </svg>
  );
}
