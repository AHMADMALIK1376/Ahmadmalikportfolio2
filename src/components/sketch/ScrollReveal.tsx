"use client";

import { useEffect } from "react";

/**
 * The scroll reveal: everything on the page marked `data-reveal` is hidden a
 * little below its place until it is scrolled to, then fades in and rises into
 * place (see the reveal styles in globals.css). Things revealed together can
 * be staggered with `--reveal-i`. Each is revealed once; scrolling back up
 * leaves it where it is.
 *
 * It is watched by one observer for the whole page, and moved only by its
 * opacity and its translate, which the browser can animate on its own.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          watch.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    const seen = new WeakSet<Element>();
    const look = () =>
      document.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        watch.observe(el);
      });
    look();
    // and whatever is added to the page later
    const added = new MutationObserver(look);
    added.observe(document.body, { childList: true, subtree: true });
    return () => {
      watch.disconnect();
      added.disconnect();
    };
  }, []);
  return null;
}
