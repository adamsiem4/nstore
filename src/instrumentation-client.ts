import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// ponytail: Sentry sets no cookies and runs as error monitoring under legitimate interest.
Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
});

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",
    opt_out_capturing_by_default: true,
    opt_out_capturing_persistence_type: "localStorage",
    opt_out_persistence_by_default: true,
  });

  if (getConsent() === "granted") posthog.opt_in_capturing();

  window.addEventListener(CONSENT_EVENT, (event) => {
    const consent = (event as CustomEvent<Consent | null>).detail;
    if (consent === "granted") posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
