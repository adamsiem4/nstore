"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent, subscribeConsent } from "@/lib/consent";

/** Show and update the visitor's optional analytics choice. */
export function CookiePreferences() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const status =
    consent === "granted"
      ? "Analytics accepted"
      : consent === "denied"
        ? "Analytics rejected"
        : "No choice saved";

  return (
    <section aria-labelledby="cookie-preferences-heading" className="mt-10 rounded-xl bg-muted/60 p-5 sm:p-6">
      <h2 id="cookie-preferences-heading" className="text-2xl font-semibold tracking-tight">
        Your cookie settings
      </h2>
      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
        Current choice: <span className="font-medium text-foreground">{status}</span>
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          className="h-11 w-full focus-visible:ring-foreground"
          onClick={() => setConsent("granted")}
        >
          Accept analytics
        </Button>
        <Button
          type="button"
          className="h-11 w-full focus-visible:ring-foreground"
          onClick={() => setConsent("denied")}
        >
          Reject analytics
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full focus-visible:ring-foreground"
          onClick={() => setConsent(null)}
        >
          Clear choice
        </Button>
      </div>
    </section>
  );
}
