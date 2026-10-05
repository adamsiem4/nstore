"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SoftPillButton } from "@/components/ui/pill-button";
import { getConsent, setConsent, subscribeConsent } from "@/lib/consent";

// ponytail: one optional category; Accept leads, Reject stays same size, same layer, fully legible.
/** Pop the cookie choice once; later changes live under the footer's Cookie preferences. */
export function CookieBanner() {
  // Server and hydration render nothing; the real choice arrives right after.
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => "denied" as const);

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-3 left-3 z-50 w-[calc(100vw-1.5rem)] max-w-sm rounded-xl border bg-card p-4 text-card-foreground shadow-lg"
    >
      <h2 id="cookie-consent-title" className="text-sm font-semibold">
        Cookies
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Necessary cookies keep the shop working. PostHog analytics runs only if you accept.{" "}
        <Link
          href="/cookies"
          className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          Cookie Policy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SoftPillButton
          type="button"
          variant="outline"
          className="h-9 flex-1 focus-visible:ring-foreground"
          onClick={() => setConsent("denied")}
        >
          Reject analytics
        </SoftPillButton>
        <SoftPillButton
          type="button"
          className="h-9 flex-1 focus-visible:ring-foreground"
          onClick={() => setConsent("granted")}
        >
          Accept analytics
        </SoftPillButton>
      </div>
    </div>
  );
}
