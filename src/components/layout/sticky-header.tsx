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
    // on the crossing, so nothing runs per frame while scrolling. The margin
    // expands the root upwards, so the pin lands once the promo strip is gone.
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "80px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Out of flow on purpose: a flex child would eat a gap of its own and
          push the header away from the promo strip. */}
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-px" />
      <header
        data-stuck={stuck || undefined}
        className="group/header sticky top-2 z-40 rounded-xl border bg-card/80 px-5 py-2 backdrop-blur-md transition-shadow duration-300 ease-out sm:top-3 sm:px-8 sm:py-3 lg:px-10 data-[stuck]:shadow-lg"
      >
        {children}
      </header>
    </>
  );
}
