"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useRef, useState, type FormEvent } from "react";
import { PERSON } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import LocalTime from "@/components/LocalTime";
import { ArrowRight, Check, Clock, Copy, GitHub, LinkedIn, Pin } from "@/components/sketch/Icons";
import PostScene, { type PostApi } from "./PostScene";
import styles from "./Postcard.module.css";

/**
 * The contact form, as a postcard, and the post box it is posted in.
 *
 * The card is the form: the message is written on its left half, on ruled
 * lines, under "Dear Ahmad," and signed with the name as it is typed; on its
 * right half, the address, and the name and email it is from. Sending it
 * posts to /api/contact, which emails Ahmad; once it has gone the card is
 * packed into an envelope — it slides in, the flap shuts, the envelope turns
 * over, a stamp is stuck on and franked — and the envelope flies to the post
 * box beside it and in through its slot. Then the post comes for it (see
 * PostScene). Under it all, the site's own buttons: copy the email address,
 * GitHub and LinkedIn.
 */

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "error"; message: string };

const PROBLEMS: Record<string, string> = {
  invalid: "Something on the card doesn't look right — check the email address, and write at least a sentence.",
  busy: "That's a lot of cards in a short time. Please try again in a little while.",
  unavailable: `The post isn't connected yet. Please email me directly at ${PERSON.email}.`,
  failed: `The card couldn't be sent just now. Please email me directly at ${PERSON.email}.`,
};

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

/** The stamp stuck on the envelope: a sparkle, the country and the price, on a perforated edge. */
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

/** The postmark franked over the stamp: the town round a ring, the date, and wavy lines. */
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

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [scope, animate] = useAnimate();
  const post = useRef<PostApi | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const envelope = useRef<HTMLDivElement>(null);
  const turner = useRef<HTMLDivElement>(null);
  const letter = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * The card is packed into an envelope and posted: it shrinks into the envelope's mouth and slides in, the flap shuts,
   * the envelope turns over, a stamp is stuck on and franked, and the envelope flies to the post box and in at its slot.
   */
  async function pack() {
    const [c, env, turn, inner, top, st, pm] = [card.current, envelope.current, turner.current, letter.current, flap.current, stamp.current, mark.current];
    if (!c || !env || !turn || !inner || !top || !st || !pm || reduced()) return;
    // the envelope, ready: open, face down, the letter to go in drawn to the card's own shape
    const cardBox = c.getBoundingClientRect();
    const envBox = env.getBoundingClientRect();
    const aspect = cardBox.width / cardBox.height;
    const w = Math.min(envBox.width * 0.9, envBox.height * 0.86 * aspect);
    Object.assign(inner.style, { width: `${w}px`, height: `${w / aspect}px`, opacity: "0" });
    top.style.zIndex = "1";
    await animate(env, { opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 }, { duration: 0 });
    // the card shrinks to the size of the letter in the envelope's mouth; the envelope opens round it, and it is the letter
    await animate(inner, { y: "-62%" }, { duration: 0 });
    const into = inner.getBoundingClientRect();
    await animate(
      c,
      { x: into.left + into.width / 2 - (cardBox.left + cardBox.width / 2), y: into.top + into.height / 2 - (cardBox.top + cardBox.height / 2), scale: into.width / cardBox.width },
      { duration: 0.6, ease: [0.5, 0, 0.2, 1] },
    );
    inner.style.opacity = "1";
    c.style.opacity = "0";
    await animate(env, { opacity: 1 }, { duration: 0.22, ease: "easeOut" });
    // and slides in; the flap shuts
    await animate(inner, { y: "0%" }, { duration: 0.45, ease: [0.4, 0, 0.2, 1] });
    top.style.zIndex = "4";
    await animate(top, { rotateX: [180, 0] }, { duration: 0.42, ease: "easeInOut" });
    // it turns over, and is stamped and franked
    await animate(turn, { rotateY: [0, 180] }, { duration: 0.6, ease: [0.4, 0, 0.2, 1] });
    await animate(st, { opacity: [0, 1], scale: [2.2, 1], rotate: [-28, 5] }, { duration: 0.34, ease: [0.3, 1.5, 0.5, 1] });
    await animate(pm, { opacity: [0, 1], scale: [1.7, 1], rotate: [-30, -12] }, { duration: 0.3, ease: [0.3, 1.6, 0.5, 1] });
    await new Promise((done) => setTimeout(done, 350));
    // then flies to the post box, and in at its slot
    const slot = post.current?.slot();
    if (!slot) return;
    const from = env.getBoundingClientRect();
    const k = (slot.width * 1.05) / from.width;
    post.current?.flap(true);
    await animate(
      env,
      { x: slot.left + slot.width / 2 - (from.left + from.width / 2), y: slot.top - (from.height * k) / 2 - 6 - (from.top + from.height / 2), scale: k, rotate: -6 },
      { duration: 0.9, ease: [0.5, 0, 0.25, 1] },
    );
    const dip = (from.height * k) / 2 + 10;
    const now = env.getBoundingClientRect();
    await animate(env, { y: now.top - from.top + dip + (from.height * (1 - k)) / 2, opacity: 0 }, { duration: 0.32, ease: "easeIn" });
    post.current?.flap(false);
  }

  /** A fresh card, back in its place, and the envelope put away. */
  function fresh() {
    setState({ kind: "idle" });
    setName("");
    form.current?.reset();
    const [c, env, turn, top, st, pm] = [card.current, envelope.current, turner.current, flap.current, stamp.current, mark.current];
    if (env) Object.assign(env.style, { opacity: "0", transform: "" });
    if (turn) turn.style.transform = "";
    if (top) top.style.transform = "";
    if (st) st.style.opacity = "0";
    if (pm) pm.style.opacity = "0";
    if (!c) return;
    if (reduced()) {
      c.style.transform = "";
      c.style.opacity = "1";
      return;
    }
    animate(c, { x: 0, y: [24, 0], scale: [0.96, 1], rotate: 0, opacity: [0, 1] }, { duration: 0.45, ease: "easeOut" });
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
        await pack();
        setState({ kind: "sent", name: data.name.split(" ")[0] || "friend" });
        if (!reduced()) void post.current?.collect();
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
              <div className={styles.stampCorner} aria-hidden="true">
                <span className={styles.stampPlace}>
                  stamp
                  <br />
                  here
                </span>
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
                  {state.kind === "sending" ? "Sending…" : "Send it"}
                </SketchButton>
              </div>
            </div>
          </form>
        </div>

        {/* the envelope it is packed into once it has gone: its back, with the flap, and its front, with the address */}
        <div ref={envelope} className={styles.envelope} aria-hidden="true">
          <div ref={turner} className={styles.turner}>
            <div className={styles.envBack}>
              <div ref={letter} className={styles.letter}>
                <i />
                <i />
                <i />
              </div>
              <svg viewBox="0 0 100 62" preserveAspectRatio="none" className={styles.pocket}>
                <path d="M0 0L47 35L0 62Z" fill="#ecbea9" stroke="rgba(45,47,43,0.5)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                <path d="M100 0L53 35L100 62Z" fill="#ecbea9" stroke="rgba(45,47,43,0.5)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                <path d="M0 62L50 27L100 62Z" fill="#e2b5a1" stroke="rgba(45,47,43,0.5)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              </svg>
              <div ref={flap} className={styles.flap}>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0 0L50 38L100 0Z" fill="#de9372" stroke="rgba(45,47,43,0.55)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
            <div className={styles.envFront}>
              <p className={styles.envTo}>
                <span className={styles.field}>to</span>
                {PERSON.name}
                <span>{PERSON.location}</span>
              </p>
              <p className={styles.envFrom}>
                <span className={styles.field}>from</span>
                {name || "a friend"}
              </p>
              <div ref={stamp} className={styles.envStamp}>
                <Stamp />
              </div>
              <div ref={mark} className={styles.envPostmark}>
                <Postmark date={date} />
              </div>
            </div>
          </div>
        </div>

        {/* once it has gone: a note where it was */}
        <AnimatePresence>
          {state.kind === "sent" && (
            <motion.div key="sent" role="status" className={styles.sent} initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: -1.5 }} exit={{ opacity: 0 }}>
              <p className="ink-wobble text-xl font-bold sm:text-2xl">Sent! Thanks, {state.name}.</p>
              <p className="mt-2 text-sm text-muted">Your letter is in the post, on its way to my inbox. I&apos;ll write back soon.</p>
              <div className="mt-4">
                <SketchButton size="sm" calm onClick={fresh}>
                  Write another
                </SketchButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the post box, and the post that comes for the letter */}
      <div className={styles.sceneSlot}>
        <PostScene apiRef={post} />
      </div>

      {/* what went wrong, if it did */}
      <AnimatePresence>
        {state.kind === "error" && (
          <motion.p role="alert" className={styles.error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* the other ways, as the site's own buttons */}
      <div className={styles.links}>
        <span className="relative inline-flex">
          <SketchButton size="sm" calm onClick={copy} icon={copied ? <Check className="sketch-btn__icon text-sage-600" /> : <Copy className="sketch-btn__icon" />}>
            {copied ? "Copied" : "Copy email"}
            <span className="sr-only"> address, {PERSON.email}</span>
          </SketchButton>
          <AnimatePresence>
            {copied && (
              <motion.span
                role="status"
                className="ink-wobble absolute -top-9 left-1/2 whitespace-nowrap rounded-full bg-sage-200 px-3 py-1 text-xs font-bold shadow-[2px_2px_0_1px_rgb(45_47_43/0.4)]"
                initial={{ opacity: 0, y: 8, x: "-50%", rotate: -6 }}
                animate={{ opacity: 1, y: 0, x: "-50%", rotate: -3 }}
                exit={{ opacity: 0, y: -6, x: "-50%" }}
              >
                in your clipboard!
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <SketchButton href={PERSON.github} size="sm" calm icon={<GitHub className="sketch-btn__icon" />}>
          GitHub
        </SketchButton>
        <SketchButton href={PERSON.linkedin} size="sm" calm tone="sage" icon={<LinkedIn className="sketch-btn__icon" />}>
          LinkedIn
        </SketchButton>
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
