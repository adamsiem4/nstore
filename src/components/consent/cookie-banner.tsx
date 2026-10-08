"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SoftPillButton } from "@/components/ui/pill-button";
import { getConsent, setConsent, subscribeConsent } from "@/lib/consent";
import { showModal } from "@/lib/utils";

// Stable identity, so a re-render can't reopen a banner Esc dismissed for this visit.
// Focus lands on the dialog, not the first link, so no ring flashes on page load.
const openOnMount = (dialog: HTMLDialogElement | null) => {
  if (!dialog) return;
  showModal(dialog);
  dialog.focus();
};

// ponytail: one optional category; Accept leads, Reject stays same size, same layer, fully legible.
// A native modal <dialog>: the browser blurs and inerts the page; Esc means "not now", nothing stored.
/** Pop the cookie choice once; later changes live under the footer's Cookie preferences. */
export function CookieBanner() {
  // Server and hydration render nothing; the real choice arrives right after.
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => "denied" as const);

  if (consent !== null) return null;

  return (
    <dialog
      ref={openOnMount}
      tabIndex={-1}
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-3 top-auto bottom-3 mx-auto max-w-sm rounded-xl border bg-card p-4 text-card-foreground shadow-lg outline-none backdrop:backdrop-blur-xs backdrop:transition-opacity backdrop:duration-500 starting:open:backdrop:opacity-0"
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
    </dialog>
  );
}
