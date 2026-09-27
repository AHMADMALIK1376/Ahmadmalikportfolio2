"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";
import Doodle from "@/components/sketch/Doodle";
import photo from "@/assets/ahmad.png";

/**
 * The photo, taped into the sketchbook like a polaroid. It floats gently and
 * leans toward the pointer.
 */
export default function Polaroid() {
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
    <div className="relative mx-auto w-full max-w-[14rem] sm:max-w-[16rem] md:max-w-none [perspective:1000px]">
      <Doodle kind="sparkle" className="absolute -right-3 -top-6 z-10 size-9 text-sienna-500 sm:size-10" delay={0.5} strokeWidth={3.5} />
      <Doodle kind="star" className="absolute -bottom-5 -left-5 z-10 size-9 text-sage-500 sm:size-10" delay={0.8} />
      <Doodle kind="spiral" className="absolute -right-9 bottom-20 hidden size-11 text-concrete-500 sm:block" delay={1.1} strokeWidth={2.5} />

      <div className="float rotate-[2.5deg]">
        <motion.div
          onPointerMove={lean}
          onPointerLeave={settle}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="sketch-box p-2.5 pb-11 sm:p-3 sm:pb-12 [--box-fill:var(--color-paper-2)]"
        >
          <span className="sketch-tape -left-5 top-2 -rotate-[28deg]" />
          <span className="sketch-tape -right-6 top-3 rotate-[32deg]" />

          <div className="relative overflow-hidden rounded-[1.1rem] bg-sage-100">
            <Image
              src={photo}
              alt="Muhammad Ahmad Malik standing against a wall, typing on a laptop."
              sizes="(min-width: 1024px) 272px, 256px"
              className="h-auto w-full saturate-[0.88]"
            />
          </div>
          <p className="ink-wobble absolute inset-x-0 bottom-3 text-center text-sm font-bold">
            ahmad<span className="text-sage-600">,</span> mid-deploy <span className="text-sienna-500">✶</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
