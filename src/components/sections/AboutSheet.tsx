"use client";

import { type CSSProperties, type ReactNode } from "react";
import { BUILDING_SINCE, CERTIFICATIONS, EDUCATION, EXPERIENCE, PERSON, PROFILE, PROJECTS, TOOLBOX } from "@/lib/content";
import Counter from "@/components/sketch/Counter";
import Doodle from "@/components/sketch/Doodle";
import Polaroid from "@/components/Polaroid";
import styles from "./About.module.css";

/**
 * About, as a spec sheet: the photo in the middle, and a numbered callout for
 * each thing Ahmad does either side of it, each with its paragraph; and under
 * it all a rating plate, riveted on like the ones on the factory's machines,
 * with the numbers and the particulars. Each part rises into place as it is
 * scrolled to (data-reveal). Below a laptop's width the callouts simply follow
 * the photo.
 */

const now = EXPERIENCE[0];

type Callout = { tag: string; title: ReactNode; text: ReactNode; side: "left" | "right" };

const CALLOUTS: Callout[] = [
  { tag: "ships", title: "production web apps", text: PROFILE[0], side: "left" },
  { tag: "builds", title: "AI that is simple to use", text: PROFILE[1], side: "left" },
  { tag: "designs", title: "APIs & data architecture", text: PROFILE[2], side: "right" },
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

export default function AboutSheet() {
  return (
    <div>
      <div className={styles.sheet}>
        <div className={styles.photo} data-reveal="">
          <Polaroid still />
        </div>

        {CALLOUTS.map((callout, i) => (
          <div key={callout.tag} className={styles.callout} data-side={callout.side} data-reveal="" style={{ "--reveal-i": i + 1 } as CSSProperties}>
            <p className={styles.tag}>
              <span className={styles.num}>0{i + 1}</span>
              {callout.tag}
            </p>
            <p className={styles.title}>{callout.title}</p>
            <p className={styles.text}>{callout.text}</p>
            {callout.tag === "now" && <Doodle kind="bulb" className="absolute -top-5 right-2 w-8 rotate-12 text-sienna-500" />}
          </div>
        ))}

      </div>

      {/* the rating plate */}
      <div className={styles.plate} data-reveal="">
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
