"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PROJECTS } from "@/lib/content";
import SectionHeading from "@/components/sketch/SectionHeading";
import Highlight from "@/components/sketch/Highlight";
import styles from "./Skills.module.css";

/**
 * The toolbox as a periodic table: every tool an element, with its number, a
 * symbol and its name, laid out the way the elements are — the languages down
 * the left like the alkali metals, the web and the cloud in the block on the
 * right, the databases and the testing tools along the bottom row — and the AI
 * and LLM tools in a row of their own under the table, as the lanthanides are.
 *
 * In the gap at the top of the table: the heading, a key to the kinds of
 * element (each one a button: pointed at, it lights its elements up; pressed,
 * it keeps them lit), and one element drawn large — whichever is pointed at,
 * with the projects it has been used in; and when nothing is, each in turn.
 *
 * Below a laptop's width the elements simply run in rows, kind by kind.
 */

type Kind = "lang" | "front" | "back" | "data" | "cloud" | "test" | "ai";

const KINDS: Record<Kind, { label: string; fill: string; text: string; dark?: boolean }> = {
  lang: { label: "Languages", fill: "var(--color-sienna-200)", text: "var(--color-sienna-700)" },
  front: { label: "Frontend", fill: "var(--color-sage-100)", text: "var(--color-sage-700)" },
  back: { label: "Backend", fill: "var(--color-sienna-100)", text: "var(--color-sienna-600)" },
  data: { label: "Databases", fill: "var(--color-concrete-200)", text: "var(--color-concrete-700)" },
  cloud: { label: "Cloud & DevOps", fill: "var(--color-sage-300)", text: "var(--color-sage-800)" },
  test: { label: "Automation & Testing", fill: "var(--color-paper-2)", text: "var(--color-concrete-600)" },
  ai: { label: "AI & LLM", fill: "var(--color-concrete-800)", text: "var(--color-sienna-300)", dark: true },
};
const KIND_ORDER: Kind[] = ["lang", "front", "back", "data", "cloud", "test", "ai"];

/**
 * An element: its symbol, its name (and a shorter one for its tile, if it is long), its kind, where it stands in the
 * table, and the names it goes by in a project's stack.
 */
type Element = { symbol: string; name: string; short?: string; kind: Kind; row: number; col: number; seen: string[] };

/** In the table's own order, row by row, the AI row last: which gives each its number. */
const ELEMENTS: Element[] = [
  { symbol: "Py", name: "Python", kind: "lang", row: 1, col: 1, seen: ["python"] },
  { symbol: "Gh", name: "Git/GitHub", kind: "cloud", row: 1, col: 13, seen: ["github actions", "github api"] },
  { symbol: "Js", name: "JavaScript", kind: "lang", row: 2, col: 1, seen: ["javascript", "react.js", "node.js", "d3.js", "chart.js"] },
  { symbol: "Ts", name: "TypeScript", kind: "lang", row: 2, col: 2, seen: ["typescript"] },
  { symbol: "Ht", name: "HTML5", kind: "front", row: 2, col: 8, seen: ["html5 canvas", "svg"] },
  { symbol: "Cs", name: "CSS3", kind: "front", row: 2, col: 9, seen: ["css animation", "tailwind css"] },
  { symbol: "Re", name: "React.js", kind: "front", row: 2, col: 10, seen: ["react.js", "next.js"] },
  { symbol: "Tw", name: "Tailwind CSS", kind: "front", row: 2, col: 11, seen: ["tailwind css"] },
  { symbol: "Vi", name: "Vite", kind: "front", row: 2, col: 12, seen: ["vite"] },
  { symbol: "Cx", name: "Context API", kind: "front", row: 2, col: 13, seen: ["context api"] },
  { symbol: "Ja", name: "Java", kind: "lang", row: 3, col: 1, seen: ["java"] },
  { symbol: "C+", name: "C++", kind: "lang", row: 3, col: 2, seen: ["c++"] },
  { symbol: "No", name: "Node.js", kind: "back", row: 3, col: 8, seen: ["node.js"] },
  { symbol: "Ex", name: "Express.js", kind: "back", row: 3, col: 9, seen: ["express.js"] },
  { symbol: "Fa", name: "FastAPI", kind: "back", row: 3, col: 10, seen: ["fastapi"] },
  { symbol: "Ra", name: "RESTful APIs", kind: "back", row: 3, col: 11, seen: ["fastapi", "express.js", "adzuna jobs api", "github api"] },
  { symbol: "Jw", name: "JWT Authentication", short: "JWT Auth", kind: "back", row: 3, col: 12, seen: ["jwt"] },
  { symbol: "Dk", name: "Docker", kind: "cloud", row: 3, col: 13, seen: ["docker"] },
  { symbol: "Sq", name: "SQL", kind: "lang", row: 4, col: 1, seen: ["postgresql", "oracle 21c xe", "sql"] },
  { symbol: "Mg", name: "MongoDB", kind: "data", row: 4, col: 2, seen: ["mongodb"] },
  { symbol: "Fb", name: "Firebase", kind: "data", row: 4, col: 3, seen: ["firebase"] },
  { symbol: "Or", name: "Oracle 21c XE", kind: "data", row: 4, col: 4, seen: ["oracle 21c xe"] },
  { symbol: "Pg", name: "PostgreSQL", kind: "data", row: 4, col: 5, seen: ["postgresql"] },
  { symbol: "Gc", name: "Google Cloud Platform", short: "Google Cloud", kind: "cloud", row: 4, col: 6, seen: ["google cloud platform", "gcp"] },
  { symbol: "Aw", name: "AWS", kind: "cloud", row: 4, col: 7, seen: ["aws"] },
  { symbol: "Vc", name: "Vercel", kind: "cloud", row: 4, col: 8, seen: ["vercel"] },
  { symbol: "Nl", name: "Netlify", kind: "cloud", row: 4, col: 9, seen: ["netlify"] },
  { symbol: "Pw", name: "Playwright", kind: "test", row: 4, col: 10, seen: ["playwright"] },
  { symbol: "Ws", name: "Web Scraping", kind: "test", row: 4, col: 11, seen: ["web scraping"] },
  { symbol: "Ba", name: "Browser Automation", kind: "test", row: 4, col: 12, seen: ["browser automation"] },
  { symbol: "Ay", name: "Accessibility Testing (ARIA)", short: "Accessibility (ARIA)", kind: "test", row: 4, col: 13, seen: ["aria"] },
  { symbol: "Cl", name: "Anthropic Claude API", short: "Claude API", kind: "ai", row: 6, col: 4, seen: ["claude api", "claude (anthropic)"] },
  { symbol: "Ll", name: "LLM Integration", kind: "ai", row: 6, col: 5, seen: ["claude api", "claude (anthropic)", "qwen", "langgraph"] },
  { symbol: "Pe", name: "Prompt Engineering", kind: "ai", row: 6, col: 6, seen: ["claude api", "claude (anthropic)", "qwen"] },
  { symbol: "Cv", name: "Computer Vision", kind: "ai", row: 6, col: 7, seen: ["computer vision"] },
  { symbol: "Mm", name: "Multi-modal AI", kind: "ai", row: 6, col: 8, seen: ["multi-modal ai"] },
];

/** The projects each element has been used in, by the names in their stacks. */
const USED_IN = ELEMENTS.map((el) => PROJECTS.filter((p) => p.stack.some((s) => el.seen.includes(s.toLowerCase()))).map((p) => p.title));
/** Below a laptop's width they run kind by kind. */
const FLOW = KIND_ORDER.flatMap((kind) => ELEMENTS.map((el, i) => ({ el, i })).filter(({ el }) => el.kind === kind));

const CYCLE = 2600;

export default function SkillsTable() {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(6);
  const [pointing, setPointing] = useState(false);
  const [lit, setLit] = useState<Kind | null>(null);
  const [pinned, setPinned] = useState<Kind | null>(null);
  const kind = lit ?? pinned;

  // the elements are stamped on when the table comes into view; and while it is on screen and nothing is pointed at,
  // the large element goes through them in turn
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const watch = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setShown(true);
    }, { threshold: 0.2 });
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  useEffect(() => {
    if (!inView || pointing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((i) => {
        // through the lit kind only, if one is lit
        for (let k = 1; k <= ELEMENTS.length; k++) {
          const next = (i + k) % ELEMENTS.length;
          if (!kind || ELEMENTS[next].kind === kind) return next;
        }
        return i;
      });
    }, CYCLE);
    return () => window.clearInterval(timer);
  }, [inView, pointing, kind]);

  const el = ELEMENTS[active];
  const used = USED_IN[active];
  const look = (k: Kind) => ({ "--fill": KINDS[k].fill, "--text": KINDS[k].text }) as CSSProperties;

  return (
    <div ref={root} className={styles.table} data-shown={shown ? "" : undefined} data-lit={kind ?? undefined} onMouseLeave={() => setPointing(false)}>
      <div className={styles.heading}>
        <SectionHeading number="04" kicker="the periodic table" id="skills-title" tight>
          My <Highlight>toolbox</Highlight>.
        </SectionHeading>
      </div>

      {/* the key: each kind of element, a button that lights them up */}
      <ul className={styles.key} aria-label="Kinds of tool">
        {KIND_ORDER.map((k) => (
          <li key={k}>
            <button
              type="button"
              className={styles.keyItem}
              style={look(k)}
              aria-pressed={pinned === k}
              data-dim={kind && kind !== k ? "" : undefined}
              onMouseEnter={() => setLit(k)}
              onMouseLeave={() => setLit(null)}
              onFocus={() => setLit(k)}
              onBlur={() => setLit(null)}
              onClick={() => setPinned((p) => (p === k ? null : k))}
            >
              <span className={styles.swatch} aria-hidden="true" />
              {KINDS[k].label}
            </button>
          </li>
        ))}
      </ul>

      {/* one element, drawn large: whichever is pointed at, or each in turn */}
      <div className={styles.featured} style={look(el.kind)} data-dark={KINDS[el.kind].dark ? "" : undefined} aria-live="polite">
        <div key={active} className={styles.featuredInner}>
          <div className={styles.featuredCell}>
            <span className={styles.bigNumber}>{active + 1}</span>
            <svg className={styles.orbit} viewBox="-50 -50 100 100" aria-hidden="true">
              <ellipse rx={44} ry={16} transform="rotate(-24)" />
              <ellipse rx={44} ry={16} transform="rotate(36)" />
              <g className={styles.electron}>
                <circle cx={44} cy={0} r={3.4} transform="rotate(-24)" />
              </g>
            </svg>
            <span className={styles.bigSymbol}>{el.symbol}</span>
          </div>
          <div className="min-w-0">
            <p className={styles.featuredKind}>{KINDS[el.kind].label}</p>
            <p className={styles.featuredName}>{el.name}</p>
            <p className={styles.featuredUsed}>
              {used.length ? (
                <>
                  <span className={styles.usedLabel}>used in</span> {used.join(" · ")}
                </>
              ) : (
                <>
                  <span className={styles.usedLabel}>in the kit</span> part of how I work, day to day
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* the elements */}
      {FLOW.map(({ el: tile, i }) => (
        <button
          key={tile.symbol}
          type="button"
          className={styles.tile}
          style={{ ...look(tile.kind), "--row": tile.row, "--col": tile.col, "--i": i } as CSSProperties}
          data-kind={tile.kind}
          data-dark={KINDS[tile.kind].dark ? "" : undefined}
          data-active={i === active ? "" : undefined}
          data-dim={kind && kind !== tile.kind ? "" : undefined}
          aria-label={`${tile.name}, ${KINDS[tile.kind].label}${USED_IN[i].length ? `, used in ${USED_IN[i].join(", ")}` : ""}`}
          onMouseEnter={() => {
            setPointing(true);
            setActive(i);
          }}
          onFocus={() => {
            setPointing(true);
            setActive(i);
          }}
          onBlur={() => setPointing(false)}
        >
          <span className={styles.number}>{i + 1}</span>
          <span className={styles.uses} aria-hidden="true">
            {USED_IN[i].slice(0, 3).map((p) => (
              <i key={p} />
            ))}
          </span>
          <span className={styles.symbol}>{tile.symbol}</span>
          <span className={styles.name}>{tile.short ?? tile.name}</span>
        </button>
      ))}

      {/* the AI row's label, as the lanthanides have; and a note */}
      <p className={styles.series} aria-hidden="true">
        ✶ the AI &amp; LLM series <span className={styles.seriesArrow}>→</span>
      </p>
      <p className={styles.note} aria-hidden="true">
        point at an element to see
        <br />
        where I&apos;ve used it ↖
      </p>
    </div>
  );
}
