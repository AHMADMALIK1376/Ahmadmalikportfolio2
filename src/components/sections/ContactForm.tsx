"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type CSSProperties, type FormEvent, type SyntheticEvent } from "react";
import { PERSON } from "@/lib/content";
import Plotter, { type Aim } from "@/components/plotter/Plotter";
import { FORM, type Box, type Input, type Letter } from "@/components/plotter/hand";
import plotter from "@/components/plotter/Plotter.module.css";

/**
 * The contact form, as the pen plotter. The form is printed on the plotter's
 * sheet, and the sheet is the form: its boxes have real fields laid over them,
 * so the visitor clicks a box on the paper and types, and the pen writes every
 * character into the box the moment it is typed, and waits where the next one
 * will go. Sending posts to /api/contact, which emails Ahmad; when it is sent,
 * the sheet is fed out of the plotter and a fresh one comes in.
 */

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "error"; message: string };

const PROBLEMS: Record<string, string> = {
  invalid: "Something on the form doesn't look right — check the email address, and write at least a sentence.",
  busy: "That's a lot of messages in a short time. Please try again in a little while.",
  unavailable: `The form isn't connected yet. Please email me directly at ${PERSON.email}.`,
  failed: `The message couldn't be sent just now. Please email me directly at ${PERSON.email}.`,
};

const BLANK: Letter = { name: "", email: "", message: "" };

/** Where a box printed on the sheet is, as the style of the field laid over it. */
const over = ({ u0, u1, v0, v1 }: Box): CSSProperties => ({ left: u0, top: v0, width: u1 - u0, height: v1 - v0 });

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [letter, setLetter] = useState<Letter>(BLANK);
  const [sent, setSent] = useState(0);
  const [aim, setAim] = useState<Aim>(null);
  const nameBox = useRef<HTMLInputElement>(null);

  /** The pen follows the cursor: the box being typed into, and where in it. */
  const follow = (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    setAim({ field: el.name as Input, index: el.selectionStart ?? el.value.length });
  };
  const change = (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    setLetter((now) => ({ ...now, [el.name]: el.value }));
    follow(event);
  };
  const field = { onChange: change, onFocus: follow, onSelect: follow, onKeyUp: follow, onClick: follow, onBlur: () => setAim(null) };

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "sending") return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        // the plotter feeds the written sheet out, and a clean one comes in
        setSent((n) => n + 1);
        setLetter(BLANK);
        setAim(null);
        setState({ kind: "sent", name: data.name.split(" ")[0] || "friend" });
        return;
      }
      const { error } = (await response.json().catch(() => ({ error: "failed" }))) as { error?: string };
      setState({ kind: "error", message: PROBLEMS[error ?? "failed"] ?? PROBLEMS.failed });
    } catch {
      setState({ kind: "error", message: PROBLEMS.failed });
    }
  }

  return (
    <div className="relative min-w-0">
      <Plotter
        letter={letter}
        sent={sent}
        aim={aim}
        onPoke={() => {
          if (!aim) nameBox.current?.focus();
        }}
        form={
          <form onSubmit={send} aria-label="Write to Ahmad" className="absolute inset-0">
            <label className="sr-only" htmlFor="contact-name">
              Name
            </label>
            <input ref={nameBox} id="contact-name" name="name" value={letter.name} {...field} required maxLength={100} autoComplete="name" placeholder="Your name" className={plotter.field} style={over(FORM.name)} />
            <label className="sr-only" htmlFor="contact-email">
              Email
            </label>
            <input id="contact-email" name="email" type="email" value={letter.email} {...field} required maxLength={200} autoComplete="email" placeholder="you@example.com" className={plotter.field} style={over(FORM.email)} />
            <label className="sr-only" htmlFor="contact-message">
              Message, at least 10 characters
            </label>
            <textarea id="contact-message" name="message" value={letter.message} {...field} required minLength={10} maxLength={5000} placeholder="Tell me about the project, the role, or the idea…" className={plotter.field} style={over(FORM.message)} />

            {/* a field no person can see; a bot that fills it in is quietly ignored */}
            <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
              <label>
                Leave this empty
                <input name="hp_trap_x7" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <button type="submit" disabled={state.kind === "sending"} className={plotter.send} style={over(FORM.send)}>
              {state.kind === "sending" ? "Sending" : "Send it"}
            </button>
          </form>
        }
      />

      {/* how the sending went */}
      <div className="mx-auto mt-1 min-h-[2.5rem] max-w-xl text-center">
        <AnimatePresence mode="wait" initial={false}>
          {state.kind === "sending" && (
            <motion.p key="sending" role="status" className="text-sm font-bold text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Sending…
            </motion.p>
          )}
          {state.kind === "sent" && (
            <motion.p key="sent" role="status" className="ink-wobble text-lg font-bold" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Sent! Thanks, {state.name} — your letter is on its way to my inbox.
            </motion.p>
          )}
          {state.kind === "error" && (
            <motion.p key="error" role="alert" className="rounded-2xl bg-sienna-100 px-4 py-3 text-sm font-bold text-sienna-700" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {state.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
