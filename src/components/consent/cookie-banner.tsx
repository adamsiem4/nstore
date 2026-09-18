"use client";

import { SoftPillButton } from "@/components/ui/pill-button";
import { getConsent, setConsent, subscribeConsent } from "@/lib/consent";
import Link from "next/link";
import { useSyncExternalStore } from "react";

// ponytail: one optional category only needs equal accept/reject choices.
/** Display the cookie consent choice until the visitor answers it. */
export function CookieBanner() {
  // Server and hydration render nothing; the real choice arrives right after.
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => "denied" as const);

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-xl rounded-xl border bg-card p-4 shadow-lg sm:bottom-3"
    >
      <h2 id="cookie-consent-title" className="text-sm font-semibold">
        Your cookie choices
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We use cookies to keep the shop working and, with your consent, PostHog
        analytics to help us improve it. Read our{" "}
        <Link
          href="/cookies"
          className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          Cookie Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SoftPillButton
          type="button"
          className="w-full focus-visible:ring-foreground"
          onClick={() => setConsent("denied")}
        >
          Reject
        </SoftPillButton>
        <SoftPillButton
          type="button"
          className="w-full focus-visible:ring-foreground"
          onClick={() => setConsent("granted")}
        >
          Accept
        </SoftPillButton>
      </div>
    </div>
  );
}
