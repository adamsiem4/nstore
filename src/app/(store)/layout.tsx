import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";

export default function StoreLayout({ children }: { children: ReactNode }) {
  // ponytail: flex column instead of min-h calc — the panel absorbs whatever
  // height the promo strip leaves
  return (
    <div className="flex min-h-svh w-full flex-col gap-2 p-2 sm:gap-3 sm:p-3">
      <AnnouncementBar />
      {children}
      <SiteFooter />
    </div>
  );
}
