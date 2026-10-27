import type { PostHog } from "posthog-js";
import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
let client: Promise<PostHog> | undefined;

// ponytail: posthog-js (~100 KB gzipped) is a separate chunk fetched only once
// the visitor accepts analytics, so a first visit downloads none of it and
// sends nothing to a PostHog host before consent.
function load() {
  client ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(token!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-05-30",
      opt_out_capturing_by_default: true,
      opt_out_capturing_persistence_type: "localStorage",
      opt_out_persistence_by_default: true,
    });
    // Also clears an opt-out persisted by an earlier "Reject".
    posthog.opt_in_capturing();
    return posthog;
  });
  return client;
}

/** Runs `use` with PostHog when analytics was accepted; does nothing otherwise. */
export function withPostHog(use: (posthog: PostHog) => unknown) {
  if (token && getConsent() === "granted") void load().then(use);
}

/** Starts PostHog for a visitor who already accepted, then follows the banner. */
export function startPostHog() {
  if (!token) return;
  withPostHog(() => {});

  window.addEventListener(CONSENT_EVENT, (event) => {
    const consent = (event as CustomEvent<Consent | null>).detail;
    if (consent === "granted") void load();
    else void client?.then((posthog) => posthog.opt_out_capturing());
  });
}
