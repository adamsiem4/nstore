# Plan 004: Every response carries baseline security headers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- next.config.ts src/proxy.ts README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

The store has sign-in, account, address and checkout-entry pages, and sends no response-hardening headers at all. A production response today carries `x-powered-by: Next.js` and nothing else of note (checked by the advisor against a production build). Any site can frame the account pages (clickjacking), browsers may MIME-sniff responses, and the framework is advertised.

This plan adds the headers that are safe to add without touching how scripts load: no framing by other origins, no MIME sniffing, an explicit referrer policy, a locked-down permissions policy, and no `X-Powered-By`. A full script Content-Security-Policy is deliberately **not** part of it (see Scope).

## Current state

`next.config.ts` — the whole file:

```ts
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
  // Strips the SDK's internal logger; the `debug` init option is never used.
  bundleSizeOptimizations: { excludeDebugStatements: true },
  // Same-origin route so ad blockers don't drop client errors.
  tunnelRoute: "/monitoring",
});
```

- `src/proxy.ts` is `export default clerkMiddleware();` plus a matcher. It sets no headers. (In this Next.js version `proxy.ts` is the file that used to be `middleware.ts`; that is correct, leave it.)
- Third parties the browser talks to: Clerk (auth UI, bot-check widget in an iframe **inside** our pages), Stripe (hosted Checkout — a full-page redirect away from the site, never an iframe on it), PostHog (script loaded after consent), Sentry (through the same-origin `/monitoring` tunnel). None of them needs to frame nstore, and none uses camera, microphone or geolocation.
- Next.js docs for the API used: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md` and `poweredByHeader.md`.

Repo conventions that apply (from `AGENTS.md` and the existing code):

- Bun only: `bun install`, `bun run <script>`, `bunx`. Never npm, pnpm or yarn. No new dependencies.
- This is Next.js 16.4.4, which differs from older versions (for example `src/proxy.ts` replaced `middleware.ts`). Before using a Next.js API that this plan does not spell out, read its page under `node_modules/next/dist/docs/`.
- Make the smallest coherent change; do not reformat or "tidy" neighbouring code.
- Style: 2-space indent, double quotes, semicolons, trailing commas; the `@/` import alias maps to `src/`. Comments say *why* in a line or two. Some existing comments start with `ponytail:` (a deliberate simplification) — keep them verbatim.
- Tests are `bun:test` files using `node:assert/strict`, under `tests/`, mirroring the `src/` path of the module they cover.
- `.env.local` holds real credentials. Never print it, copy it, or paste any value from it into code, logs or your report.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install (only if `node_modules` is missing) | `bun install --frozen-lockfile` | exit 0, `bun.lock` unchanged |
| Lint | `bun run lint` | exit 0, prints only `$ eslint` |
| Typecheck | `bunx tsc --noEmit` | exit 0, no output |
| All tests | `bun run test` | last lines show `0 fail` |
| One test path | `bun test --isolate --conditions=react-server <path>` | `0 fail` |
| Production build | `bun run build` | exit 0, ends with the route table |

Notes: `bun run test` and `bun run build` read `.env.local`. With it present, 4 catalog tests read the live seeded Neon database (read-only). Without it those 4 tests fail with `DATABASE_URL is not configured` (or skip, once plan 001 has landed) and `bun run build` cannot succeed — in that case run every other check and state in your report that the build was not run and why. Sentry "No auth token provided" warnings during the build are expected.

## Scope

**In scope** (the only files you should modify):
- `next.config.ts`
- `README.md` — the one-line edit in Step 2

**Out of scope** (do NOT touch, even though they look related):
- A script/style Content-Security-Policy (`script-src`, `style-src`, `connect-src`, `frame-src`, `form-action`, nonces). It needs a per-request nonce set in `src/proxy.ts`, an allow-list for Clerk, Stripe, PostHog and Sentry, and forces dynamic rendering — a separate, riskier piece of work. In particular do **not** add `form-action`: the no-JavaScript checkout is a form post that redirects to `checkout.stripe.com`, which `form-action 'self'` would block.
- `Strict-Transport-Security` — the deployment target (Vercel) sends it itself.
- `src/proxy.ts` — headers set in `next.config.ts` also cover static files; the proxy's matcher skips those.
- The `withSentryConfig(...)` options.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested message: `feat(security): send baseline response-hardening headers`

## Steps

### Step 1: Add the headers

Replace `next.config.ts` with:

```ts
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
```

Changes versus today: the `securityHeaders` constant and its comment, `poweredByHeader: false`, and the `headers()` function. Everything else is byte-for-byte the same.

**Verify**: `bunx tsc --noEmit` → exit 0; `bun run lint` → exit 0.

### Step 2: Note it in `README.md`

In the "Architecture" list, add this bullet after the bullet `- Signed Stripe webhooks as the source of truth for payment state`:

```markdown
- Baseline security headers on every response (`next.config.ts`): same-origin framing only, no MIME sniffing, explicit referrer and permissions policies; no script Content-Security-Policy yet
```

**Verify**: `grep -c "Baseline security headers" README.md` → `1`

### Step 3: Check the headers on a production build

Needs `.env.local`. If it is missing, skip this step and say so in your report.

1. `bun run build` → exit 0.
2. Start the server in the background or a second terminal: `bun run start --hostname localhost --port 3193`
3. Run:

   ```bash
   bun -e 'for (const p of ["/", "/icons/favicon.ico"]) { const r = await fetch("http://localhost:3193" + p); console.log(p, r.status); for (const k of ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "x-powered-by"]) console.log("  " + k + ": " + r.headers.get(k)); }'
   ```

   Expected, for **both** paths (status 200):

   ```text
     content-security-policy: frame-ancestors 'self'; base-uri 'self'; object-src 'none'
     x-frame-options: SAMEORIGIN
     x-content-type-options: nosniff
     referrer-policy: strict-origin-when-cross-origin
     permissions-policy: camera=(), microphone=(), geolocation=()
     x-powered-by: null
   ```

4. Stop the server.

The advisor ran this exact configuration against `a89aea0`: the output matched, and the storefront, `/sign-in` and the cookie banner rendered normally.

## Test plan

No unit test: the behaviour is configuration, and the meaningful check is the real response in Step 3. Importing `next.config.ts` into a `bun test` would only assert the array against itself.

## Done criteria

- [ ] `grep -c "poweredByHeader: false" next.config.ts` → `1`
- [ ] `grep -c "frame-ancestors 'self'" next.config.ts` → `1`
- [ ] `bun run lint`, `bunx tsc --noEmit` exit 0; `bun run test` → `0 fail`; `bun run build` exits 0
- [ ] Step 3 output matches (or is reported as not run, with the reason)
- [ ] `git status --short` lists only `next.config.ts` and `README.md` (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `next.config.ts` differs from the "Current state" listing (for example `cacheComponents` was added — merge by hand is fine only if the difference is additive and unrelated; otherwise stop).
- After the change, the sign-in page, the Clerk profile page, or the cookie banner fails to render, or the browser console shows a Content-Security-Policy violation. Report the violated directive; do not loosen or delete headers on your own.
- You feel the need to add `script-src`, `connect-src`, `frame-src` or `form-action`.

## Maintenance notes

- PostHog's toolbar/heatmap preview loads the site inside an iframe on PostHog's own origin; `frame-ancestors 'self'` blocks that. If the owner wants that feature, add PostHog's app origin to `frame-ancestors` and drop `X-Frame-Options` (it cannot express an allow-list).
- A future script CSP should extend the same `Content-Security-Policy` value rather than add a second header; with a nonce it has to move to `src/proxy.ts` (see `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`), and it interacts with static prerendering (plan 006).
- Reviewer: confirm the Sentry options block is unchanged and that no header value was "tightened" beyond what is listed.
