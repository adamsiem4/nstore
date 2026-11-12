# Plan 003: A failed page or a failed cart read no longer replaces the whole store with a blank error screen

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- "src/app/(store)" src/app/global-error.tsx src/components/layout/site-header.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

The app has exactly one error boundary, `src/app/global-error.tsx`, which replaces the entire document. Any render error therefore shows a black page reading "Application error: a client-side exception has occurred" with no header, no footer and no way to retry.

It is worse than "pages that query the database fail": the header in the store layout renders the cart drawer, which reads the catalog from Postgres on **every** page. The advisor ran a production build against an unreachable database and loaded `/about`, a page with no data of its own — it rendered the blank global error, because the header's failure escapes the layout.

After this plan a store-level `error.tsx` shows a retry screen inside the normal layout, and the header's cart pieces fall back quietly instead of taking the layout down. Verified by the advisor with this exact code and a dead database: `/about` renders normally, `/products` shows "Something went wrong" with header and footer intact.

## Current state

- `src/app/global-error.tsx` — the only boundary. Keep it as is; it still handles root-layout failures. It shows the repo's Sentry convention for boundaries:

  ```tsx
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  ```

- `src/app/(store)/layout.tsx` — renders `<StickyHeader><SiteHeader /></StickyHeader>`, then `<main id="content">{children}</main>`, then `<SiteFooter />`. An `error.tsx` next to it wraps `{children}` (the pages) but **not** the layout itself, so it cannot catch header errors.
- `src/app/(store)/not-found.tsx` — the visual pattern to copy for a full-page message:

  ```tsx
  <div className="py-24 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
    <p className="mt-3 text-muted-foreground">
      That page or product doesn&apos;t exist.
    </p>
    <Link
      href="/products"
      className={pillButtonVariants({ className: "mt-8 h-12 px-8 text-base" })}
    >
      Back to shop
    </Link>
  </div>
  ```

- `src/components/layout/site-header.tsx` — a Server Component. Three places read cart/catalog data, each already inside `<Suspense>`:

  ```tsx
  // lines 208-210 (desktop)
          <Suspense fallback={<CartControl />}>
            <HeaderCartControl />
          </Suspense>
  // lines 297-299 (mobile menu)
              <Suspense fallback={<CartControl mobile />}>
                <HeaderCartControl mobile />
              </Suspense>
  // lines 318-320 (end of the header)
        <Suspense fallback={null}>
          <HeaderCartDrawer />
        </Suspense>
  ```

  `CartControl` (line 53) is the cart icon link; `count={undefined}` draws a loading dot, `count={0}` draws no badge. `HeaderCartControl`/`HeaderCartDrawer` await `getCartLines()` / `getProducts()`, which query Postgres.
- `src/components/cart/cart-drawer.tsx:13-18,25-40` — `CartLink` opens the drawer on click and, when no drawer is in the DOM, navigates to `/cart` instead. So a missing drawer degrades to a normal link by design.
- `src/components/ui/pill-button.tsx` — exports `PillButton` (a `<button>`) and `pillButtonVariants(...)` (classes for links).

Next.js 16.4.4 APIs used (from `node_modules/next/dist/docs/01-app/03-api-reference/`):
- `03-file-conventions/error.md` — `error.tsx` must be a Client Component; props are `{ error: unknown; retry: () => void }`. `retry()` re-fetches and re-renders the boundary's children. (This version documents `retry`, with `reset` as the rarely-needed alternative.)
- `04-functions/catchError.md` — `catchError(fallback)` from `next/error` returns a boundary component usable anywhere in the tree; `fallback(props, { error, retry })` must live in a `'use client'` module. It lets `redirect()`/`notFound()` pass through.

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
- `src/app/(store)/error.tsx` (create)
- `src/components/layout/header-boundary.tsx` (create)
- `src/components/layout/site-header.tsx` — the import and the three wrappers in Step 3 only

**Out of scope** (do NOT touch, even though they look related):
- `src/app/global-error.tsx` — still needed for root-layout errors.
- `src/server/queries/*` — do not add `try/catch` or `.catch(() => [])` to queries; pages must still fail visibly when their data is missing.
- `src/app/sign-in`, `src/app/sign-up` — outside the `(store)` group, rendered by Clerk.
- Per-route `error.tsx` files under `orders/`, `account/` etc. — one store-level boundary is enough for now.
- The `<Show>` blocks and everything else in `site-header.tsx`.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested message: `fix(store): keep the layout on screen when a page or the header cart fails`

## Steps

### Step 1: Add the store error boundary

Create `src/app/(store)/error.tsx`:

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { PillButton, pillButtonVariants } from "@/components/ui/pill-button";

/** A page that failed to render, shown inside the store layout so the header and footer stay usable. */
export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        This page didn&apos;t load. Try again, or head back to the shop.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <PillButton className="h-12 px-8 text-base" onClick={() => retry()}>
          Try again
        </PillButton>
        <Link href="/products" className={pillButtonVariants({ variant: "ghost", className: "h-12 px-6 text-base" })}>
          Back to shop
        </Link>
      </div>
    </div>
  );
}
```

**Verify**: `bunx tsc --noEmit` → exit 0.

### Step 2: Add the header boundary

Create `src/components/layout/header-boundary.tsx`:

```tsx
"use client";

import { catchError } from "next/error";
import type { ReactNode } from "react";

/**
 * Shows `fallback` in place of header content that failed to render. The header
 * sits in the store layout, above every page's error boundary, so without this
 * one failed catalog read replaces the whole site with the global error page.
 */
export const HeaderBoundary = catchError((props: { fallback: ReactNode }) => props.fallback);
```

**Verify**: `bunx tsc --noEmit` → exit 0.

### Step 3: Wrap the header's three data readers

In `src/components/layout/site-header.tsx`, add the import and wrap each of the three `<Suspense>` blocks shown in "Current state". The `<Suspense>` blocks themselves stay unchanged inside the wrappers.

```diff
--- a/src/components/layout/site-header.tsx
+++ b/src/components/layout/site-header.tsx
@@ -5,4 +5,5 @@ import Link from "next/link";
 import { CartSheet } from "@/components/cart/cart";
 import { CartDrawer, CartLink } from "@/components/cart/cart-drawer";
+import { HeaderBoundary } from "@/components/layout/header-boundary";
 import { Input } from "@/components/ui/input";
 import { PillButton, pillButtonVariants } from "@/components/ui/pill-button";
@@ -206,7 +207,9 @@ export function SiteHeader() {
         </div>
 
-        <Suspense fallback={<CartControl />}>
-          <HeaderCartControl />
-        </Suspense>
+        <HeaderBoundary fallback={<CartControl count={0} />}>
+          <Suspense fallback={<CartControl />}>
+            <HeaderCartControl />
+          </Suspense>
+        </HeaderBoundary>
         <Show when="signed-out">
           <Link
@@ -295,7 +298,9 @@ export function SiteHeader() {
 
           <div className="flex items-center gap-1 border-t pt-2">
-            <Suspense fallback={<CartControl mobile />}>
-              <HeaderCartControl mobile />
-            </Suspense>
+            <HeaderBoundary fallback={<CartControl count={0} mobile />}>
+              <Suspense fallback={<CartControl mobile />}>
+                <HeaderCartControl mobile />
+              </Suspense>
+            </HeaderBoundary>
             <div className="ml-auto flex items-center gap-1">
               <Show when="signed-out">
@@ -316,7 +321,10 @@ export function SiteHeader() {
       </div>
 
-      <Suspense fallback={null}>
-        <HeaderCartDrawer />
-      </Suspense>
+      {/* No drawer when the cart can't load: CartLink then navigates to /cart, whose own boundary explains. */}
+      <HeaderBoundary fallback={null}>
+        <Suspense fallback={null}>
+          <HeaderCartDrawer />
+        </Suspense>
+      </HeaderBoundary>
     </div>
   );
```

Why these fallbacks: `count={0}` renders the plain cart icon (no badge, not the loading dot), and it is still a link to `/cart`; `null` for the drawer makes `CartLink` navigate to `/cart`, where the page's own boundary from Step 1 explains the failure.

**Verify**: `grep -c "<HeaderBoundary" src/components/layout/site-header.tsx` → `3`
**Verify**: `bun run lint` → exit 0; `bunx tsc --noEmit` → exit 0.

### Step 4: Build

**Verify**: `bun run build` → exit 0 (needs `.env.local`).

### Step 5: See it work (only if you can drive a browser; otherwise say so in your report)

1. `bun run build`
2. Start the production server with an unreachable database (the explicit variable overrides `.env.local`): `DATABASE_URL="postgresql://u:p@db.invalid/none" bun run start --hostname localhost --port 3192`
3. Open `http://localhost:3192/about` → the normal page with header and footer; no "Application error".
4. Open `http://localhost:3192/products` → header and footer present, main panel shows "Something went wrong" with "Try again" and "Back to shop".
5. Stop the server.

A plain `curl` cannot prove this: the failure surfaces during client hydration, not in the first HTML.

## Test plan

No automated test: the repo has no component or browser test setup (all tests are `bun test` suites for server modules and pure functions), and adding one is out of scope. Verification is the type/lint/build gate plus the manual check in Step 5, which the advisor already ran once against this exact code.

## Done criteria

- [ ] `src/app/(store)/error.tsx` and `src/components/layout/header-boundary.tsx` exist; each starts with `"use client";`
- [ ] `grep -c "<HeaderBoundary" src/components/layout/site-header.tsx` → `3`
- [ ] `bun run lint`, `bunx tsc --noEmit` exit 0; `bun run test` → `0 fail`; `bun run build` exits 0
- [ ] `git status --short` lists only the three in-scope files (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `site-header.tsx` no longer contains the three `<Suspense>` blocks exactly as excerpted.
- TypeScript rejects `import { catchError } from "next/error"` or the `retry` prop — the installed Next.js is not 16.4.x; re-read the two doc files named above before changing anything.
- The build reports a server/client boundary error for `header-boundary.tsx` (for example about passing functions to Client Components). Do not work around it by converting `site-header.tsx` to a Client Component.
- In Step 5, `/about` still shows "Application error" — report what the browser console says.

## Maintenance notes

- New data-reading components added to the header or the store layout must sit inside a `HeaderBoundary` (or their own boundary); anything in the layout that throws still reaches `global-error.tsx`.
- Header fallbacks are silent to the user by design. Server-side errors are still reported by Sentry's server instrumentation (`src/instrumentation.ts`); the boundary only changes what is drawn.
- If Cache Components is adopted later (plan 006), `site-header.tsx` is edited again in the same region — land this plan first.
- Reviewer: confirm no query gained a swallow-all `catch`, and that `global-error.tsx` is untouched.
