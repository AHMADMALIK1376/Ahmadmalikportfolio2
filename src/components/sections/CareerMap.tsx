"use client";

import { AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CERTIFICATIONS, EDUCATION, EXPERIENCE, type Ink, type Role } from "@/lib/content";
import { ArrowUpRight } from "@/components/sketch/Icons";
import { BRIDGE, FUTURE, Ground, H, ROAD, Scenery, Sky, W } from "./MapArt";
import styles from "./Map.module.css";

/**
 * Experience, as a road trip: a hand-drawn map with every role on one road,
 * in order, and the workshop and hackathons as flags just off it.
 *
 * The map stays on the screen while the section scrolls past it, and the
 * scrolling drives a small van along the road: as it pulls up at each place,
 * that place's card pops up on the map beside its pin, with everything about
 * it and a passport stamp; scroll on and the card folds away and the van drives
 * to the next. Scrolling back drives it back. Pointing at a pin puts up its road
 * sign, and clicking one scrolls the van there.
 */

type Glyph = "laptop" | "cap" | "branch" | "pen" | "steps" | "bolt" | "atom" | "spark";

type Stop = {
  id: string;
  kind: "Role" | "Education" | "Workshop" | "Hackathon";
  /** on the road itself, or a landmark just off it */
  road: boolean;
  at: [number, number];
  /** what its road sign says, and its name on the map */
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
  /** which way its road sign runs from the pin */
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

const fromRole = (r: Role) => ({
  title: r.title,
  org: r.company,
  url: r.url,
  period: r.period,
  detail: r.detail,
  points: r.points,
  ink: r.ink,
});

const WORKSHOP = badge("GitHub Open Source Collaboration");
const CUST = badge("CUST Hackathon 2026");
const ATOM = badge("Atom Camp Hackathon");

/** In the order they happened, which is also their order along the road. */
const STOPS: Stop[] = [
  {
    id: "freelance",
    label: "left",
    kind: "Role",
    road: true,
    at: [110, 350],
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
    at: [250, 262],
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
  },
  {
    id: "workshop",
    label: "left",
    kind: "Workshop",
    road: false,
    at: [318, 196],
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
    at: [400, 320],
    sign: "UI/UX design · 2025",
    short: "UI/UX",
    glyph: "pen",
    ...fromRole(role("UI/UX Designer")),
    stamp: ["since", "nov 25", "design"],
  },
  {
    id: "growstep",
    label: "left",
    kind: "Role",
    road: true,
    at: [520, 200],
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
    at: [600, 236],
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
  },
  {
    id: "atom",
    label: "below",
    kind: "Hackathon",
    road: false,
    at: [664, 196],
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
  },
  {
    id: "anma",
    label: "above",
    kind: "Role",
    road: true,
    at: [690, 130],
    sign: "Anma Tech · now",
    short: "Anma Tech",
    glyph: "spark",
    ...fromRole(role("Full Stack AI Engineer")),
    stamp: ["jul", "2026", "now"],
  },
];

const COUNT = STOPS.length;
const LAST = COUNT - 1;
const ROAD_COUNT = STOPS.filter((s) => s.road).length;
/** each stop's number on the road, or 0 for the landmarks */
const NUMBER = STOPS.reduce<number[]>((acc, stop) => [...acc, stop.road ? acc.filter(Boolean).length + 1 : 0], []);

/** how long the road takes to draw when the map first comes into view, in ms */
const DRAW = 1800;
/** how far short of a place the van parks, along the road, so its pin stands clear */
const PARK = 16;
/** of each stop's share of the scroll, the part spent driving to it; the rest is spent there */
const DRIVE = 0.38;

const percent = ([x, y]: [number, number]) => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
});
const smoothstep = (k: number) => k * k * (3 - 2 * k);

type Placement = {
  left: number;
  top: number;
  tail: number;
  side: "left" | "right";
};

export default function CareerMap({ heading }: { heading: ReactNode }) {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const seen = useInView(canvas, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const eased = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.0002,
  });
  const [active, setActive] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [overlay, setOverlay] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [place, setPlace] = useState<Placement | null>(null);
  const [started, setStarted] = useState(false);
  const road = useRef<SVGPathElement>(null);
  const van = useRef<HTMLDivElement>(null);
  const vanBody = useRef<HTMLDivElement>(null);
  // the van's trip, kept out of React: where it parks for each stop, where it is, and when it last moved
  const trip = useRef({
    parks: [] as number[],
    total: 0,
    at: -1,
    still: 0,
    shown: -2,
  });
  const ids = useId();
  const mask = `${ids}-road`;

  /** Where along the road the van parks for each stop: just short of a town, or level with a landmark. */
  const measure = () => {
    const path = road.current;
    const t = trip.current;
    if (!path || t.parks.length) return;
    const total = path.getTotalLength();
    t.total = total;
    let before = 0;
    t.parks = STOPS.map((stop) => {
      let best = 0;
      let gap = Infinity;
      for (let k = 0; k <= 500; k++) {
        const s = (total * k) / 500;
        const p = path.getPointAtLength(s);
        const d = (p.x - stop.at[0]) ** 2 + (p.y - stop.at[1]) ** 2;
        if (d < gap) {
          gap = d;
          best = s;
        }
      }
      // never behind the stop before, so the van only ever drives forward as the page goes down
      before = Math.max(before + 4, best - PARK);
      return before;
    });
  };

  /** Puts the van `s` along the road, facing along it. */
  const putVan = (s: number) => {
    const path = road.current;
    const t = trip.current;
    if (!path || !van.current || !vanBody.current) return;
    const p = path.getPointAtLength(s);
    const ahead = path.getPointAtLength(Math.min(t.total, s + 2));
    const behind = path.getPointAtLength(Math.max(0, s - 2));
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
    van.current.style.translate = `${((p.x / W) * 100).toFixed(3)}% ${((p.y / H) * 100).toFixed(3)}%`;
    vanBody.current.style.rotate = `${angle.toFixed(1)}deg`;
    // it rattles while it moves
    if (Math.abs(s - t.at) > 0.05) {
      vanBody.current.setAttribute("data-driving", "");
      window.clearTimeout(t.still);
      t.still = window.setTimeout(() => vanBody.current?.removeAttribute("data-driving"), 140);
    }
    t.at = s;
  };

  /** Where the van is, and which stop it is at (if any), `p` of the way through the section. */
  const follow = (p: number) => {
    measure();
    const t = trip.current;
    if (!t.parks.length) return;
    const x = Math.min(0.99999, Math.max(0, p)) * COUNT;
    const i = Math.floor(x);
    const f = x - i;
    const from = i === 0 ? 0 : t.parks[i - 1];
    const to = t.parks[i];
    const driving = f < DRIVE;
    const s = driving ? from + (to - from) * smoothstep(f / DRIVE) : to;
    putVan(s);
    if (s > 2 !== started) setStarted(s > 2);
    const at = driving ? null : i;
    if (at !== t.shown) {
      t.shown = at ?? -1;
      setActive(at);
    }
  };

  useMotionValueEvent(reduced ? scrollYProgress : eased, "change", follow);

  // once the map is on screen: the van waits at the start of the road (or wherever the page already is)
  useEffect(() => {
    if (!seen) return;
    const frame = requestAnimationFrame(() => follow((reduced ? scrollYProgress : eased).get()));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  // the map's size, and whether the cards go on it (a wide screen) or under it (a phone)
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const wide = window.matchMedia("(min-width: 48rem)");
    const sync = () => setOverlay(wide.matches);
    sync();
    wide.addEventListener("change", sync);
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => {
      wide.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const t = trip.current;
    return () => window.clearTimeout(t.still);
  }, []);

  // a card on the map stands beside its pin, on whichever side has room and away from the van, and never off the map
  useLayoutEffect(() => {
    if (!overlay || active === null || !card.current || !size.w) {
      setPlace(null);
      return;
    }
    const stop = STOPS[active];
    const cw = card.current.offsetWidth;
    const ch = card.current.offsetHeight;
    const pin = { x: (stop.at[0] / W) * size.w, y: (stop.at[1] / H) * size.h };
    const head = pin.y - 22;
    const side = stop.at[0] / W > 0.55 ? "left" : "right";
    const gap = 44;
    const left = Math.min(Math.max(10, side === "right" ? pin.x + gap : pin.x - gap - cw), size.w - cw - 10);
    const top = Math.min(Math.max(10, head - ch * 0.42), size.h - ch - 10);
    setPlace({
      left,
      top,
      tail: Math.min(Math.max(22, head - top), ch - 22),
      side,
    });
  }, [active, overlay, size]);

  /** Scrolls the page to where the van is parked at stop `i`. */
  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + ((i + (DRIVE + 1) / 2) / COUNT) * range,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const drawn = seen || reduced;
  const stop = active === null ? null : STOPS[active];
  const number = active === null ? 0 : NUMBER[active];

  const log = stop && (
    <motion.div
      key={stop.id}
      ref={card}
      className={`sketch-box ink-${stop.ink} ${styles.log}`}
      data-side={place?.side}
      style={
        overlay
          ? ({
              left: place?.left ?? 0,
              top: place?.top ?? 0,
              visibility: place ? "visible" : "hidden",
              transformOrigin: place ? `${place.side === "right" ? 0 : 100}% ${place.tail}px` : "50% 50%",
              "--tail": `${place?.tail ?? 0}px`,
            } as CSSProperties)
          : undefined
      }
      initial={{
        opacity: 0,
        scale: overlay ? 0.35 : 0.92,
        y: overlay ? 0 : 14,
      }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: overlay ? 0.6 : 0.96,
        transition: { duration: 0.16 },
      }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
    >
      {overlay && <span className={styles.tail} aria-hidden="true" />}
      <p className="flex flex-wrap items-center gap-2 pr-16">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-sienna-600 sm:text-[0.62rem]">{stop.road ? `stop ${number} of ${ROAD_COUNT}` : "along the way"}</span>
        <span className="sketch-chip !text-[0.6rem]">{stop.kind}</span>
      </p>
      <h3 className="mt-2 pr-14 text-[0.95rem] leading-snug sm:text-base">{stop.title}</h3>
      <p className="mt-0.5 text-[0.8rem] font-bold text-(--ink-text) sm:text-sm">
        {stop.url ? (
          <a href={stop.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 rounded hover:underline hover:decoration-wavy hover:underline-offset-4">
            {stop.org}
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        ) : (
          stop.org
        )}
      </p>
      <p className="mt-0.5 text-[0.66rem] font-bold text-muted sm:text-[0.7rem]">
        {stop.period && <span>{stop.period} · </span>}
        {stop.detail}
      </p>
      <ul className="sketch-list mt-2.5 space-y-1.5 text-[0.7rem] leading-relaxed text-ink/90 sm:text-[0.74rem]">
        {stop.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <motion.span
        aria-hidden="true"
        className={styles.stamp}
        initial={{ opacity: 0, scale: 1.6, rotate: -30 }}
        animate={{ opacity: 0.9, scale: 1, rotate: -12 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 17, delay: 0.22 }}
      >
        <span>{stop.stamp[0]}</span>
        <strong>{stop.stamp[1]}</strong>
        <span>{stop.stamp[2]}</span>
      </motion.span>
    </motion.div>
  );

  return (
    <section ref={track} id="experience" aria-labelledby="experience-title" className={styles.track} style={{ "--stops": COUNT } as CSSProperties}>
      <div className={styles.pinned}>
        <div className="gutter w-full">
          <div className={styles.stage}>
            {heading}

            {/* the map */}
            <div className={`sketch-box p-1.5 sm:p-2 ${styles.map}`} data-in={drawn ? "" : undefined}>
              <div ref={canvas} className={styles.canvas}>
                <svg viewBox={`0 0 ${W} ${H}`} className={styles.art} aria-hidden="true" focusable="false">
                  <defs>
                    <clipPath id={`${ids}-frame`}>
                      <rect width={W} height={H} rx={18} />
                    </clipPath>
                    <clipPath id={`${ids}-bridge`}>
                      <circle cx={BRIDGE.x} cy={BRIDGE.y} r={13} />
                    </clipPath>
                    {/* the road, drawn in as the map arrives */}
                    <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                      <motion.path
                        d={ROAD}
                        fill="none"
                        stroke="#fff"
                        strokeWidth={34}
                        strokeLinecap="round"
                        initial={{ pathLength: reduced ? 1 : 0 }}
                        animate={{ pathLength: drawn ? 1 : 0 }}
                        transition={{
                          duration: reduced ? 0 : DRAW / 1000,
                          ease: [0.45, 0, 0.3, 1],
                        }}
                      />
                    </mask>
                  </defs>
                  <g clipPath={`url(#${ids}-frame)`}>
                    <Ground clip={`${ids}-sea`} />
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
                      {STOPS.map((s) => (s.road ? <circle key={s.id} cx={s.at[0]} cy={s.at[1]} r={5.2} fill="#f4f4f0" stroke="#2d2f2b" strokeOpacity={0.6} strokeWidth={1.5} /> : null))}
                    </g>
                    <text x={46} y={398} fontSize={7.5} fontWeight={700} letterSpacing={1.6} textAnchor="end" fill="#5e625c" className={styles.start}>
                      START
                    </text>
                    <Scenery />
                  </g>
                </svg>

                {/* the clouds, in a layer of their own */}
                <svg viewBox={`0 0 ${W} ${H}`} className={styles.art} aria-hidden="true" focusable="false">
                  <g clipPath={`url(#${ids}-frame)`}>
                    <Sky />
                  </g>
                </svg>

                {/* the van, slid along by its translate so the map under it is left alone */}
                <div ref={van} className={styles.van} aria-hidden="true">
                  <div ref={vanBody} className={styles.vanBody}>
                    <svg viewBox="-13 -8 26 16">
                      <rect x={-9} y={-4} width={20} height={11} rx={3.5} fill="#2d2f2b" fillOpacity={0.35} />
                      <rect x={-11} y={-6} width={20} height={11} rx={3.5} fill="#d0714c" stroke="#2d2f2b" strokeOpacity={0.75} strokeWidth={1.2} />
                      <rect x={2} y={-4.5} width={4.6} height={8} rx={1.6} fill="#f4f4f0" stroke="#2d2f2b" strokeOpacity={0.5} strokeWidth={0.8} />
                      <rect x={-8.6} y={-4.5} width={2.8} height={8} rx={1} fill="#f4f4f0" fillOpacity={0.75} />
                      <rect x={-4.6} y={-5} width={5.6} height={9} rx={1} fill="#bc4e26" />
                    </svg>
                  </div>
                </div>

                {/* the places: pins on the road, flags off it, their names, and the sign each puts up when pointed at */}
                <div className={styles.stops}>
                  {STOPS.map((s, i) => {
                    const signed = i === hover && i !== active;
                    return (
                      <div
                        key={s.id}
                        className={styles.stop}
                        style={
                          {
                            ...percent(s.at),
                            "--d": `${s.road ? 0.08 + (NUMBER[i] - 1) * 0.36 : DRAW / 1000 + 0.1 + i * 0.05}s`,
                          } as CSSProperties
                        }
                        data-road={s.road ? "" : undefined}
                        data-active={i === active ? "" : undefined}
                        data-on={signed || i === active ? "" : undefined}
                      >
                        <button type="button" tabIndex={-1} aria-hidden="true" className={styles.pin} onClick={() => jump(i)} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                          {s.road ? <Pin n={NUMBER[i]} now={i === LAST} /> : <Flag />}
                        </button>
                        {signed && (
                          <span className={styles.sign} data-align={s.align} data-kind={s.road ? "road" : "landmark"}>
                            <span className={styles.signIcon}>
                              <Icon glyph={s.glyph} />
                            </span>
                            {s.sign}
                          </span>
                        )}
                        {!signed && i !== active && (
                          <span className={styles.label} data-label={s.label}>
                            {s.short}
                          </span>
                        )}
                        {i === LAST && <span className={styles.here}>you are here</span>}
                      </div>
                    );
                  })}

                  {/* where the road goes next */}
                  <a href="#contact" className={styles.next} style={percent([782, 74])} aria-label="Next stop: your team? Get in touch">
                    ?<span className={styles.nextSign}>next stop: your team?</span>
                  </a>
                </div>

                {/* the card of the place the van is at, popped up beside it */}
                {overlay && <AnimatePresence>{log}</AnimatePresence>}

                <p className={styles.hint} data-hidden={active !== null || started ? "" : undefined} aria-hidden="true">
                  scroll to drive ↓
                </p>
              </div>
            </div>

            {/* on a phone, the card sits under the map */}
            {!overlay && (
              <div className={styles.under}>
                <AnimatePresence mode="popLayout">{log}</AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* everything on the map, for anyone reading without it */}
      <ol className="sr-only">
        {STOPS.map((s) => (
          <li key={s.id}>
            <h3>
              {s.title}, {s.org}
            </h3>
            <p>
              {s.kind}
              {s.period ? `, ${s.period}` : ""}. {s.detail}.
            </p>
            <ul>
              {s.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
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

const GLYPHS: Record<Glyph, string> = {
  laptop: "M5 6.5c4.7-.3 9.4-.3 14 0 .3 2.9.3 5.8 0 8.6-4.7.3-9.4.3-14 0-.3-2.8-.3-5.7 0-8.6ZM2.5 18.2c6.4.4 12.7.4 19 0",
  cap: "M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5ZM6.5 11.6v4.2c3.6 2.4 7.4 2.4 11 0v-4.2M21.3 9.8v5",
  branch: "M7 4.5v15M7 12.5c5.5.2 9.5-2.3 10-6.3M17 6.2a1.8 1.8 0 1 0 0-.1M7 4.4a1.8 1.8 0 1 0 0-.1M7 19.6a1.8 1.8 0 1 0 0-.1",
  pen: "M4 20c.6-2.4 1.3-4.6 2.3-6.6L16 3.8c1.4 1.2 2.9 2.6 4.1 4.1l-9.6 9.8c-2.1 1-4.2 1.7-6.5 2.3ZM13.6 6.3c1.5 1.2 2.9 2.6 4.1 4.1",
  steps: "M3.5 20h5v-5h5v-5h5V5h2.5M3.5 20.2c5.5.2 11 .1 17-.2",
  bolt: "M13.2 2.8 5.8 13.2h5.4l-1.4 8 7.6-10.6H12l1.2-7.8Z",
  atom: "M12 12.1a1.3 1.3 0 1 0 0-.1M12 4c-2.3 0-4 3.6-4 8s1.7 8 4 8 4-3.6 4-8-1.7-8-4-8ZM5 8c-1.2 2 1.4 5.4 5.7 7.8s8.6 2.8 9.8.8M19 8c1.2 2-1.4 5.4-5.7 7.8S4.7 18.6 3.5 16.6",
  spark:
    "M12 3c.6 4.4 2.6 6.8 7.5 7.6-4.9.8-6.9 3.2-7.5 7.9-.6-4.7-2.7-7.1-7.6-7.9 4.9-.8 7-3.2 7.6-7.6ZM18.6 16.4c.2 1.4.9 2.2 2.4 2.4-1.5.3-2.2 1-2.4 2.5-.2-1.5-.9-2.2-2.4-2.5 1.5-.2 2.2-1 2.4-2.4Z",
};

function Icon({ glyph }: { glyph: Glyph }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={GLYPHS[glyph]} />
    </svg>
  );
}
