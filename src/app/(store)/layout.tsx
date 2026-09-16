import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/header";
import { StickyHeader } from "@/components/layout/sticky-header";
import { PROMO_COOKIE } from "@/lib/promo";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const promoDismissed = (await cookies()).get(PROMO_COOKIE)?.value === "1";

  // ponytail: --chrome is the measured gutter+header+gap+card-inset+gutter
  // above and below the panel; --promo flips off by itself when the strip
  // unmounts, so the hero can fill the viewport without a resize listener.
  return (
    <div className="flex min-h-svh w-full flex-col gap-2 p-2 [--chrome:99px] [--promo:0px] sm:gap-3 sm:p-3 sm:[--chrome:127px] [&:has(>aside)]:[--promo:64px]">
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-4 focus:outline-foreground"
      >
        Skip to content
      </a>
      {!promoDismissed && <AnnouncementBar />}
      <StickyHeader>
        <SiteHeader />
      </StickyHeader>
      {children}
      <SiteFooter />
    </div>
  );
}
