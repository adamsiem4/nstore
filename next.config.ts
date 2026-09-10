import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// ponytail: pin root so a stray package-lock.json above the repo can't hijack it
const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
});
