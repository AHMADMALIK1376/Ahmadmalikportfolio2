"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { PERSON } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import Doodle from "@/components/sketch/Doodle";
import { ArrowRight } from "@/components/sketch/Icons";

/**
 * The message form, on a page of ruled notebook paper. Sending posts to
 * /api/contact, which emails Ahmad; when it is sent, a paper plane takes the
 * message away.
 */

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "error"; message: string };

const PROBLEMS: Record<string, string> = {
  invalid: "Something in the form doesn't look right — check the email address, and write at least a sentence.",
  busy: "That's a lot of messages in a short time. Please try again in a little while.",
  unavailable: `The form isn't connected yet. Please email me directly at ${PERSON.email}.`,
  failed: `The message couldn't be sent just now. Please email me directly at ${PERSON.email}.`,
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between text-xs font-bold uppercase tracking-[0.18em] sm:text-sm">
        {label}
        {hint && <span className="text-xs font-normal normal-case tracking-normal text-muted">{hint}</span>}
      </span>
      <span className="sketch-well block">{children}</span>
    </label>
  );
}

const input =
  "block w-full rounded-[1.1rem] bg-transparent px-3.5 py-2.5 text-sm font-bold sm:px-4 sm:py-3 sm:text-base text-ink placeholder:font-normal placeholder:text-concrete-500 focus:outline-none";

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

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
        form.reset();
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
    <div className="sketch-box relative overflow-visible">
      <span className="sketch-tape -top-3 left-10 -rotate-6" />
      <span className="sketch-tape -top-3 right-10 rotate-6" />
      <div className="notebook rounded-[1.75rem] pb-7 pl-12 pr-5 pt-9 sm:px-10 sm:pb-8 sm:pl-16 sm:pt-10">
        <AnimatePresence mode="wait" initial={false}>
          {state.kind === "sent" ? (
            <motion.div
              key="sent"
              className="flex min-h-[22rem] flex-col items-center justify-center text-center sm:min-h-[26rem]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ x: -80, y: 40, rotate: -10 }}
                animate={{ x: [-80, 0, 220], y: [40, 0, -160], rotate: [-10, 0, -20], opacity: [1, 1, 0] }}
                transition={{ duration: 2.4, times: [0, 0.45, 1], ease: "easeInOut" }}
                className="text-sienna-500"
              >
                <Doodle kind="plane" now className="w-28" duration={0.6} />
              </motion.div>
              <p role="status" className="ink-wobble mt-6 text-3xl font-bold">
                Sent! Thanks, {state.name}.
              </p>
              <p className="mt-3 max-w-sm text-muted">Your message is on its way to my inbox. I&apos;ll write back soon.</p>
              <div className="mt-8">
                <SketchButton size="sm" calm onClick={() => setState({ kind: "idle" })}>
                  Write another
                </SketchButton>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={send} className="space-y-5 sm:space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20, rotate: -2 }}>
              <p className="ink-wobble text-xl font-bold sm:text-2xl">Dear Ahmad,</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Name">
                  <input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" className={input} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className={input} />
                </Field>
              </div>
              <Field label="Message" hint="10+ characters">
                <textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder="Tell me about the project, the role, or the idea…" className={`${input} resize-y leading-8`} />
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

              <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
                <p className="ink-wobble text-base font-bold text-muted sm:text-lg">— yours,</p>
                <SketchButton type="submit" lasso disabled={state.kind === "sending"} icon={<ArrowRight className="sketch-btn__icon" />}>
                  {state.kind === "sending" ? "Sending…" : "Send it"}
                </SketchButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
