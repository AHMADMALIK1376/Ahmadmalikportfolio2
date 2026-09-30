"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { PERSON } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import LocalTime from "@/components/LocalTime";
import { ArrowRight, Check, Clock, Copy, GitHub, LinkedIn, Pin } from "@/components/sketch/Icons";
import styles from "./Postcard.module.css";

/**
 * The contact form, as a postcard, and the mailbox it goes in.
 *
 * The card is the form: the message is written on its left half, on ruled
 * lines, under "Dear Ahmad," and signed with the name as it is typed; on its
 * right half, under the stamp, the address, and the name and email it is
 * from. Posting it sends it to /api/contact, which emails Ahmad; once it has
 * gone a postmark is thumped on the stamp, the mailbox's door drops open, the
 * card flies in, the door shuts and the flag goes up. Under the card, as
 * stamps: the email address to copy, and GitHub and LinkedIn.
 */

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "error"; message: string };

const PROBLEMS: Record<string, string> = {
  invalid: "Something on the card doesn't look right — check the email address, and write at least a sentence.",
  busy: "That's a lot of cards in a short time. Please try again in a little while.",
  unavailable: `The mailbox isn't connected yet. Please email me directly at ${PERSON.email}.`,
  failed: `The card couldn't be posted just now. Please email me directly at ${PERSON.email}.`,
};

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

/** The stamp on the card: a sparkle, the country and the year, on a perforated edge. */
function Stamp() {
  return (
    <svg viewBox="0 0 64 76" className={styles.stampArt} aria-hidden="true">
      <rect x={4} y={4} width={56} height={68} rx={2} fill="#e2e9da" stroke="#2d2f2b" strokeOpacity={0.45} strokeWidth={1.2} />
      <text x={32} y={16} textAnchor="middle" fontSize={6.4} fontWeight={700} letterSpacing={1.2} fill="#4c5e3e">
        PAKISTAN
      </text>
      <path d="M32 24c1.6 7.4 3.4 9.2 10.8 10.8-7.4 1.6-9.2 3.4-10.8 10.8-1.6-7.4-3.4-9.2-10.8-10.8 7.4-1.6 9.2-3.4 10.8-10.8Z" fill="#de9372" stroke="#9c3f1d" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M14 58c6-3 12 3 18 0s12-3 18 0" fill="none" stroke="#80966b" strokeWidth={1.6} strokeLinecap="round" />
      <text x={32} y={68} textAnchor="middle" fontSize={7.2} fontWeight={700} fill="#2d2f2b">
        Rs 26
      </text>
    </svg>
  );
}

/** The postmark thumped on the stamp once the card has gone: the town round a ring, the date, and wavy lines. */
function Postmark({ date }: { date: string }) {
  return (
    <svg viewBox="0 0 150 80" className={styles.postmarkArt} aria-hidden="true">
      <defs>
        <path id="postmark-ring" d="M40 40m-26 0a26 26 0 1 1 52 0a26 26 0 1 1 -52 0" />
      </defs>
      <g fill="none" stroke="#9c3f1d" strokeOpacity={0.85} strokeWidth={1.8}>
        <circle cx={40} cy={40} r={34} />
        <circle cx={40} cy={40} r={19} />
        {[22, 32, 42, 52, 62].map((y) => (
          <path key={y} d={`M82 ${y}c8-5 16 5 24 0s16-5 24 0 12 4 16 0`} />
        ))}
      </g>
      <text fontSize={8.4} fontWeight={700} letterSpacing={2.2} fill="#9c3f1d" fillOpacity={0.9}>
        <textPath href="#postmark-ring" startOffset="3%">
          RAWALPINDI · PAKISTAN ·
        </textPath>
      </text>
      <text x={40} y={43} textAnchor="middle" fontSize={7.4} fontWeight={700} fill="#9c3f1d" fillOpacity={0.9}>
        {date}
      </text>
    </svg>
  );
}

/** The mailbox: on a post, its door at the front, and its flag, which goes up when a card is posted. */
function Mailbox({ door, flag }: { door: (el: SVGGElement | null) => void; flag: (el: SVGGElement | null) => void }) {
  const ink = { stroke: "#2d2f2b", strokeOpacity: 0.6, strokeWidth: 1.6, strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 170 230" className={styles.mailboxArt} aria-hidden="true">
      {/* the ground, and the post */}
      <ellipse cx={92} cy={219} rx={56} ry={7} fill="#2d2f2b" fillOpacity={0.12} />
      <path d="M58 219c3-5 6-5 9 0M118 219c2-6 6-6 8 0M128 219c2-4 4-4 6 0" fill="none" stroke="#80966b" strokeWidth={1.8} strokeLinecap="round" />
      <rect x={82} y={118} width={20} height={101} rx={3} fill="#c0947f" {...ink} />
      <path d="M88 130v80M95 126v84" stroke="#2d2f2b" strokeOpacity={0.18} strokeWidth={1.2} />
      {/* the box, its shade, its bands and its name */}
      <path d="M34 122V74c0-26 22-40 58-40s58 14 58 40v48Z" fill="#d0714c" {...ink} />
      <path d="M150 74v48h-22V74c0-18-6-30-16-38 24 5 38 18 38 38Z" fill="#bc4e26" />
      <path d="M34 122V74c0-26 22-40 58-40s58 14 58 40v48Z" fill="none" {...ink} />
      <path d="M58 40v82M126 40v82" stroke="#9c3f1d" strokeOpacity={0.5} strokeWidth={2.4} />
      <text x={92} y={96} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={2} fill="#fafaf7">
        AHMAD
      </text>
      <text x={92} y={78} textAnchor="middle" fontSize={7} fontWeight={700} letterSpacing={2.4} fill="#f5dfd5">
        POST
      </text>
      {/* the door, at the front, hinged at the foot */}
      <g ref={door} className={styles.door}>
        <path d="M22 122V76c0-24 8-38 18-38s18 14 18 38v46Z" fill="#de9372" {...ink} />
        <path d="M30 80c0-14 4-24 10-24" fill="none" stroke="#fafaf7" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
        <rect x={34} y={88} width={12} height={5} rx={2.5} fill="#5e625c" {...ink} strokeWidth={1} />
      </g>
      {/* the flag, on the side: lying along it until a card is posted, then swung up */}
      <g ref={flag} className={styles.flag}>
        <path d="M156 114H116" fill="none" stroke="#5e625c" strokeWidth={3} strokeLinecap="round" />
        <path d="M116 114h18v12h-18Z" fill="#9c3f1d" {...ink} strokeWidth={1.3} />
      </g>
      <circle cx={156} cy={114} r={3.4} fill="#5e625c" {...ink} strokeWidth={1} />
    </svg>
  );
}

/** A postage stamp that is a button or a link: a perforated edge round its face. */
function StampLink({ href, onClick, tone, children, label }: { href?: string; onClick?: () => void; tone: string; children: ReactNode; label: string }) {
  const face = (
    <span className={styles.stampFace} style={{ "--face": tone } as CSSProperties}>
      {children}
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.stampButton} aria-label={label}>
      {face}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={styles.stampButton} aria-label={label}>
      {face}
    </button>
  );
}

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [scope, animate] = useAnimate();
  const card = useRef<HTMLDivElement>(null);
  const door = useRef<SVGGElement | null>(null);
  const flag = useRef<SVGGElement | null>(null);
  const postmark = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** The card goes in the mailbox: postmarked, the door opens, it flies in, the door shuts, the flag goes up. */
  async function post() {
    const el = card.current;
    const box = door.current;
    if (!el || !box || !postmark.current || !flag.current) return;
    if (reduced()) return;
    await animate(postmark.current, { opacity: [0, 1], scale: [1.8, 1], rotate: [-32, -14] }, { duration: 0.32, ease: [0.3, 1.6, 0.5, 1] });
    await new Promise((done) => setTimeout(done, 380));
    const from = el.getBoundingClientRect();
    const to = box.getBoundingClientRect();
    box.setAttribute("data-open", "");
    await animate(
      el,
      { x: to.left + to.width / 2 - (from.left + from.width / 2), y: to.top + to.height * 0.55 - (from.top + from.height / 2), scale: 0.05, rotate: -14 },
      { duration: 0.95, ease: [0.5, 0, 0.25, 1] },
    );
    el.style.opacity = "0";
    box.removeAttribute("data-open");
    await new Promise((done) => setTimeout(done, 260));
    flag.current.setAttribute("data-up", "");
  }

  /** A fresh card, back in its place, and the flag down again. */
  async function fresh() {
    const el = card.current;
    setState({ kind: "idle" });
    setName("");
    form.current?.reset();
    if (!el) return;
    if (postmark.current) postmark.current.style.opacity = "0";
    el.style.opacity = "1";
    if (reduced()) return;
    animate(el, { x: 0, y: [24, 0], scale: [0.96, 1], rotate: 0, opacity: [0, 1] }, { duration: 0.45, ease: "easeOut" });
    flag.current?.removeAttribute("data-up");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "sending") return;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (response.ok) {
        setDate(today());
        await post();
        setState({ kind: "sent", name: data.name.split(" ")[0] || "friend" });
        return;
      }
      const { error } = (await response.json().catch(() => ({ error: "failed" }))) as { error?: string };
      setState({ kind: "error", message: PROBLEMS[error ?? "failed"] ?? PROBLEMS.failed });
    } catch {
      setState({ kind: "error", message: PROBLEMS.failed });
    }
    if (card.current && !reduced()) animate(card.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.45 });
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PERSON.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PERSON.email}`;
    }
  };

  return (
    <div ref={scope} className={styles.desk}>
      <div className={styles.cardSlot}>
        {/* the postcard: the form */}
        <div ref={card} className={styles.card}>
          <form ref={form} onSubmit={send} className={styles.face} aria-label="Write to Ahmad">
            <div className={styles.message}>
              <p className={styles.greeting}>Dear Ahmad,</p>
              <label htmlFor="card-message" className="sr-only">
                Message, at least 10 characters
              </label>
              <textarea id="card-message" name="message" required minLength={10} maxLength={5000} rows={5} placeholder="Tell me about the project, the role, or the idea…" className={styles.lines} />
              <p className={styles.signoff}>
                — yours, <span className={styles.signature}>{name || "…"}</span>
              </p>
            </div>

            <div className={styles.address}>
              <div className={styles.stampCorner}>
                <span className={styles.stamp}>
                  <Stamp />
                </span>
                <div ref={postmark} className={styles.postmark}>
                  <Postmark date={date} />
                </div>
              </div>
              <p className={styles.to}>
                <span className={styles.field}>to</span>
                <strong>{PERSON.name}</strong>
                <span className="block">{PERSON.location}</span>
              </p>
              <label className={styles.line}>
                <span className={styles.field}>from</span>
                <input name="name" required maxLength={100} autoComplete="name" placeholder="your name" onChange={(e) => setName(e.target.value)} />
              </label>
              <label className={styles.line}>
                <span className={styles.field}>reply to</span>
                <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" />
              </label>
              {/* a field no person can see; a bot that fills it in is quietly ignored */}
              <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
                <label>
                  Leave this empty
                  <input name="hp_trap_x7" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <div className={styles.post}>
                <SketchButton type="submit" size="sm" tone="sage" disabled={state.kind === "sending"} icon={<ArrowRight className="sketch-btn__icon" />}>
                  {state.kind === "sending" ? "Posting…" : "Post it"}
                </SketchButton>
              </div>
            </div>
          </form>
        </div>

        {/* once it has gone: a note where it was */}
        <AnimatePresence>
          {state.kind === "sent" && (
            <motion.div key="sent" role="status" className={styles.sent} initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: -1.5 }} exit={{ opacity: 0 }}>
              <p className="ink-wobble text-xl font-bold sm:text-2xl">Posted! Thanks, {state.name}.</p>
              <p className="mt-2 text-sm text-muted">It&apos;s on its way to my inbox. I&apos;ll write back soon.</p>
              <div className="mt-4">
                <SketchButton size="sm" calm onClick={fresh}>
                  Write another
                </SketchButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the mailbox */}
      <div className={styles.mailbox}>
        <Mailbox
          door={(el) => {
            door.current = el;
          }}
          flag={(el) => {
            flag.current = el;
          }}
        />
      </div>

      {/* what went wrong, if it did */}
      <AnimatePresence>
        {state.kind === "error" && (
          <motion.p role="alert" className={styles.error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* the other ways, as stamps */}
      <div className={styles.stamps}>
        <span className="relative">
          <StampLink onClick={copy} tone="var(--color-sienna-100)" label={`Copy the email address, ${PERSON.email}`}>
            {copied ? <Check className="size-4 text-sage-700" /> : <Copy className="size-4" />}
            <span className={styles.stampText}>
              <strong>{copied ? "copied!" : "copy email"}</strong>
              <em>{PERSON.email}</em>
            </span>
          </StampLink>
        </span>
        <StampLink href={PERSON.github} tone="var(--color-sage-100)" label="GitHub">
          <GitHub className="size-4" />
          <span className={styles.stampText}>
            <strong>GitHub</strong>
            <em>AHMADMALIK1376</em>
          </span>
        </StampLink>
        <StampLink href={PERSON.linkedin} tone="var(--color-concrete-100)" label="LinkedIn">
          <LinkedIn className="size-4" />
          <span className={styles.stampText}>
            <strong>LinkedIn</strong>
            <em>in/ahmadmalik1376</em>
          </span>
        </StampLink>
        <p className={styles.where}>
          <span className="inline-flex items-center gap-1.5">
            <Pin className="size-4 text-sienna-500" /> {PERSON.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-sage-600" /> it&apos;s <LocalTime /> here
          </span>
        </p>
      </div>
    </div>
  );
}
