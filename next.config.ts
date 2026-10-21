import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// ponytail: pin root so a stray package-lock.json above the repo can't hijack it
const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  // Browsers and crawlers still probe the root favicon; serve it from public/icons/.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icons/favicon.ico" }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "adp-g6",
  project: "nstore",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  // Same-origin route so ad blockers don't drop client errors.
  tunnelRoute: "/monitoring",
});
