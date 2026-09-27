"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Types each title out, holds it, then backspaces it, forever — a block cursor
 * blinking at the end, as on a real typewriter-style terminal. Screen readers
 * hear every title once instead of the keystrokes.
 */
export default function Typewriter({ words }: { words: readonly string[] }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState({ word: 0, length: words[0].length, deleting: false });

  useEffect(() => {
    if (reduce) return;
    const word = words[state.word];
    const full = state.length === word.length;
    const empty = state.length === 0;
    const wait = !state.deleting && full ? 1900 : state.deleting && empty ? 350 : state.deleting ? 38 : 75 + Math.random() * 60;

    const timer = window.setTimeout(() => {
      setState((s) => {
        if (!s.deleting && s.length === words[s.word].length) return { ...s, deleting: true };
        if (s.deleting && s.length === 0) return { word: (s.word + 1) % words.length, length: 0, deleting: false };
        return { ...s, length: s.length + (s.deleting ? -1 : 1) };
      });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [state, words, reduce]);

  const shown = reduce ? words[0] : words[state.word].slice(0, state.length);

  return (
    <span className="inline-flex items-baseline">
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="text-sienna-600">
        &gt;&nbsp;
      </span>
      <span aria-hidden="true">{shown}</span>
      <span aria-hidden="true" className="ml-1 inline-block h-[1em] w-[0.55em] translate-y-[0.12em] animate-blink bg-sage-500" />
    </span>
  );
}
