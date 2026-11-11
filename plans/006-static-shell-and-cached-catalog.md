# Plan 006: Pages ship a prerendered shell and the catalog is read once, not on every request

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- next.config.ts src/components/layout src/components/cart/cart-drawer.tsx src/server/queries/products.ts src/app/sign-in src/app/sign-up tests/server/queries README.md`
> This plan is written against the tree **after plans 001, 003 and 004 have landed** (see "Depends on"). Changes from those three plans are expected in that diff; anything else in those paths is drift — compare the "Current state" excerpts against the live code and treat a mismatch as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-ci-verify-workflow.md, plans/003-store-error-boundary.md, plans/004-security-headers.md (they edit the same files: the two catalog test files, `site-header.tsx`, `next.config.ts`)
- **Category**: perf
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

Every route in the app is rendered from scratch on every request. The last production build marked all 22 routes `ƒ (Dynamic)`; only the web manifest was static. Two causes:

- The header reads the cart cookie and Clerk's sign-in state, which makes every page dynamic under the classic rendering model. `generateStaticParams` on the product page therefore prerenders nothing.
- The 50-product catalog is stable data, but it is queried from Neon on every request — and on every page, because the header's cart drawer needs it for suggestions. The code says so itself: `// ponytail: no cross-request cache—every render reads Neon; add unstable_cache with a catalog tag if traffic matters.`

Next.js 16's Cache Components model fixes both: static parts of each page are prerendered at build time and served immediately, request-specific parts (cart, sign-in state, orders) stream in behind `<Suspense>`, and data marked `"use cache"` is shared across requests.

The advisor applied exactly the changes below to a scratch clone and built it: every page route becomes `◐ (Partial Prerender)`, including all 50 product pages; lint, typecheck and all tests pass. Against that production build, add-to-cart, the cart count, the cart drawer (opening from `/about`, not opening on `/cart`), search and the unknown-product "Not found" content were checked in a browser, and `/cart` with a cart cookie and `/sign-in` over HTTP. **Not checked by the advisor:** the scroll-to-top on navigation after Step 4, and `next dev` — Step 8 covers both.

**Trade-off the owner accepts with this plan:** catalog reads (names, images, **prices**) come from a cache with a one-hour lifetime. A new deployment always starts a fresh cache (the build id is part of every cache key). Re-seeding the database *without* deploying shows up within the hour. The cart, the drawer and Stripe Checkout all read the same cached catalog, so what the customer sees is what they are charged.

## Current state

(After plans 001, 003, 004. Line numbers are approximate; match on the code.)

- `next.config.ts` — `const nextConfig: NextConfig = { poweredByHeader: false, turbopack: { root: import.meta.dirname }, async headers() {…}, async rewrites() {…} };` wrapped in `withSentryConfig(...)`.
- `src/server/queries/products.ts` — `getProducts(query?)` and `getProduct(id)`, each wrapped in React `cache()` (per-render dedupe only) and each querying Neon.
- `src/components/layout/site-footer.tsx:34,75` — a synchronous Server Component that renders `© {new Date().getFullYear()} nstore. All rights reserved.` Reading the clock during prerender is a build error under Cache Components.
- `src/components/layout/site-header.tsx` — Server Component. Two pairs of Clerk `<Show when="signed-out">` / `<Show when="signed-in">` blocks (desktop icons, mobile menu) sit outside any `<Suspense>`; they read the session, which is request data.
- `src/components/layout/sticky-header.tsx:9-19` — Client Component wrapping the header; calls `usePathname()` only to scroll to the top when the path changes.
- `src/components/cart/cart-drawer.tsx:25-40` — `CartLink` calls `usePathname()` only to compare with `"/cart"` inside its click handler.
- `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx` — render Clerk's `<SignIn />` / `<SignUp />`, which read the URL internally.
- `tests/server/queries/products.test.ts`, `product-details.test.ts` — call the real query functions against the seeded database (skipped without `DATABASE_URL`).

Facts about this Next.js version (16.4.4) the steps rely on — read these before starting:

- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` — enable with `cacheComponents: true` **and** `partialPrefetching: true`.
- `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` — what breaks and why. Key rules: uncached data and request APIs (`cookies()`, `headers()`, session) must be inside `<Suspense>` or cached with `"use cache"`; clock reads (`new Date()`) during prerender are build errors; `usePathname()` in a Client Component outside `<Suspense>` blocks prerendering on routes with dynamic segments; `export const instant = false` marks a segment as allowed to block.
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` — cache keys include the build id; cached functions cannot call `cookies()`/`headers()`; set an explicit `cacheLife(...)` in every cached scope.
- `cacheLife()` throws outside a Next.js build/server (`` `cacheLife()` is only available with the `cacheComponents` config ``). Tests that call a cached function directly must mock `next/cache` — the repo already does this for `refresh` in `tests/server/actions/*.test.ts`.

The four build errors the advisor hit, in order, each fixed by one step below:

1. `Route "/products/[slug]": Next.js encountered the unstable value new Date() while prerendering` at `site-footer.tsx:75` → Step 2.
2. `Route "/_not-found": Next.js encountered uncached or runtime data during prerendering` through `sticky-header.tsx` → `header` (the `<Show>` blocks) → Step 3.
3. `Route "/account/profile/[[...rest]]": Next.js encountered URL data usePathname() in a Client Component outside of <Suspense>` at `sticky-header.tsx`, then at `cart-drawer.tsx:26` → Steps 4 and 5.
4. The same `usePathname()` error for `Route "/sign-in/[[...sign-in]]"` from inside Clerk's component → Step 6.

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
- `next.config.ts` — two added lines
- `src/server/queries/products.ts`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/site-header.tsx` — the two `<Suspense>` wrappers in Step 3 only
- `src/components/layout/sticky-header.tsx`
- `src/components/cart/cart-drawer.tsx` — `CartLink` only
- `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx` — one export each
- `tests/server/queries/products.test.ts`, `tests/server/queries/product-details.test.ts` — the `next/cache` mock only
- `README.md` — the edits in Step 9 only

**Out of scope** (do NOT touch, even though they look related):
- `export const instant = false` on any other page or layout, and the `cache-components-instant-false` codemod. A blanket opt-out makes the build pass while giving up the point of this plan. If a route other than sign-in/sign-up needs it, that is a STOP condition.
- `src/server/queries/product-details.ts`, `orders.ts`, `cart.ts` — per-request or per-user data; not cached here.
- `"use cache"` on anything that reads cookies, the Clerk session, orders, addresses or Stripe. Caching user-specific data across requests would leak it between customers.
- `cacheTag` / `revalidateTag` — nothing in the app can call an invalidation (the catalog is changed by a seed script outside Next.js), so a tag would be dead code.
- `src/proxy.ts`, the Sentry options, the security headers from plan 004.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested message: `perf: prerender page shells and cache the catalog with Cache Components`

## Steps

The build is broken between Step 1 and Step 6; that is expected. Run the per-step checks given, and the build only where a step says so.

### Step 1: Enable Cache Components

In `next.config.ts`, add two lines at the top of the `nextConfig` object:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // …rest unchanged
```

**Verify**: `bunx tsc --noEmit` → exit 0.

### Step 2: Cache the catalog and the footer

Replace `src/server/queries/products.ts` with:

```ts
import { asc, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { cache } from "react";
import { getDb } from "@/server/db";
import { products } from "@/server/db/schema";
import type { Product } from "@/types/product";

const columns = {
  id: products.id,
  name: products.name,
  description: products.description,
  category: products.category,
  image: products.image,
  color: products.color,
  price: products.price,
};

/**
 * The whole catalog in grid order, read once and shared by every request. A new
 * deployment starts a fresh cache; without one, a reseed shows up within the hour.
 */
async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");

  return getDb().select(columns).from(products).orderBy(asc(products.position));
}

// React cache dedupes header/page getProducts() calls within one server render.
export const getProducts = cache(
  async (query?: string): Promise<Product[]> => {
    const q = query?.trim().toLowerCase();
    if (!q) return getCatalog();

    // Searches are per-visitor input, so they read Neon directly instead of filling the cache.
    // strpos keeps substring search over name, description, and category; unlike LIKE, bound %/_ stay literal.
    return getDb()
      .select(columns)
      .from(products)
      .where(sql`strpos(lower(concat_ws(' ', ${products.name}, ${products.description}, ${products.category})), ${q}) > 0`)
      .orderBy(asc(products.position));
  },
);

/** One product, from the cached catalog: an unknown id costs no query and no cache entry. */
export const getProduct = cache(
  async (id: string): Promise<Product | undefined> =>
    (await getCatalog()).find((product) => product.id === id),
);
```

What changed: a private cached `getCatalog()` holds the one unfiltered read; `getProducts()` without a query returns it; a search still queries Neon directly (search strings are visitor input and would fill the cache with one entry each); `getProduct(id)` looks the product up in the cached catalog instead of running its own query, so an unknown id costs nothing. The old `// ponytail: no cross-request cache…` comment is removed because it is no longer true. `eq` is no longer imported.

In `src/components/layout/site-footer.tsx`:

```diff
--- a/src/components/layout/site-footer.tsx
+++ b/src/components/layout/site-footer.tsx
@@ -1,2 +1,3 @@
+import { cacheLife } from "next/cache";
 import Link from "next/link";
 import { ThemePicker } from "@/components/layout/theme-picker";
@@ -32,5 +33,9 @@ const linkClass =
 
 /** Column nav, wordmark, and copyright shown below every store route. */
-export function SiteFooter() {
+export async function SiteFooter() {
+  // Cached so the copyright year is a stored value, not a clock read on every prerender.
+  "use cache";
+  cacheLife("days");
+
   return (
     <footer className="rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
```

**Verify**: `bunx tsc --noEmit` → exit 0; `bun run lint` → exit 0.

### Step 3: Let the sign-in state stream

In `src/components/layout/site-header.tsx`, wrap each pair of `<Show>` blocks in its own `<Suspense>`. `Suspense` is already imported. Do not change the `<Show>` blocks themselves, and leave their indentation as it is.

Desktop icons (right after the first `</HeaderBoundary>`):

```tsx
        </HeaderBoundary>
        {/* Who is signed in is request data: it streams in after the static header. The fallback holds the icon's 40px. */}
        <Suspense fallback={<span aria-hidden="true" className="size-10" />}>
        <Show when="signed-out">
          {/* …unchanged… */}
        </Show>
        <Show when="signed-in">
          {/* …unchanged… */}
        </Show>
        </Suspense>
      </div>
```

Mobile menu (inside `<div className="ml-auto flex items-center gap-1">`):

```tsx
            <div className="ml-auto flex items-center gap-1">
              {/* Same as the desktop slot; the drawer is closed while this streams, so nothing needs holding. */}
              <Suspense fallback={null}>
              <Show when="signed-out">
                {/* …unchanged… */}
              </Show>
              <Show when="signed-in">
                {/* …unchanged… */}
              </Show>
              </Suspense>
            </div>
```

**Verify**: `grep -c "<Suspense" src/components/layout/site-header.tsx` → `5` (three from before, two new). `bunx tsc --noEmit` → exit 0.

### Step 4: Take `usePathname()` out of the header's render path

In `src/components/layout/sticky-header.tsx`, move the scroll-reset effect into a small child component rendered inside `<Suspense>`:

```diff
--- a/src/components/layout/sticky-header.tsx
+++ b/src/components/layout/sticky-header.tsx
@@ -3,20 +3,25 @@
 import { usePathname } from "next/navigation";
 import type { ReactNode } from "react";
-import { useEffect, useRef, useState } from "react";
+import { Suspense, useEffect, useRef, useState } from "react";
 
-/** Pinned header panel; flags `data-stuck` once the page scrolls past the top. */
-export function StickyHeader({ children }: { children: ReactNode }) {
+/** Page changes start above the shared header; hash links keep their target. */
+function ScrollReset() {
   const pathname = usePathname();
   const previousPathname = useRef(pathname);
-  const sentinel = useRef<HTMLDivElement>(null);
-  const [stuck, setStuck] = useState(false);
 
   useEffect(() => {
     if (previousPathname.current === pathname) return;
     previousPathname.current = pathname;
-    // Page changes start above the shared header; hash links keep their target.
     if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
   }, [pathname]);
 
+  return null;
+}
+
+/** Pinned header panel; flags `data-stuck` once the page scrolls past the top. */
+export function StickyHeader({ children }: { children: ReactNode }) {
+  const sentinel = useRef<HTMLDivElement>(null);
+  const [stuck, setStuck] = useState(false);
+
   useEffect(() => {
     const target = sentinel.current;
@@ -37,4 +42,8 @@ export function StickyHeader({ children }: { children: ReactNode }) {
   return (
     <>
+      {/* The pathname is request data on routes with dynamic segments; it streams in without holding the header. */}
+      <Suspense fallback={null}>
+        <ScrollReset />
+      </Suspense>
       {/* Out of flow on purpose: a flex child would eat a gap of its own and
           push the header down the page. */}
```

**Verify**: `bunx tsc --noEmit` → exit 0; `bun run lint` → exit 0.

### Step 5: Read the path at click time in `CartLink`

In `src/components/cart/cart-drawer.tsx`:

```diff
--- a/src/components/cart/cart-drawer.tsx
+++ b/src/components/cart/cart-drawer.tsx
@@ -3,5 +3,4 @@
 import { XIcon } from "lucide-react";
 import Link from "next/link";
-import { usePathname } from "next/navigation";
 import type { ComponentProps, ReactNode } from "react";
 import { PillButton } from "@/components/ui/pill-button";
@@ -24,6 +23,4 @@ export function openCart() {
  */
 export function CartLink(props: Omit<ComponentProps<typeof Link>, "href">) {
-  const pathname = usePathname();
-
   return (
     <Link
@@ -32,5 +29,6 @@ export function CartLink(props: Omit<ComponentProps<typeof Link>, "href">) {
       aria-haspopup="dialog"
       onClick={(event) => {
-        if (pathname === "/cart" || event.button !== 0) return;
+        // Read at click time: a hook would make the pathname render data and hold up the static header.
+        if (window.location.pathname === "/cart" || event.button !== 0) return;
         if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
         if (openCart()) event.preventDefault();
```

**Verify**: `grep -c "usePathname" src/components/cart/cart-drawer.tsx` → `0`. `bun run lint` → exit 0.

### Step 6: Let Clerk's own pages block

`src/app/sign-in/[[...sign-in]]/page.tsx` becomes:

```tsx
import { SignIn } from "@clerk/nextjs";

// Clerk reads the URL while rendering its form; this page is allowed to wait for it.
export const instant = false;

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
```

Make the same two-line addition (comment + `export const instant = false;`) after the import in `src/app/sign-up/[[...sign-up]]/page.tsx`.

**Verify**: `bun run build` → exit 0. Then inspect the route table it printed (or rerun as `bun run build 2>&1 | grep -E "^[├┌└│ ]+[○◐ƒ] "`):
- every page route is marked `◐` (22 `◐` rows in total: 18 routes including `/_not-found`, the `/products/[slug]` row, two sample product paths and a `[+48 more paths]` row);
- exactly two rows are marked `ƒ`: `/api/checkout/return` and `/api/webhooks/stripe`;
- `/manifest.webmanifest` is `○`.

### Step 7: Keep the catalog tests runnable

`cacheLife()` throws outside Next.js. In **both** `tests/server/queries/products.test.ts` and `tests/server/queries/product-details.test.ts`, import `mock` and stub `next/cache` right after the `const test = …skipIf(…)` line:

```ts
import { mock, test as bunTest } from "bun:test";
// …existing imports unchanged…

const test = bunTest.skipIf(!process.env.DATABASE_URL);

// `use cache` is a build-time directive; outside Next.js its lifetime call has nothing to configure.
mock.module("next/cache", () => ({ cacheLife: () => {} }));
```

**Verify**: `bun run test` → `0 fail` (with `.env.local`: the 4 catalog tests pass; without it they skip).

### Step 8: Check behaviour in a browser

Needs `.env.local` and a browser you can drive; if you have neither, say so in your report.

1. `bun run build`, then `bun run start --hostname localhost --port 3194`.
2. `/products/cream-electric-kettle` → dismiss the cookie banner, click "Add to cart" → the header cart link's `aria-label` becomes `Cart, 1 item` and the cart drawer opens.
3. `/cart` → the kettle line and its price are shown; clicking the header cart icon here does **not** open the drawer.
4. `/about` → clicking the header cart icon opens the drawer and the URL stays `/about`.
5. `/products?q=kettle` → "1 product matching “kettle”". `/products/nope` → "Not found".
6. `/sign-in` → Clerk's form renders.
7. Navigate between two pages and confirm the new page starts at the top.
8. Remove the kettle from the cart, stop the server.

Also run `bun run dev` once, open `/`, `/products`, a product page and `/cart`, and confirm the Next.js dev overlay reports no Cache Components errors.

### Step 9: Update `README.md`

1. In the "Architecture" list, add after the Server Components bullet:

   ```markdown
   - Cache Components: each page's static shell is prerendered; cart, sign-in state, and orders stream in behind Suspense; the catalog is cached across requests for up to an hour
   ```

2. In the "Database" list, replace the bullet that starts ``- Catalog changes: edit `src/server/db/seed/*` `` with:

   ```markdown
   - Catalog changes: edit `src/server/db/seed/*` → `bun run db:seed`; it replaces `products` and `product_details` in one transaction, leaving payments untouched. The running site caches the catalog (prices included) for up to an hour; a deployment starts a fresh cache
   ```

**Verify**: `grep -c "Cache Components" README.md` → `1`; `grep -c "starts a fresh cache" README.md` → `1`

## Test plan

- No new test files. The catalog tests keep asserting the same behaviour through the new code path (`getProduct` now reads from the cached catalog; the existing assertions `getProduct("canvas-tote") === undefined`, `deepEqual(getProduct(kettle.id), kettle)` and the search cases cover it).
- Rendering behaviour is verified by the build's route table (Step 6) and the browser checklist (Step 8). The repo has no browser test harness; adding one is out of scope.

## Done criteria

- [ ] `bun run build` exits 0; its route table has 22 `◐` rows and exactly two `ƒ` rows (the two API routes), as described in Step 6
- [ ] `grep -rn "export const instant" src/app | wc -l` → `2` (sign-in and sign-up only)
- [ ] `grep -rn "use cache" src | wc -l` → `2` (`products.ts` and `site-footer.tsx`)
- [ ] `bun run lint`, `bunx tsc --noEmit` exit 0; `bun run test` → `0 fail`
- [ ] Step 8 checklist passed, or reported as not run with the reason
- [ ] `git status --short` lists only the in-scope files (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plans 001, 003 or 004 have not landed (`grep -c HeaderBoundary src/components/layout/site-header.tsx` is 0, or `next.config.ts` has no `headers()`, or the catalog tests have no `skipIf`). The snippets here assume them.
- After Step 6 the build still fails with a prerender error on any route. Report the full error block (route, message, stack). Do **not** add `instant = false`, `"use cache"`, or `connection()` anywhere this plan does not name.
- The build hangs for more than a minute at "Generating static pages" — the docs call this a cache timeout (a cached function waiting on request data).
- Any step would require `"use cache"` on code that reads cookies, the session, or per-user data.
- In Step 8 the cart count, the cart page, or sign-in state shows another visitor's or a stale value after a reload.

## Maintenance notes

- **New code in layouts and the header must follow the model**: request data (cookies, session, search params) inside `<Suspense>`; shared data behind `"use cache"` with an explicit `cacheLife`; no clock or random reads in prerendered components. The build fails loudly when this is violated — treat that error as the guide, not as something to opt out of.
- If an admin surface ever edits the catalog at runtime, add `cacheTag("catalog")` to `getCatalog()` and call `updateTag("catalog")` from the mutation; until then a tag has no caller.
- `getProductDetails` is still one uncached query per product-page view (the page shell is prerendered, the spec sheet streams). Caching it per id is a possible follow-up; guard against unknown ids first so 404 probes do not create cache entries.
- With Cache Components, Next.js keeps recently visited routes mounted but hidden (`<Activity>`), so component state survives back/forward navigation. The header's search and menu toggles are checkbox-driven and already reset on link clicks; re-check any new stateful UI against `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.
- A nonce-based Content-Security-Policy (deferred in plan 004) requires dynamic rendering and would undo the static shell; weigh that before adopting one.
- Reviewer: confirm exactly two `instant = false` exports and two `"use cache"` directives, and that nothing user-specific is inside a cached scope.
