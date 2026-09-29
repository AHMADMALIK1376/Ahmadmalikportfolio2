"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BUILDING_SINCE, CERTIFICATIONS, EDUCATION, EXPERIENCE, PERSON, PROFILE, PROJECTS, TOOLBOX } from "@/lib/content";
import Counter from "@/components/sketch/Counter";
import Doodle from "@/components/sketch/Doodle";
import Polaroid from "@/components/Polaroid";
import styles from "./About.module.css";

/**
 * About, as a spec sheet: the photo in the middle, and callouts either side of
 * it with leader lines drawn out to what each one is about — the laptop, the
 * circuits on the wall, the head, and the person — each with its paragraph;
 * and under it all a rating plate, riveted on like the ones on the factory's
 * machines, with the numbers and the particulars.
 *
 * The leader lines are drawn over everything in one SVG, from a point at the
 * inner edge of each callout to a point on the photo given as a fraction of it,
 * measured wherever they fall on the page. Below a laptop's width there are no
 * lines: the callouts simply follow the photo.
 */

const now = EXPERIENCE[0];

type Callout = { tag: string; title: ReactNode; text: ReactNode; side: "left" | "right"; at: [number, number] };

const CALLOUTS: Callout[] = [
  { tag: "ships", title: "production web apps", text: PROFILE[0], side: "left", at: [0.33, 0.36] },
  { tag: "builds", title: "AI that is simple to use", text: PROFILE[1], side: "left", at: [0.14, 0.62] },
  { tag: "designs", title: "APIs & data architecture", text: PROFILE[2], side: "right", at: [0.48, 0.15] },
  {
    tag: "now",
    title: (
      <>
        {now.title} @{" "}
        {now.url ? (
          <a href={now.url} target="_blank" rel="noopener noreferrer" className="underline decoration-sienna-500 decoration-wavy decoration-2 underline-offset-4 hover:text-sienna-600">
            {now.company}
          </a>
        ) : (
          now.company
        )}
      </>
    ),
    text: now.detail,
    side: "right",
    at: [0.57, 0.5],
  },
];

/** The plate's numbers: how long, how many, and the particulars. */
const NUMBERS = [
  { label: "building since", value: BUILDING_SINCE, suffix: "", count: false },
  { label: "years at it", value: new Date().getFullYear() - BUILDING_SINCE, suffix: "+", count: true },
  { label: "projects", value: PROJECTS.length, suffix: "", count: true },
  { label: "tools", value: Math.floor(TOOLBOX.length / 5) * 5, suffix: "+", count: true },
  { label: "hackathons", value: CERTIFICATIONS.filter((c) => c.kind === "Hackathon").length, suffix: "", count: true },
];

type Line = { d: string; from: [number, number]; to: [number, number] };

export default function AboutSheet() {
  const sheet = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLSpanElement | null)[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [shown, setShown] = useState(false);

  // the leader lines: from each callout's anchor to its point on the photo
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const img = photo.current?.querySelector("img")?.getBoundingClientRect();
      if (!img || !window.matchMedia("(min-width: 64rem)").matches) {
        setLines([]);
        return;
      }
      setBox({ w: base.width, h: base.height });
      setLines(
        CALLOUTS.flatMap((callout, i) => {
          const a = anchors.current[i]?.getBoundingClientRect();
          if (!a) return [];
          const from: [number, number] = [a.left + a.width / 2 - base.left, a.top + a.height / 2 - base.top];
          const to: [number, number] = [img.left + img.width * callout.at[0] - base.left, img.top + img.height * callout.at[1] - base.top];
          const out = callout.side === "left" ? 22 : -22;
          const elbow: [number, number] = [from[0] + out, from[1]];
          return [{ d: `M${from[0].toFixed(1)} ${from[1].toFixed(1)}H${elbow[0].toFixed(1)}L${to[0].toFixed(1)} ${to[1].toFixed(1)}`, from, to }];
        }),
      );
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    const img = photo.current?.querySelector("img");
    img?.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      watch.disconnect();
      img?.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // drawn in when the sheet comes into view
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const watch = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown(true), { threshold: 0.25 });
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  return (
    <div>
      <div ref={sheet} className={styles.sheet} data-shown={shown ? "" : undefined}>
        <div ref={photo} className={styles.photo}>
          <Polaroid still />
        </div>

        {CALLOUTS.map((callout, i) => (
          <div key={callout.tag} className={styles.callout} data-side={callout.side} style={{ "--i": i } as CSSProperties}>
            <p className={styles.tag}>
              <span className={styles.num}>0{i + 1}</span>
              {callout.tag}
              <span
                ref={(el) => {
                  anchors.current[i] = el;
                }}
                className={styles.anchor}
                aria-hidden="true"
              />
            </p>
            <p className={styles.title}>{callout.title}</p>
            <p className={styles.text}>{callout.text}</p>
            {callout.tag === "now" && <Doodle kind="bulb" className="absolute -top-5 right-2 w-8 rotate-12 text-sienna-500" />}
          </div>
        ))}

        {/* the leader lines, over it all */}
        {lines.length > 0 && (
          <svg className={styles.leaders} width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden="true" focusable="false">
            {lines.map((line, i) => (
              <g key={i} style={{ "--i": i } as CSSProperties}>
                <path d={line.d} pathLength={1} className={styles.leader} />
                <circle cx={line.from[0]} cy={line.from[1]} r={3} className={styles.leaderStart} />
                <circle cx={line.to[0]} cy={line.to[1]} r={9} className={styles.leaderRing} />
                <circle cx={line.to[0]} cy={line.to[1]} r={3.6} className={styles.leaderEnd} />
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* the rating plate */}
      <div className={styles.plate}>
        <span className={styles.rivet} aria-hidden="true" />
        <span className={styles.rivet} aria-hidden="true" />
        <span className={styles.rivet} aria-hidden="true" />
        <span className={styles.rivet} aria-hidden="true" />
        <p className={styles.plateHead}>
          <span>rating plate</span>
          <span className={styles.plateModel}>model: {PERSON.short} · {PERSON.role}</span>
        </p>
        <dl className={styles.plateCells}>
          {NUMBERS.map((n) => (
            <div key={n.label} className={styles.cell}>
              <dt>{n.label}</dt>
              <dd className={styles.big}>{n.count ? <Counter to={n.value} suffix={n.suffix} /> : n.value}</dd>
            </div>
          ))}
          <div className={`${styles.cell} ${styles.wide}`}>
            <dt>education</dt>
            <dd>
              {EDUCATION.degree} · {EDUCATION.school.split(",")[0]}
              <span className={styles.small}>{EDUCATION.period}</span>
            </dd>
          </div>
          <div className={styles.cell}>
            <dt>based in</dt>
            <dd>
              {PERSON.location.split(",")[0]}
              <span className={styles.small}>{PERSON.location.split(",")[1]?.trim()}</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
