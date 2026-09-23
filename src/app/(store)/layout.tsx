import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/header";
import { StickyHeader } from "@/components/layout/sticky-header";
import { pillButtonVariants } from "@/components/ui/pill-button";

export default function StoreLayout({ children }: { children: ReactNode }) {
  // ponytail: --chrome is the measured gutter+header+gap+card-inset+gutter
  // above and below the panel, so the hero can fill the viewport exactly
  // without a resize listener. The header grows 8px at xl, where the catalog
  // nav appears — below that it is 70px, so sm..lg gets its own value.
  return (
    <div className="flex min-h-svh w-full flex-col gap-2 p-2 [--chrome:99px] sm:gap-3 sm:p-3 sm:[--chrome:119px] xl:[--chrome:127px]">
      <a
        href="#content"
        className={pillButtonVariants({
          className:
            "sr-only z-50 text-base focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:h-auto focus:px-5 focus:py-3 focus:outline-2 focus:outline-offset-4 focus:outline-foreground",
        })}
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
