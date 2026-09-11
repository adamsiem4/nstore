"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/** Pinned header panel; flags `data-stuck` once the page scrolls past the top. */
export function StickyHeader({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const target = sentinel.current;
    if (!target) return;

    // ponytail: one sentinel beats a scroll listener — the observer only fires
    // on the crossing, so nothing runs per frame while scrolling.
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px shrink-0" />
      <header
        data-stuck={stuck || undefined}
        className="group/header sticky top-2 z-40 rounded-xl border bg-card/80 px-5 py-2 backdrop-blur-md transition-shadow duration-300 ease-out sm:top-3 sm:px-8 sm:py-3 lg:px-10 data-[stuck]:shadow-lg"
      >
        {children}
      </header>
    </>
  );
}
