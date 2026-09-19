import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/header";
import { StickyHeader } from "@/components/layout/sticky-header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  // ponytail: --chrome is the measured gutter+header+gap+card-inset+gutter
  // above and below the panel, so the hero can fill the viewport exactly
  // without a resize listener.
  return (
    <div className="flex min-h-svh w-full flex-col gap-2 p-2 [--chrome:99px] sm:gap-3 sm:p-3 sm:[--chrome:127px]">
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-4 focus:outline-foreground"
      >
        Skip to content
      </a>
      <StickyHeader>
        <SiteHeader />
      </StickyHeader>
      {children}
      <SiteFooter />
    </div>
  );
}
