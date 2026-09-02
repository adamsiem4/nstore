import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Sentry's Node SDK must not enter Edge runtime bundles.
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Runtime-selected: the Edge init must not enter Node bundles either.
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
