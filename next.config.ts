import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Sent with every response. Deliberately no script-src/style-src: a real
// Content-Security-Policy needs per-request nonces for Clerk, Stripe, PostHog
// and Sentry, which is its own piece of work. These directives restrict
// nothing the store loads.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  // For browsers that predate frame-ancestors.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// ponytail: pin root so a stray package-lock.json above the repo can't hijack it
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: { root: import.meta.dirname },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
  // Strips the SDK's internal logger; the `debug` init option is never used.
  bundleSizeOptimizations: { excludeDebugStatements: true },
  // Same-origin route so ad blockers don't drop client errors.
  tunnelRoute: "/monitoring",
});
