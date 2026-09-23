"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { PillButton } from "@/components/ui/pill-button";

const DRAWER = "cart-drawer";

/** Slides the drawer in; false means this page has none and the caller should navigate. */
export function openCart() {
  const drawer = document.getElementById(DRAWER);
  if (!(drawer instanceof HTMLDialogElement)) return false;
  if (!drawer.open) drawer.showModal();
  return true;
}

/**
 * A real /cart link — before hydration, in a new tab, and on /cart itself it
 * still navigates. A plain click opens the drawer instead, as 11 of the 12
 * minimalist shops surveyed do.
 */
export function CartLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      href="/cart"
      aria-haspopup="dialog"
      onClick={(event) => {
        if (pathname === "/cart" || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (openCart()) event.preventDefault();
      }}
    />
  );
}

/**
 * ponytail: a native modal <dialog>, no drawer library — focus trap, Esc,
 * the inert page behind and focus return are the browser's. The panel fills
 * the whole box, so a click that lands on the dialog itself came through the
 * backdrop; a link inside navigates away, so it closes the drawer too. Closed
 * dialogs are display:none by UA style, so `flex` waits for `open:`, and
 * allow-discrete keeps the box on screen for the slide out.
 */
export function CartDrawer({ count, children }: { count: number; children: ReactNode }) {
  return (
    <dialog
      id={DRAWER}
      aria-labelledby={`${DRAWER}-title`}
      onClick={(event) => {
        if (event.target === event.currentTarget || (event.target as Element).closest("a")) {
          event.currentTarget.close();
        }
      }}
      className="fixed inset-y-2 right-2 left-auto m-0 h-auto max-h-none w-[calc(100%-1rem)] max-w-md translate-x-[calc(100%+1rem)] overflow-hidden rounded-xl border bg-card p-0 text-card-foreground shadow-2xl transition-[translate,display,overlay] transition-discrete duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-black/40 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300 open:flex open:translate-x-0 open:flex-col open:backdrop:opacity-100 sm:inset-y-3 sm:right-3 sm:w-[calc(100%-1.5rem)] starting:open:translate-x-[calc(100%+1rem)] starting:open:backdrop:opacity-0"
    >
      <div className="flex items-center justify-between gap-4 py-2 pr-2 pl-5">
        <h2 id={`${DRAWER}-title`} className="text-sm font-semibold tracking-wide uppercase">
          Cart <span className="font-mono font-normal text-muted-foreground tabular-nums">({count})</span>
        </h2>
        <form method="dialog">
          <PillButton type="submit" variant="ghost" size="icon-lg" aria-label="Close cart" className="size-10">
            <XIcon aria-hidden="true" />
          </PillButton>
        </form>
      </div>
      {children}
    </dialog>
  );
}
