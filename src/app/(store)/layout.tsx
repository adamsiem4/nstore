import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
