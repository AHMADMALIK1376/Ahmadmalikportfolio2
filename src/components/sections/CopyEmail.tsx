"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PERSON } from "@/lib/content";
import SketchButton from "@/components/sketch/SketchButton";
import { Check, Copy } from "@/components/sketch/Icons";

/** Copies the email address, and says so with a little note that pops up. */
export default function CopyEmail() {
  const [copied, setCopied] = useState(false);

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
    <span className="relative inline-flex">
      <SketchButton size="sm" calm onClick={copy} icon={copied ? <Check className="sketch-btn__icon text-sage-600" /> : <Copy className="sketch-btn__icon" />}>
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> email address</span>
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
  );
}
