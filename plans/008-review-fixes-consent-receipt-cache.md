# Plan 008: Review fixes — opt-in only under consent, complete receipts, a real one-hour catalog limit

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7f05bf7..HEAD -- src/lib/posthog.ts src/app/api/webhooks/stripe/route.ts src/server/queries/products.ts tests/lib/posthog.test.ts tests/app/api/webhooks/stripe/route.test.ts tests/server/actions/checkout.test.ts tests/server/actions/addresses.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans 001–007 (all DONE; this plan is written against their result)
- **Category**: bug
- **Planned at**: commit `7f05bf7` (branch `audit/improve`, pull request #6), 2026-11-12

## Why this matters

The automated review of pull request #6 raised seven points. Each was checked against the code and the installed packages; six are fixed here and one (an atomic default-address swap) has its own plan, 009. The four that change behaviour:

1. **PostHog opts in before checking consent (privacy).** `load()` calls `posthog.opt_in_capturing()` as soon as the SDK arrives. In posthog-js 1.445.1 that call itself sends a `$opt_in` event. A visitor who accepts and then rejects while the SDK is still downloading therefore still has one event sent after rejecting — the exact case plan 007 set out to close.
2. **Accepting again after a reject does not resume analytics.** On "Reject" the SDK is opted out. A later "Accept" in the same page session calls `load()`, which returns the already-loaded SDK and never opts it back in, so nothing is captured until the next full page load.
3. **Receipts can miss items.** The webhook reads line items from an expanded Checkout Session, and Stripe expands only the first ten. An order with more than ten different products gets an email listing ten items next to the full total.
4. **"Up to an hour" is really up to a day.** The catalog uses `cacheLife("hours")`, whose profile is *revalidate after 1 hour, expire after 1 day*. Revalidation serves the old value while refreshing, so the first visitor after a quiet period can see prices up to a day old. The README and the code comment both promise an hour.

The other two points are tests whose fake database ignores the query's `WHERE` clause, so they would still pass if a user filter were dropped.

## Current state

- `src/lib/posthog.ts` (45 lines) — `load()` initialises the SDK and immediately opts in; `withPostHog()` re-checks consent only for the caller's work; the consent listener in `startPostHog()` calls bare `load()` on "granted":

  ```ts
  function load() {
    client ??= import("posthog-js").then(({ default: posthog }) => {
      posthog.init(token!, { /* …opt_out_capturing_by_default: true… */ });
      // Also clears an opt-out persisted by an earlier "Reject".
      posthog.opt_in_capturing();
      return posthog;
    });
    return client;
  }
  // …
    if (consent === "granted") void load();
    else void client?.then((posthog) => posthog.opt_out_capturing());
  ```

- `tests/lib/posthog.test.ts` — one test; its fake SDK's `opt_in_capturing` does nothing, so it cannot see points 1 and 2.
- `src/app/api/webhooks/stripe/route.ts:90-114` — lists the session with `expand: ["data.line_items"]` and maps `session?.line_items?.data`.
- `tests/app/api/webhooks/stripe/route.test.ts` — 8 tests; the Stripe stub replaces `paymentIntents.retrieve` and `checkout.sessions.list`.
- `src/server/queries/products.ts:22-27` — `getCatalog()` with `"use cache"` and `cacheLife("hours")`.
- `tests/server/actions/checkout.test.ts:47-49` — fake `getDb()` whose `where` ignores its argument.
- `tests/server/actions/addresses.test.ts:63` — fake `select()` whose `where` ignores its argument.

Facts verified in the installed packages (do not re-derive, but do not contradict):

- `node_modules/posthog-js/lib/src/posthog-core.js` — `opt_in_capturing()` captures `$opt_in` with `send_instantly` unless `captureEventName` is `false`. `has_opted_in_capturing()` returns `this.consent.isOptedIn()`, which is false after `init` with `opt_out_capturing_by_default: true` and after `opt_out_capturing()`, and true once opted in (the choice persists in `localStorage`).
- `node_modules/next/dist/server/config-shared.js` — profile `hours` = `{ stale: 300, revalidate: 3600, expire: 86400 }`. `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md:266` — an `expire` under 5 minutes would drop the entry from prerendering; 3600 does not.
- `node_modules/stripe/esm/resources/Checkout/Sessions.d.ts:46` — `listLineItems(id, params?)` returns an auto-paginating list (`.autoPagingToArray({ limit })`).

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
| Typecheck | `bun run typecheck` (or `bunx tsc --noEmit`) | exit 0, no TypeScript errors |
| All tests | `bun run test` | last lines show `0 fail` |
| One test path | `bun test --isolate --conditions=react-server <path>` | `0 fail` |
| Production build | `bun run build` | exit 0, ends with the route table |

Notes: `bun run test` and `bun run build` read `.env.local`. With it present, 4 catalog tests read the live seeded Neon database (read-only); without it they skip, and `bun run build` cannot succeed — in that case run every other check and state in your report that the build was not run and why. Sentry "No auth token provided" warnings during the build are expected.

## Scope

**In scope** (the only files you should modify):
- `src/lib/posthog.ts`
- `tests/lib/posthog.test.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `tests/app/api/webhooks/stripe/route.test.ts`
- `src/server/queries/products.ts`
- `tests/server/actions/checkout.test.ts`
- `tests/server/actions/addresses.test.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/server/actions/addresses.ts` — the atomic default swap is plan 009.
- `plans/007-consent-recheck-and-payments-index.md` — the review attached one comment to the code listing inside that plan. Plans are a record of what was executed; fix the source file, not the plan.
- `src/server/queries/orders.ts` and `src/app/(store)/checkout/success/page.tsx` — they read the same ten-item expansion for *display*. That is unchanged by pull request #6 and was not raised; see Maintenance notes.
- `src/lib/consent.ts`, the cookie banner and preferences components.
- `README.md` — it already says the catalog is cached "for up to an hour"; this plan makes that true.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there.
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(webhook): email guest orders and acknowledge payments when Resend is unset`.
- This work belongs to pull request #6: it goes on branch `audit/improve`. Pushing to that branch updates the pull request; no new pull request is needed.
Suggested message: `fix: address review — consent-gated opt-in, full receipt line items, one-hour catalog expiry`

## Steps

### Step 1: Replace the PostHog test and watch it fail

Replace `tests/lib/posthog.test.ts` with:

```ts
import assert from "node:assert/strict";
import { mock, test } from "bun:test";
import { setConsent } from "@/lib/consent";

// Read once when the module loads, so it has to be set before the import below.
process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test";

// The two browser globals consent lives on: one localStorage key and one window event.
const stored = new Map<string, string>();
Object.assign(globalThis, {
  window: new EventTarget(),
  localStorage: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  },
});

// The real SDK is a separate chunk that takes a moment to download; `sdk.resolve()` is its arrival.
// Like the real one it starts opted out, and opting in sends an event of its own.
const sdk = Promise.withResolvers<void>();
const optedOut = Promise.withResolvers<void>();
let capturing = false;
const sent: string[] = [];
mock.module("posthog-js", async () => {
  await sdk.promise;
  return {
    default: {
      init() {},
      has_opted_in_capturing: () => capturing,
      opt_in_capturing() {
        capturing = true;
        sent.push("$opt_in");
      },
      opt_out_capturing() {
        capturing = false;
        optedOut.resolve();
      },
    },
  };
});

// Load after the token, globals and mock are in place.
const { startPostHog, withPostHog } = await import("@/lib/posthog");

/** Resolves once everything queued on the SDK so far has run; consent must be granted. */
function settled() {
  const done = Promise.withResolvers<void>();
  withPostHog(() => done.resolve());
  return done.promise;
}

test("nothing runs or is sent for a visitor who declines while PostHog downloads; accepting later turns capture on", async () => {
  const ran: string[] = [];
  startPostHog();

  setConsent("granted");
  withPostHog(() => ran.push("queued, then declined"));
  setConsent("denied");
  sdk.resolve();
  // The opt-out was queued after the work above, so by now that work has had its turn.
  await optedOut.promise;
  assert.equal(ran.length, 0, "queued work is dropped");
  assert.equal(sent.length, 0, "the SDK never opted in, so not even its opt-in event went out");
  assert.equal(capturing, false);

  // The gate is consent, not a broken loader: accepting again lets work through.
  setConsent("granted");
  withPostHog(() => ran.push("accepted"));
  await settled();
  assert.deepEqual(ran, ["accepted"]);
  assert.equal(capturing, true);
  assert.deepEqual(sent, ["$opt_in"], "one opt-in, however many callers");

  // Reject and accept again without a reload: the SDK is already loaded and must be switched back on.
  setConsent("denied");
  setConsent("granted");
  await settled();
  assert.equal(capturing, true, "capture resumes in the same session");
  assert.deepEqual(sent, ["$opt_in", "$opt_in"]);
});
```

The fake SDK now behaves like the real one in the two ways that matter: it starts opted out, and opting in records a `$opt_in` event. `settled()` waits by queueing one more piece of work behind everything already queued — no timers.

**Verify**: `bun test --isolate --conditions=react-server tests/lib/posthog.test.ts` → `0 pass`, `1 fail`. The failing assertion is the one with the message `the SDK never opted in, so not even its opt-in event went out` (actual `1`, expected `0`).

### Step 2: Opt in only under the consent check

Replace `src/lib/posthog.ts` with:

```ts
import type { PostHog } from "posthog-js";
import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
let client: Promise<PostHog> | undefined;

// ponytail: posthog-js (~100 KB gzipped) is a separate chunk fetched only once
// the visitor accepts analytics, so a first visit downloads none of it and
// sends nothing to a PostHog host before consent.
function load() {
  client ??= import("posthog-js").then(({ default: posthog }) => {
    // Starts opted out: nothing is sent until withPostHog opts in below.
    posthog.init(token!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-05-30",
      opt_out_capturing_by_default: true,
      opt_out_capturing_persistence_type: "localStorage",
      opt_out_persistence_by_default: true,
    });
    return posthog;
  });
  return client;
}

/** Runs `use` with PostHog when analytics was accepted; does nothing otherwise. */
export function withPostHog(use: (posthog: PostHog) => unknown) {
  if (!token || getConsent() !== "granted") return;
  void load().then((posthog) => {
    // Asked again on arrival: the visitor may have declined while the chunk downloaded.
    if (getConsent() !== "granted") return;
    // Opting in sends an event of its own, so it happens here, under the same
    // check, and once: on first use and again after a "Reject" opted the SDK out.
    if (!posthog.has_opted_in_capturing()) posthog.opt_in_capturing();
    use(posthog);
  });
}

/** Starts PostHog for a visitor who already accepted, then follows the banner. */
export function startPostHog() {
  if (!token) return;
  withPostHog(() => {});

  window.addEventListener(CONSENT_EVENT, (event) => {
    const consent = (event as CustomEvent<Consent | null>).detail;
    if (consent === "granted") withPostHog(() => {});
    else void client?.then((posthog) => posthog.opt_out_capturing());
  });
}
```

What changed, and why each part matters:
- `load()` no longer opts in. It only downloads and initialises the SDK, which starts opted out.
- `withPostHog()` opts in right after its own consent re-check, guarded by `has_opted_in_capturing()` so the `$opt_in` event goes out once per grant rather than once per caller.
- The listener's "granted" branch calls `withPostHog(() => {})` instead of bare `load()`, so re-accepting in the same session opts the already-loaded SDK back in.

**Verify**: `bun test --isolate --conditions=react-server tests/lib/posthog.test.ts` → `1 pass`, `0 fail`.

### Step 3: Fetch every line item for the receipt

In `src/app/api/webhooks/stripe/route.ts`:

```diff
--- a/src/app/api/webhooks/stripe/route.ts
+++ b/src/app/api/webhooks/stripe/route.ts
@@ -93,4 +93,8 @@ export async function POST(request: Request) {
       expand: ["data.line_items"],
     });
+    // Stripe expands only the first ten line items; a bigger basket needs the rest fetched.
+    const items = session?.line_items?.has_more
+      ? await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }).autoPagingToArray({ limit: 1000 })
+      : (session?.line_items?.data ?? []);
     // Only signed-in checkouts set receipt_email; a guest typed theirs into Checkout.
     const to = intent.receipt_email ?? session?.customer_details?.email;
@@ -105,5 +109,5 @@ export async function POST(request: Request) {
           createdAt: new Date(intent.created * 1000),
           // Empty and null when the payment did not come from Checkout; the total still shows.
-          items: (session?.line_items?.data ?? []).map((item) => ({
+          items: items.map((item) => ({
             id: item.id,
             name: item.description,
```

No `.catch` on the new call: like the session lookup above it, a failure must fail the delivery so Stripe retries.

In `tests/app/api/webhooks/stripe/route.test.ts`:

```diff
--- a/tests/app/api/webhooks/stripe/route.test.ts
+++ b/tests/app/api/webhooks/stripe/route.test.ts
@@ -9,4 +9,5 @@ process.env.STRIPE_WEBHOOK_SECRET = "whsec_nstore";
 let intent: Record<string, unknown> | null = null; // null: an intent Stripe doesn't know
 let session: Record<string, unknown> | null = null; // null: a payment made outside Checkout
+let allLineItems: Record<string, unknown>[] = []; // what Stripe returns when asked for every line item
 let row: { confirmationEmailSentAt: Date | null } = { confirmationEmailSentAt: null };
 let upserts: Record<string, unknown>[] = [];
@@ -18,4 +19,5 @@ beforeEach(() => {
   intent = null;
   session = null;
+  allLineItems = [];
   row = { confirmationEmailSentAt: null };
   upserts = [];
@@ -38,4 +40,5 @@ mock.module("@/server/services/stripe", () => ({
     }) as never;
     stripe.checkout.sessions.list = (async () => ({ data: session ? [session] : [] })) as never;
+    stripe.checkout.sessions.listLineItems = (() => ({ autoPagingToArray: async () => allLineItems })) as never;
     return stripe;
   },
@@ -176,4 +179,16 @@ test("a guest order is emailed to the address typed into Checkout, without an ac
 });
 
+test("a basket larger than Stripe's first page of line items is listed in full", async () => {
+  const line = (n: number) => ({ id: `li_${n}`, description: `Product ${n}`, quantity: 1, amount_total: 500, currency: "eur" });
+  allLineItems = Array.from({ length: 12 }, (_, index) => line(index + 1));
+  intent = { ...paid, receipt_email: "member@example.com", metadata: { clerkUserId: "user_member" } };
+  // Stripe expands the first ten and flags that there are more.
+  session = { ...checkout, id: "cs_test_big", line_items: { has_more: true, data: allLineItems.slice(0, 10) } };
+
+  assert.equal((await deliver()).status, 200);
+  assert.ok(sent[0].text.includes("Product 10 × 1"));
+  assert.ok(sent[0].text.includes("Product 12 × 1"), "items past the first page are in the email");
+});
+
 test("unpaid, unaddressed and email-disabled payments are recorded without an email", async () => {
   intent = { ...paid, status: "processing", amount_received: 0, receipt_email: "member@example.com", metadata: { clerkUserId: "user_member" } };
```

**Verify**: `bun test --isolate --conditions=react-server tests/app/api/webhooks` → `9 pass`, `0 fail`.

### Step 4: Give the catalog cache a hard one-hour limit

In `src/server/queries/products.ts`:

```diff
--- a/src/server/queries/products.ts
+++ b/src/server/queries/products.ts
@@ -22,5 +22,7 @@ const columns = {
 async function getCatalog(): Promise<Product[]> {
   "use cache";
-  cacheLife("hours");
+  // Refreshed in the background after 15 minutes, and never served more than an
+  // hour old: the built-in "hours" profile would keep a stale entry for a day.
+  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
 
   return getDb().select(columns).from(products).orderBy(asc(products.position));
```

**Verify**: `bunx tsc --noEmit` → exit 0.
**Verify** (needs `.env.local`): `bun run build` → exit 0, and the header row and first route row of the table read:

```text
Route (app)                          Revalidate  Expire
┌ ◐ /                                       15m      1h
```

Every page route must still be marked `◐`. If any page route is now `ƒ`, that is a STOP condition.

### Step 5: Make the two fakes check the user filter

In `tests/server/actions/checkout.test.ts`:

```diff
--- a/tests/server/actions/checkout.test.ts
+++ b/tests/server/actions/checkout.test.ts
@@ -1,4 +1,6 @@
 import assert from "node:assert/strict";
 import { beforeEach, mock, test } from "bun:test";
+import type { SQL } from "drizzle-orm";
+import { PgDialect } from "drizzle-orm/pg-core";
 import type { CartLine } from "@/lib/cart";
 
@@ -11,4 +13,5 @@ let lines: CartLine[] = [];
 let user: { id: string; primaryEmailAddress: { emailAddress: string }; privateMetadata: Record<string, unknown> } | null = null;
 let defaultAddress: typeof home | null = null;
+let addressQuery: SQL | undefined; // the WHERE clause the default-address lookup ran with
 let savedCustomerExists = true;
 let sessions: Params[] = [];
@@ -21,4 +24,5 @@ beforeEach(() => {
   user = null;
   defaultAddress = null;
+  addressQuery = undefined;
   savedCustomerExists = true;
   sessions = [];
@@ -46,5 +50,8 @@ mock.module("next/navigation", () => ({
 mock.module("@/server/queries/cart", () => ({ getCartLines: async () => lines }));
 mock.module("@/server/db", () => ({
-  getDb: () => ({ select: () => ({ from: () => ({ where: async () => (defaultAddress ? [defaultAddress] : []) }) }) }),
+  getDb: () => ({ select: () => ({ from: () => ({ where: async (condition: SQL) => {
+    addressQuery = condition;
+    return defaultAddress ? [defaultAddress] : [];
+  } }) }) }),
 }));
 mock.module("@/server/services/stripe", () => ({
@@ -127,4 +134,6 @@ test("a member's default address and phone pre-fill Checkout through their saved
   assert.equal(sessions[0].customer, "cus_saved");
   assert.ok(!("customer_email" in sessions[0]), "Stripe rejects a session with both customer and customer_email");
+  // The fake returns whatever it holds, so the filter is what keeps another member's address out.
+  assert.deepEqual(new PgDialect().sqlToQuery(addressQuery!).params, ["user_member", true], "only this member's default address is looked up");
   assert.deepEqual([customerCreates, metadataWrites], [[], []]);
 });
```

In `tests/server/actions/addresses.test.ts`:

```diff
--- a/tests/server/actions/addresses.test.ts
+++ b/tests/server/actions/addresses.test.ts
@@ -8,4 +8,5 @@ type Write = { kind: "insert" | "update" | "delete"; values?: Record<string, unk
 let userId: string | null = "user_owner";
 let owned = true; // whether the submitted id is one of this user's addresses
+let ownershipChecks: SQL[] = []; // the WHERE clause of each "is this address mine?" lookup
 let ran: Write[] = []; // writes awaited on their own
 let batches: Write[][] = []; // writes sent together as one transaction
@@ -14,4 +15,5 @@ beforeEach(() => {
   userId = "user_owner";
   owned = true;
+  ownershipChecks = [];
   ran = [];
   batches = [];
@@ -61,5 +63,8 @@ mock.module("@/server/db", () => ({
     update: () => write("update"),
     delete: () => write("delete"),
-    select: () => ({ from: () => ({ where: () => ({ limit: async () => (owned ? [{ id: "addr_1" }] : []) }) }) }),
+    select: () => ({ from: () => ({ where: (condition: SQL) => {
+      ownershipChecks.push(condition);
+      return { limit: async () => (owned ? [{ id: "addr_1" }] : []) };
+    } }) }),
     batch: async (writes: { record: Write }[]) => {
       batches.push(writes.map(({ record }) => record));
@@ -138,3 +143,8 @@ test("an address that is gone or someone else's leaves the current default alone
   await setDefaultAddress(only("addr_gone"));
   assert.deepEqual([ran, batches], [[], []]);
+  // "Mine" has to mean this id *and* this user, or another member's address would pass the check.
+  assert.deepEqual(
+    ownershipChecks.map((condition) => new PgDialect().sqlToQuery(condition).params),
+    [["addr_gone", "user_owner"], ["addr_gone", "user_owner"]],
+  );
 });
```

**Verify**: `bun test --isolate --conditions=react-server tests/server/actions` → `0 fail`.

### Step 6: Run the full gate

**Verify**: `bun run lint` → exit 0; `bun run typecheck` → exit 0; `bun run test` → `0 fail`, 43 tests in total (with `.env.local`: 43 pass; without: 39 pass, 4 skip).

## Test plan

- `tests/lib/posthog.test.ts` — rewritten (1 test, three phases): reject-during-download sends nothing and runs nothing; accepting turns capture on with exactly one `$opt_in`; reject-then-accept in the same session turns capture back on. Fails on the current source at phase one.
- `tests/app/api/webhooks/stripe/route.test.ts` — one new test: a 12-item order whose session expands 10 with `has_more: true` lists items 10 and 12 in the email. The advisor confirmed it fails against the current route.
- `checkout.test.ts`, `addresses.test.ts` — the fakes capture the `WHERE` clause and the tests assert its bound values (`["user_member", true]`, and `["addr_gone", "user_owner"]` twice).

Advisor verification of this exact code in a scratch clone of `7f05bf7`: lint, typecheck, 43 tests and the production build pass. The consent flow was also run in a browser against the production build with the real posthog-js and all PostHog requests intercepted locally:

| Step | Events sent |
|---|---|
| Fresh visit, banner open | none |
| Reject in the banner | none |
| Accept in cookie preferences | `$opt_in`, `$pageview` |
| Reject | none |
| Accept again, no reload | `$opt_in` |
| Reload while accepted | `$pageview` (no new `$opt_in`) |

## Done criteria

- [ ] `bun test --isolate --conditions=react-server tests/lib/posthog.test.ts` → `1 pass`, `0 fail`
- [ ] `bun test --isolate --conditions=react-server tests/app/api/webhooks` → `9 pass`, `0 fail`
- [ ] `grep -c "opt_in_capturing" src/lib/posthog.ts` → `1` (one line, inside `withPostHog`)
- [ ] `grep -c 'cacheLife("hours")' src/server/queries/products.ts` → `0`
- [ ] `grep -c "listLineItems" src/app/api/webhooks/stripe/route.ts` → `1`
- [ ] `bun run lint`, `bun run typecheck` exit 0; `bun run test` → `0 fail`
- [ ] `bun run build` exits 0 with `15m` / `1h` in the route table (or reported as not run, with the reason)
- [ ] `git status --short` lists only the seven in-scope files (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- In Step 1 the new PostHog test passes before `posthog.ts` is changed, or fails on a different assertion than the one named.
- TypeScript rejects `has_opted_in_capturing`, `listLineItems` or `autoPagingToArray` — the installed `posthog-js` (1.445.1) or `stripe` (22.6.2) changed.
- After Step 4 the build fails, hangs, or shows a page route as `ƒ`. Do not fall back to `cacheLife("minutes")` or any other profile on your own.
- A checkout or address test fails after Step 5 with different bound values than listed — report the actual values; do not edit the action or loosen the assertion.

## Maintenance notes

- **Behaviour change to expect in PostHog:** `$opt_in` used to be sent on every page load of an accepted visitor (because `load()` always opted in). It is now sent once per grant. Dashboards counting `$opt_in` will drop; nothing else changes.
- The order pages (`src/server/queries/orders.ts:43`) and the checkout success page (`src/app/(store)/checkout/success/page.tsx:19`) still show at most ten line items for an order with more than ten different products. Display only, and older than pull request #6. Fixing it on `/orders` means up to 20 extra Stripe calls per render; the durable fix is persisting orders and their line items in the webhook, already listed as a direction option in `plans/README.md`.
- Catalog freshness is now: refreshed in the background after 15 minutes of age, never served older than 1 hour, reset by every deployment. Product pages are regenerated on the same schedule.
- Reviewer: confirm there is no opt-in outside `withPostHog`, and no `.catch` on the new Stripe call.
