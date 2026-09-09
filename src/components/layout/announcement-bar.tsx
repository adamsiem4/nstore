"use client";

import { PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const messages = [
  "Free shipping on orders over €60",
  "Home appliances & household goods",
  "30-day returns",
  "A little better, every day",
];

/** Copies of the message list; the keyframes slide exactly one of them. */
const COPIES = 6;

export function AnnouncementBar() {
  // ponytail: dismissal lives in component state, so it returns on reload —
  // move it to a cookie only if that actually annoys someone
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  if (dismissed) return null;

  return (
    <aside aria-label="Store announcements" className="flex items-center gap-2 rounded-xl bg-foreground py-1 pr-1 pl-3 text-background">
      <div className="min-w-0 flex-1 overflow-hidden py-2">
        <div
          className="flex w-max animate-marquee will-change-transform motion-reduce:w-auto motion-reduce:animate-none motion-reduce:will-change-auto"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {Array.from({ length: COPIES }, (_, copy) => (
            <ul
              key={copy}
              aria-hidden={copy > 0 ? true : undefined}
              className={copy > 0
                ? "flex shrink-0 items-center motion-reduce:hidden"
                : "flex shrink-0 items-center motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:gap-x-6 motion-reduce:gap-y-2"}
            >
              {messages.map((label) => (
                <li
                  key={label}
                  className="px-28 text-xs font-medium tracking-[0.14em] whitespace-nowrap uppercase motion-reduce:px-0 motion-reduce:tracking-normal motion-reduce:whitespace-normal"
                >
                  {label}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={paused ? "Resume announcements" : "Pause announcements"}
        onClick={() => setPaused(!paused)}
        className="size-11 shrink-0 rounded-full text-background hover:bg-background/15 hover:text-background focus-visible:ring-background motion-reduce:hidden"
      >
        {paused ? <PlayIcon aria-hidden="true" /> : <PauseIcon aria-hidden="true" />}
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Dismiss announcement"
        onClick={() => setDismissed(true)}
        className="size-11 shrink-0 rounded-full text-background hover:bg-background/15 hover:text-background focus-visible:ring-background"
      >
        <XIcon aria-hidden="true" />
      </Button>
    </aside>
  );
}
