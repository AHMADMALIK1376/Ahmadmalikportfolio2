"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { PERSON } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Doodle from "@/components/sketch/Doodle";
import { ArrowRight } from "@/components/sketch/Icons";
import Plotter from "@/components/plotter/Plotter";
import type { Letter } from "@/components/plotter/hand";

/**
 * The message form and the pen plotter beside it. Everything typed into the
 * form is written out on the plotter's notebook page as it is typed. Sending
 * posts to /api/contact, which emails Ahmad; when it is sent, the page is fed
 * out of the plotter and a fresh one comes in.
 */

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "error"; message: string };

const PROBLEMS: Record<string, string> = {
  invalid: "Something in the form doesn't look right — check the email address, and write at least a sentence.",
  busy: "That's a lot of messages in a short time. Please try again in a little while.",
  unavailable: `The form isn't connected yet. Please email me directly at ${PERSON.email}.`,
  failed: `The message couldn't be sent just now. Please email me directly at ${PERSON.email}.`,
};

const BLANK: Letter = { name: "", email: "", message: "" };

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] sm:text-xs">
        {label}
        {hint && <span className="truncate text-[0.68rem] font-normal normal-case tracking-normal text-muted">{hint}</span>}
      </span>
      <span className="sketch-well block">{children}</span>
    </label>
  );
}

const input =
  "block w-full rounded-[1.1rem] bg-transparent px-3.5 py-2 text-sm font-bold text-ink placeholder:font-normal placeholder:text-concrete-500 focus:outline-none sm:px-4 sm:py-2.5";

export default function ContactForm({ aside }: { aside: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [letter, setLetter] = useState<Letter>(BLANK);
  const [sent, setSent] = useState(0);
  const messageBox = useRef<HTMLTextAreaElement>(null);

  const change = (field: keyof Letter) => (event: { target: { value: string } }) => setLetter((now) => ({ ...now, [field]: event.target.value }));

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        // the plotter feeds the written page out, and a clean one comes in
        setSent((n) => n + 1);
        setLetter(BLANK);
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
    <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
      {/* the plotter, which writes the letter out as it is typed */}
      <div className="relative min-w-0 lg:order-2">
        <Plotter letter={letter} sent={sent} onPoke={() => messageBox.current?.focus()} className="mx-auto max-w-[34rem] lg:max-w-none" />
        <div aria-hidden="true" className="pointer-events-none absolute left-[1%] top-[6%] hidden -rotate-6 text-sm font-bold leading-tight text-sienna-600 xl:block">
          it writes your letter
          <br />
          as you type it
          <Doodle kind="arrow-curl" className="ml-12 mt-1 w-16 rotate-[20deg] text-sienna-500" delay={0.4} />
        </div>
      </div>

      <div className="min-w-0 space-y-5 lg:order-1">
        <div className="sketch-box relative p-5 sm:p-6">
          <span className="sketch-tape -top-3 left-8 -rotate-6" />
          <AnimatePresence mode="wait" initial={false}>
            {state.kind === "sent" ? (
              <motion.div key="sent" className="flex min-h-[17.5rem] flex-col items-center justify-center text-center" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <p role="status" className="ink-wobble text-2xl font-bold">
                  Sent! Thanks, {state.name}.
                </p>
                <p className="mt-3 max-w-xs text-sm text-muted">Your letter is on its way to my inbox. I&apos;ll write back soon.</p>
                <div className="mt-6">
                  <SketchButton size="sm" calm onClick={() => setState({ kind: "idle" })}>
                    Write another
                  </SketchButton>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={send} className="space-y-3.5 sm:space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16 }}>
                <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                  <Field label="Name">
                    <input name="name" value={letter.name} onChange={change("name")} required maxLength={100} autoComplete="name" placeholder="Your name" className={input} />
                  </Field>
                  <Field label="Email">
                    <input name="email" type="email" value={letter.email} onChange={change("email")} required maxLength={200} autoComplete="email" placeholder="you@example.com" className={input} />
                  </Field>
                </div>
                <Field label="Message" hint="10+ characters">
                  <textarea
                    ref={messageBox}
                    name="message"
                    value={letter.message}
                    onChange={change("message")}
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={4}
                    placeholder="Tell me about the project, the role, or the idea…"
                    className={`${input} resize-none leading-6`}
                  />
                </Field>

                {/* a field no person can see; a bot that fills it in is quietly ignored */}
                <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
                  <label>
                    Leave this empty
                    <input name="hp_trap_x7" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <AnimatePresence>
                  {state.kind === "error" && (
                    <motion.p
                      role="alert"
                      className="rounded-2xl bg-sienna-100 px-4 py-3 text-sm font-bold text-sienna-700"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {state.message}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <p className="ink-wobble text-sm font-bold text-muted">— yours,</p>
                  <SketchButton type="submit" size="sm" tone="sage" disabled={state.kind === "sending"} icon={<ArrowRight className="sketch-btn__icon" />}>
                    {state.kind === "sending" ? "Sending…" : "Send it"}
                  </SketchButton>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {aside}
      </div>
    </div>
  );
}
