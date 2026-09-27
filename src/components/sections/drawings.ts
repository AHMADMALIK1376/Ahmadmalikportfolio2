import type { Service } from "@/lib/content";

/** A small working drawing for each kind of work, in a 120 by 90 box: the cards' icons. */
export const DRAWINGS: Record<Service["doodle"], string[]> = {
  // a loss curve, falling
  llm: [
    "M14 8c-1 22 0 45 1 68 32 1 64 0 96-1",
    "M20 16c7 5 11 22 20 32 10 11 21 15 34 17 12 2 24 2 34 2",
    "M40 47h.1M60 60h.1M84 66h.1",
    "M92 20c4 4 7 9 9 14M101 34c-4-1-8-1-12 0",
  ],
  // clients over a gateway over services over data
  architecture: [
    "M10 8h24v13H10zM48 8h24v13H48zM86 8h24v13H86z",
    "M22 21v12M60 21v12M98 21v12",
    "M9 33c34-1 68-1 102 0v12c-34 1-68 1-102 0z",
    "M35 45v10M85 45v10M20 55h30v12H20zM70 55h30v12H70z",
    "M45 76c0-4 30-4 30 0v7c0 4-30 4-30 0zM45 76c0 4 30 4 30 0",
  ],
  // a browser window with a page in it
  web: [
    "M8 10c35-1 70-1 104 0 1 23 1 46 0 70-35 1-70 1-104 0-1-24-1-47 0-70z",
    "M8 22c35 1 70 1 104 0M15 16h.1M21 16h.1M27 16h.1",
    "M18 34h40M18 43h30M18 52h36",
    "M70 32h32v28H70zM70 60l11-12 8 8 5-5 8 9",
    "M18 64h22v8H18z",
  ],
  // a rack of servers, lights on
  backend: [
    "M20 8c27-1 53-1 80 0v20c-27 1-53 1-80 0z",
    "M20 34c27-1 53-1 80 0v20c-27 1-53 1-80 0z",
    "M20 60c27-1 53-1 80 0v20c-27 1-53 1-80 0z",
    "M30 18h.1M30 44h.1M30 70h.1M44 18h40M44 44h40M44 70h40",
  ],
  // a box, its padding, a measurement and a pointer
  frontend: [
    "M22 16c25-1 50-1 74 0 1 17 1 35 0 52-25 1-49 1-74 0-1-17-1-35 0-52z",
    "M34 28h50v28H34z",
    "M10 16v52M7 20l3-4 3 4M7 64l3 4 3-4",
    "M86 50l12 28 4-11 11-4z",
  ],
};
