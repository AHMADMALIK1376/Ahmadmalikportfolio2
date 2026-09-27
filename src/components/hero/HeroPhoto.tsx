"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";
import Doodle from "@/components/sketch/Doodle";
import photo from "@/assets/ahmad.png";

/**
 * The photo, taped into the sketchbook like a polaroid. It drops onto the page
 * when the site opens, floats gently, and leans toward the pointer.
 */
export default function HeroPhoto() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-9, 9]), { stiffness: 150, damping: 15 });

  const lean = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - box.left) / box.width - 0.5);
    y.set((event.clientY - box.top) / box.height - 0.5);
  };
  const settle = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-[25rem] [perspective:1000px]">
      {/* margin notes around the photo */}
      <div aria-hidden="true" className="absolute -left-40 top-16 hidden w-40 -rotate-6 text-center xl:block">
        <span className="block text-sm font-bold text-sienna-600">that&apos;s me!</span>
        <Doodle kind="loop" className="ml-6 w-32 text-sienna-500" delay={1.6} />
      </div>
      <Doodle kind="sparkle" className="absolute -right-4 -top-8 z-10 size-12 text-sienna-500" delay={1.4} now strokeWidth={3.5} />
      <Doodle kind="star" className="absolute -bottom-6 -left-6 z-10 size-12 text-sage-500" delay={1.8} now />
      <Doodle kind="spiral" className="absolute -right-10 bottom-24 hidden size-14 text-concrete-500 sm:block" delay={2.1} now strokeWidth={2.5} />

      <div className="hero-drop">
        <div className="float">
          <motion.div
            onPointerMove={lean}
            onPointerLeave={settle}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="sketch-box ink-sage p-3.5 pb-16 [--box-fill:var(--color-paper-2)]"
          >
            <span className="sketch-tape -left-5 top-2 -rotate-[28deg]" />
            <span className="sketch-tape -right-6 top-3 rotate-[32deg]" />

            <div className="relative overflow-hidden rounded-[1.1rem] bg-sage-100">
              <Image
                src={photo}
                alt="Muhammad Ahmad Malik standing against a wall, typing on a laptop."
                preload
                sizes="(min-width: 1024px) 400px, 90vw"
                className="h-auto w-full saturate-[0.88]"
              />
            </div>
            <p className="ink-wobble absolute inset-x-0 bottom-4 text-center text-base font-bold">
              ahmad<span className="text-sage-600">,</span> mid-deploy <span className="text-sienna-500">✶</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
