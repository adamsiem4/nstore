import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/header";
import { StickyHeader } from "@/components/layout/sticky-header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  // ponytail: flex column instead of min-h calc — the panel absorbs whatever
  // height the promo strip leaves
  return (
    <div className="flex min-h-svh w-full flex-col gap-2 p-2 sm:gap-3 sm:p-3">
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-4 focus:outline-foreground"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <StickyHeader>
        <SiteHeader />
      </StickyHeader>
      {children}
      <SiteFooter />
    </div>
  );
}
