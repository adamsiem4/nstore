import * as Sentry from "@sentry/nextjs";
import { startPostHog } from "@/lib/posthog";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// ponytail: Sentry sets no cookies and runs as error monitoring under legitimate interest.
Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});

startPostHog();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
