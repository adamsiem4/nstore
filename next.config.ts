import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// ponytail: pin root so a stray package-lock.json above the repo can't hijack it
const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
};

export default withSentryConfig(nextConfig, {
  org: "adp-g6",
  project: "nstore",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
});
