# Plan 007: Analytics queued before a consent withdrawal never fires, and the order list has an index

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- src/lib/posthog.ts src/lib/consent.ts src/server/db/schema.ts drizzle tests/lib`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

Two small, unrelated fixes bundled because each is a few lines.

**Part A — consent.** The store promises that PostHog runs only after the visitor accepts analytics. `withPostHog` checks consent when it is *called*, then waits for the PostHog chunk (~100 KB, fetched on demand) and runs the queued work when it arrives. If the visitor accepts, a page queues an event, and they switch to "Reject" before the chunk has loaded, the queued event still fires after the rejection. The window is short, but it is exactly the case the consent promise is about, and the fix is one re-check.

**Part B — index.** The order list filters `payments` by Clerk user and status and sorts by creation time; the table's only index is its primary key, so the query scans the whole table. Harmless at today's size, cheap to fix before it is not.

## Current state

- `src/lib/posthog.ts:26-29` — consent is checked once, before the asynchronous load:

  ```ts
  /** Runs `use` with PostHog when analytics was accepted; does nothing otherwise. */
  export function withPostHog(use: (posthog: PostHog) => unknown) {
    if (token && getConsent() === "granted") void load().then(use);
  }
  ```

  `load()` (lines 10-24) memoises `import("posthog-js").then(init …)` in the module variable `client`. `startPostHog()` (lines 32-41) listens for the consent event and calls `posthog.opt_out_capturing()` on "denied" — but only *after* `client` resolves, i.e. after callbacks queued earlier on the same promise have already run.
- `src/lib/consent.ts` — `getConsent()` reads the `cookie-consent` key from `localStorage`; `setConsent(value)` writes it and dispatches a `cookie-consent` `CustomEvent` on `window`. Not modified.
- Callers of `withPostHog`: `src/components/analytics/capture-event.tsx`, `src/components/analytics/posthog-identity.tsx`, the cart buttons. Not modified.
- `src/server/db/schema.ts:40-56` — `payments` is declared as `pgTable("payments", { … })` with no index callback. The `addresses` table further down in the same file shows the repo's way of declaring indexes (a third argument returning an array, `index("name").on(…)`); `index` is already imported.
- `src/server/queries/orders.ts:26-35` — the query the index serves:

  ```ts
  .from(payments)
  .where(
    and(
      eq(payments.clerkUserId, userId),
      eq(payments.status, "succeeded"),
      number ? ilike(payments.id, `%${number}`) : undefined,
    ),
  )
  .orderBy(desc(payments.createdAt))
  .limit(number ? 1 : 20);
  ```

- `drizzle/` — generated SQL migrations `0000_…`, `0001_catalog.sql`, `0002_addresses.sql` plus `drizzle/meta/` snapshots. Workflow from the README: edit the schema → `bun run db:generate` → review the SQL → `bun run db:migrate`. `drizzle-kit generate` only diffs the schema against the snapshots; it does **not** connect to the database.

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

| Generate migration | `bunx drizzle-kit generate --name payments_orders_idx` | writes `drizzle/0003_payments_orders_idx.sql` |

## Scope

**In scope** (the only files you should modify):
- `src/lib/posthog.ts`
- `tests/lib/posthog.test.ts` (create)
- `src/server/db/schema.ts` — the `payments` table only
- `drizzle/0003_payments_orders_idx.sql`, `drizzle/meta/0003_snapshot.json`, `drizzle/meta/_journal.json` — **generated by the command in Step 4, never written by hand**

**Out of scope** (do NOT touch, even though they look related):
- **`bun run db:migrate`, `bun run db:seed`, `bun run db:studio` — do NOT run them.** They act on the live Neon database named in `.env.local`. Applying the migration is the owner's step.
- `src/lib/consent.ts`, the cookie banner, and every caller of `withPostHog`.
- Existing files in `drizzle/` (`0000`–`0002` SQL and snapshots).
- `src/server/queries/orders.ts` — the query does not change.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested messages: `fix(analytics): re-check consent when PostHog finishes loading` and `perf(db): index payments for the order list`

## Steps

### Step 1: Add the consent test and watch it fail

Create `tests/lib/posthog.test.ts`:

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
const sdk = Promise.withResolvers<void>();
const optedOut = Promise.withResolvers<void>();
mock.module("posthog-js", async () => {
  await sdk.promise;
  return { default: { init() {}, opt_in_capturing() {}, opt_out_capturing: optedOut.resolve } };
});

// Load after the token, globals and mock are in place.
const { startPostHog, withPostHog } = await import("@/lib/posthog");

test("work queued while PostHog downloads is dropped when consent is withdrawn before it arrives", async () => {
  const ran: string[] = [];
  startPostHog();

  setConsent("granted");
  withPostHog(() => ran.push("queued, then declined"));
  setConsent("denied");
  sdk.resolve();
  // The opt-out was queued after the work above, so by now that work has had its turn.
  await optedOut.promise;
  assert.equal(ran.length, 0);

  // The gate is consent, not a broken loader: accepting again lets work through.
  setConsent("granted");
  const accepted = Promise.withResolvers<void>();
  withPostHog(() => {
    ran.push("accepted");
    accepted.resolve();
  });
  await accepted.promise;
  assert.deepEqual(ran, ["accepted"]);
});
```

How it works: `posthog-js` is replaced by a fake whose import stays pending until `sdk.resolve()`, standing in for the chunk download. The test accepts, queues work, rejects, then lets the SDK "arrive" and waits for the opt-out the real listener in `startPostHog()` issues — which is queued behind the work under test, so no timers are needed.

**Verify**: `bun test --isolate --conditions=react-server tests/lib/posthog.test.ts` → `0 pass`, `1 fail` (the assertion `ran.length` equals 0 fails with 1). That failure is the bug.

### Step 2: Re-check consent on arrival

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
    posthog.init(token!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-05-30",
      opt_out_capturing_by_default: true,
      opt_out_capturing_persistence_type: "localStorage",
      opt_out_persistence_by_default: true,
    });
    // Also clears an opt-out persisted by an earlier "Reject".
    posthog.opt_in_capturing();
    return posthog;
  });
  return client;
}

/** Runs `use` with PostHog when analytics was accepted; does nothing otherwise. */
export function withPostHog(use: (posthog: PostHog) => unknown) {
  if (!token || getConsent() !== "granted") return;
  void load().then((posthog) => {
    // Asked again on arrival: the visitor may have declined while the chunk downloaded.
    if (getConsent() === "granted") use(posthog);
  });
}

/** Starts PostHog for a visitor who already accepted, then follows the banner. */
export function startPostHog() {
  if (!token) return;
  withPostHog(() => {});

  window.addEventListener(CONSENT_EVENT, (event) => {
    const consent = (event as CustomEvent<Consent | null>).detail;
    if (consent === "granted") void load();
    else void client?.then((posthog) => posthog.opt_out_capturing());
  });
}
```

Only `withPostHog` changes: the early return keeps "no download before consent", and the callback asks `getConsent()` again when the chunk has arrived.

**Verify**: `bun test --isolate --conditions=react-server tests/lib/posthog.test.ts` → `1 pass`, `0 fail`.
**Verify**: `bunx tsc --noEmit` → exit 0; `bun run lint` → exit 0.

### Step 3: Declare the index

In `src/server/db/schema.ts`, turn the `payments` definition into the three-argument form and add the index. The column definitions are unchanged apart from indentation.

```diff
--- a/src/server/db/schema.ts
+++ b/src/server/db/schema.ts
@@ -38,21 +38,29 @@ export const productDetails = pgTable("product_details", {
 });
 
-export const payments = pgTable("payments", {
-  id: text("stripe_payment_intent_id").primaryKey(),
-  clerkUserId: text("clerk_user_id"),
-  status: text("status").notNull(),
-  amount: integer("amount").notNull(),
-  currency: text("currency").notNull(),
-  receiptEmail: text("receipt_email"),
-  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
-    withTimezone: true,
-  }),
-  createdAt: timestamp("created_at", { withTimezone: true })
-    .defaultNow()
-    .notNull(),
-  updatedAt: timestamp("updated_at", { withTimezone: true })
-    .defaultNow()
-    .notNull(),
-});
+export const payments = pgTable(
+  "payments",
+  {
+    id: text("stripe_payment_intent_id").primaryKey(),
+    clerkUserId: text("clerk_user_id"),
+    status: text("status").notNull(),
+    amount: integer("amount").notNull(),
+    currency: text("currency").notNull(),
+    receiptEmail: text("receipt_email"),
+    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
+      withTimezone: true,
+    }),
+    createdAt: timestamp("created_at", { withTimezone: true })
+      .defaultNow()
+      .notNull(),
+    updatedAt: timestamp("updated_at", { withTimezone: true })
+      .defaultNow()
+      .notNull(),
+  },
+  (table) => [
+    // The order list: one user's paid orders by date. Ascending on purpose —
+    // Postgres walks it backwards for the newest-first sort.
+    index("payments_orders_idx").on(table.clerkUserId, table.status, table.createdAt),
+  ],
+);
 
 /** Saved delivery addresses; the default one pre-fills Stripe Checkout. */
```

**Verify**: `bunx tsc --noEmit` → exit 0.

### Step 4: Generate the migration

Run `bunx drizzle-kit generate --name payments_orders_idx`.

**Verify**: `cat drizzle/0003_payments_orders_idx.sql` → exactly one statement:

```sql
CREATE INDEX "payments_orders_idx" ON "payments" USING btree ("clerk_user_id","status","created_at");
```

**Verify**: `git status --short drizzle` → exactly three entries: ` M drizzle/meta/_journal.json`, `?? drizzle/0003_payments_orders_idx.sql`, `?? drizzle/meta/0003_snapshot.json`.
**Verify**: `bun run db:generate` → reports no schema changes and creates no further file.

### Step 5: Run the full gate

**Verify**: `bun run lint` → exit 0; `bunx tsc --noEmit` → exit 0; `bun run test` → `0 fail`; `bun run build` → exit 0 (needs `.env.local`).

## Test plan

- `tests/lib/posthog.test.ts` (new, 1 test, full source in Step 1): work queued while the SDK downloads is dropped when consent is withdrawn first; accepting again lets work through. The advisor confirmed it fails on `a89aea0` and passes with Step 2.
- No test for the index: it changes no behaviour, and the query suites would need a writable database. Step 4's generated SQL is the check.

## Done criteria

- [ ] `bun test --isolate --conditions=react-server tests/lib/posthog.test.ts` → `1 pass`, `0 fail`
- [ ] `drizzle/0003_payments_orders_idx.sql` contains exactly the statement shown in Step 4
- [ ] `bun run db:generate` reports no schema changes
- [ ] `bun run lint`, `bunx tsc --noEmit` exit 0; `bun run test` → `0 fail`
- [ ] `git status --short` lists only: `src/lib/posthog.ts`, `tests/lib/posthog.test.ts`, `src/server/db/schema.ts`, the three `drizzle/` entries (and `plans/`)
- [ ] Your report states clearly: **the migration was generated but NOT applied; the owner must run `bun run db:migrate`**
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- In Step 1 the new test passes before you change `posthog.ts` — the bug was already fixed or the test is not exercising the loader.
- `drizzle-kit generate` produces SQL with anything beyond the single `CREATE INDEX` (for example `ALTER TABLE` or statements about other tables). That means `schema.ts` and the snapshots had already drifted; delete the files the command just created, restore `drizzle/meta/_journal.json` to its previous content, and report.
- `drizzle-kit generate` asks an interactive question (rename vs. create).
- You are about to run any `db:migrate`/`db:seed` command.

## Maintenance notes

- **Owner action**: review `drizzle/0003_payments_orders_idx.sql`, then `bun run db:migrate` against Neon. `CREATE INDEX` briefly blocks writes to `payments`; at this table size that is milliseconds.
- The index is ascending on `created_at` on purpose: with equality on the first two columns Postgres reads it backwards for `ORDER BY created_at DESC`, and the generated SQL stays free of `DESC NULLS LAST`.
- Part A closes the gap for *queued* work. PostHog's own `opt_out_capturing()` (already called by `startPostHog`) remains what stops autocapture and pageviews after the SDK is loaded.
- If orders and their line items are later persisted in their own table, revisit whether this index still matches the query.
