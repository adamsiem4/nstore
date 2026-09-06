"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const messages = [
  { label: "Free shipping on orders over €60" },
  { label: "Explore new arrivals", href: "/products" },
  { label: "30 days returns" },
  { label: "Sale", href: "/products" },
];

/** Copies of the message list; the keyframes slide exactly one of them. */
const COPIES = 6;

/** Scrolling promo strip above the store panel. */
export function AnnouncementBar() {
  // ponytail: dismissal lives in component state, so it returns on reload —
  // move it to a cookie only if that actually annoys someone
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-foreground py-2 pr-1 pl-2 text-background">
      {/* py-1: the clip box has to be taller than the line box or overflow-hidden
          eats the link underlines */}
      <div className="flex-1 overflow-hidden py-1">
        <div className="flex w-max animate-marquee will-change-transform motion-reduce:animate-none">
          {Array.from({ length: COPIES }, (_, copy) => (
            <ul
              key={copy}
              aria-hidden={copy > 0}
              className="flex shrink-0 items-center"
            >
              {messages.map(({ label, href }) => (
                <li
                  key={label}
                  className="px-28 text-xs font-medium tracking-[0.14em] whitespace-nowrap uppercase"
                >
                  {href ? (
                    <Link
                      href={href}
                      tabIndex={copy > 0 ? -1 : undefined}
                      className="underline decoration-1 underline-offset-4 hover:decoration-background/50"
                    >
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss announcement"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-background hover:bg-background/15 hover:text-background"
      >
        <XIcon />
      </Button>
    </div>
  );
}
