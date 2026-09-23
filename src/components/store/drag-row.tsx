"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

const DRAG_SLOP = 6;

/** Horizontal scroll-snap row with cursor drag, the way fizik.com does it. */
export function DragRow({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & { "aria-label"?: string }) {
  const row = useRef<HTMLUListElement>(null);
  const grab = useRef({ x: 0, left: 0, moved: 0, down: false, captured: false });

  // ponytail: wheel, touch, keyboard and snapping are already native — this
  // only teaches a mouse to drag.
  function onPointerDown(event: PointerEvent<HTMLUListElement>) {
    const el = row.current;
    if (!el || event.pointerType === "touch" || event.button !== 0) return;
    // No preventDefault: cancelling pointerdown also cancels the compatibility
    // click, which would kill every card link. onDragStart stops the browser's
    // own image drag instead.
    grab.current = { x: event.clientX, left: el.scrollLeft, moved: 0, down: true, captured: false };
  }

  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    const el = row.current;
    if (!el || !grab.current.down) return;
    const dx = event.clientX - grab.current.x;
    grab.current.moved = Math.max(grab.current.moved, Math.abs(dx));
    if (grab.current.moved <= DRAG_SLOP) return;
    if (!grab.current.captured) {
      // Capture and snap-off only once this is really a drag: a captured
      // pointer retargets the following click to this row, so a plain click
      // on a card would never reach its link.
      grab.current.captured = true;
      el.style.scrollSnapType = "none";
      el.setPointerCapture(event.pointerId);
    }
    el.scrollLeft = grab.current.left - dx;
  }

  function onPointerUp(event: PointerEvent<HTMLUListElement>) {
    const el = row.current;
    if (!el || !grab.current.down) return;
    grab.current.down = false;
    if (!grab.current.captured) return;
    el.releasePointerCapture(event.pointerId);
    el.style.scrollSnapType = "";
  }

  return (
    <ul
      {...rest}
      ref={row}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragStart={(event) => event.preventDefault()}
      // A drag that ends on a card must not follow its link.
      onClickCapture={(event) => {
        if (grab.current.moved <= DRAG_SLOP) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      // relative: the cards' sr-only status spans are absolutely positioned,
      // and without a positioned scroller they escape it and widen the page
      // (or the cart drawer) by the row's full scroll length.
      // ponytail: no touch-action — pan-y was blocking the horizontal swipe
      // this row exists for. onPointerDown already ignores touch, so the
      // browser's own panning has nothing to fight.
      className={cn("relative cursor-grab select-none active:cursor-grabbing", className)}
    >
      {children}
    </ul>
  );
}
