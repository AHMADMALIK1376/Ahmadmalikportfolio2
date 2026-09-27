"use client";

import { useSyncExternalStore } from "react";
import { PERSON } from "@/lib/content";

/** The time where Ahmad is, to the minute. Empty until the page is in a browser. */

const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: PERSON.timeZone });

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(timer);
}

export default function LocalTime() {
  const time = useSyncExternalStore(
    subscribe,
    () => format.format(new Date()),
    () => "",
  );

  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {time ? `${time} PKT` : "PKT"}
    </span>
  );
}
