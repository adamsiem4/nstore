"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/** Pinned header panel; flags `data-stuck` once the page scrolls past the top. */
export function StickyHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    // Page changes start above the shared header; hash links keep their target.
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target) return;

    // ponytail: one sentinel beats a scroll listener — the observer only fires
    // on the crossing, so nothing runs per frame while scrolling. The margin
    // is the panel's own resting gap (top-2/top-3), so the glass and the
    // wordmark morph land the moment the panel leaves that gap.
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "12px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Out of flow on purpose: a flex child would eat a gap of its own and
          push the header down the page. */}
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-px" />
      {/* ponytail: the glass lives on a pseudo-element, not the header itself.
          An element with backdrop-filter becomes a backdrop root, which would
          leave the drawer below it translucent but unblurred.
          The right padding is 5px, not the left's 20/32/40: a trailing icon
          button carries 12px of its own, so its glyph lands 26px in at every
          width, optically level with the wordmark on the left. */}
      <header
        data-stuck={stuck || undefined}
        className="group/header sticky top-2 z-40 rounded-xl border py-2 pr-[5px] pl-5 transition-shadow duration-300 ease-out before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-card/80 before:backdrop-blur-md before:content-[''] sm:top-3 sm:py-3 sm:pl-8 lg:pl-10 data-[stuck]:shadow-lg"
      >
        {children}
      </header>
    </>
  );
}
