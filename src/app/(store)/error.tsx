"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { PillButton, pillButtonVariants } from "@/components/ui/pill-button";

/** A page that failed to render, shown inside the store layout so the header and footer stay usable. */
export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        This page didn&apos;t load. Try again, or head back to the shop.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <PillButton className="h-12 px-8 text-base" onClick={() => retry()}>
          Try again
        </PillButton>
        <Link href="/products" className={pillButtonVariants({ variant: "ghost", className: "h-12 px-6 text-base" })}>
          Back to shop
        </Link>
      </div>
    </div>
  );
}
