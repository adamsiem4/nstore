# Plan 009: Changing the default address is one atomic transaction that cannot leave a user with none

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7f05bf7..HEAD -- src/server/actions/addresses.ts tests/server/actions/addresses.test.ts`
> This plan is written against the tree **after plan 008 has landed**: plan 008's
> small change to `tests/server/actions/addresses.test.ts` is expected in that
> diff. Any other change to these two files is drift — compare the "Current
> state" excerpts against the live code and treat a mismatch as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW–MED (the guard moves into SQL, where the unit tests cannot execute it)
- **Depends on**: plans/008-review-fixes-consent-receipt-cache.md (edits the same test file)
- **Category**: bug
- **Planned at**: commit `7f05bf7` (branch `audit/improve`, pull request #6), 2026-11-12

## Why this matters

Plan 005 stopped a stale address id from wiping a user's default address by checking first that the address exists and belongs to the user (`owns()`), then running the swap. The check and the swap are two separate requests to the database. If the same user deletes that address in another tab in the moment between them, the swap still clears the old default and then updates nothing: the user is left with saved addresses but no default, and Checkout stops pre-filling one. Both the plan's own notes and the review of pull request #6 flagged this.

It is a narrow race with a mild outcome (the user clicks "Set as default" again), but it can be closed completely, and doing so removes a helper and a database round trip: the existence check moves *into* the swap's transaction, with the target row locked for its duration.

**This plan is optional.** If the owner prefers to accept the race, mark this plan REJECTED in `plans/README.md` with that reason and answer the review thread accordingly.

## Current state

`src/server/actions/addresses.ts` (after plans 005 and 008):

```ts
/** False for an address removed in another tab, or one that was never this user's. */
async function owns(userId: string, id: string) {
  const [address] = await getDb()
    .select({ id: addresses.id })
    .from(addresses)
    .where(mine(userId, id))
    .limit(1);
  return Boolean(address);
}

// saveAddress
  const id = field(form, "id", { optional: true });
  // Nothing to update: writing anyway would clear the current default and set none.
  if (id && !(await owns(userId, id))) redirect("/account/addresses");
  // …
  if (values.isDefault) await db.batch([clearDefault, write]);
  else await write;

// setDefaultAddress
  if (await owns(userId, id)) {
    await db.batch([
      db.update(addresses).set({ isDefault: false }).where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true))),
      db.update(addresses).set({ isDefault: true }).where(mine(userId, id)),
    ]);
  }
```

- `db.batch([...])` is the Neon HTTP driver's batch: all statements run in **one transaction** (default isolation: read committed) in one HTTP request.
- The table has a partial unique index, `addresses_one_default_idx ON addresses (clerk_user_id) WHERE is_default`, so two defaults can never coexist. That is why the old default must be cleared *before* the new one is set, and why a single `UPDATE` that flips both rows is not used (Postgres checks a non-deferrable unique index row by row, so such a statement can fail depending on row order).
- `tests/server/actions/addresses.test.ts` — 5 tests using a fake `getDb()` that records statements instead of running them.

The target design, in SQL terms, for "make address `$id` the default of user `$user`":

```sql
BEGIN;
-- 1. Lock the target. A concurrent DELETE of this row now waits for COMMIT.
SELECT id FROM addresses WHERE id = $id AND clerk_user_id = $user FOR UPDATE;
-- 2. Release the old default only while the target still exists.
UPDATE addresses SET is_default = false
 WHERE clerk_user_id = $user AND is_default
   AND EXISTS (SELECT id FROM addresses WHERE id = $id AND clerk_user_id = $user);
-- 3. The caller's write: set the default (or, for an edit, all the form's values).
UPDATE addresses SET is_default = true WHERE id = $id AND clerk_user_id = $user;
COMMIT;
```

If the target is missing or belongs to someone else, statement 1 locks nothing, statement 2's `EXISTS` is false, statement 3 matches nothing: no change. If it exists, it is locked from statement 1 until commit, so it cannot disappear between 2 and 3.

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
- `src/server/actions/addresses.ts`
- `tests/server/actions/addresses.test.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/server/db/schema.ts`, `drizzle/` — no schema change, no migration. Do not try to make the unique index deferrable.
- `src/app/(store)/account/addresses/**` — the forms are unchanged.
- Adding a database for tests (PGlite, Docker, a Neon branch) or any dependency.
- `bun run db:migrate`, `db:seed`, `db:studio` — never run these.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there.
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(webhook): email guest orders and acknowledge payments when Resend is unset`.
- This work belongs to pull request #6: it goes on branch `audit/improve`.
Suggested message: `fix(addresses): check and swap the default in one locked transaction`

## Steps

### Step 1: Replace the address actions

Replace `src/server/actions/addresses.ts` with:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, exists } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { SHIPPING_COUNTRIES } from "@/lib/cart";
import { getDb } from "@/server/db";
import { addresses } from "@/server/db/schema";

// ponytail: the form's `required`/`maxLength`/<select> stop honest mistakes
// before submit, so a bad value here means a crafted request: it throws
// instead of round-tripping field errors.
function field(form: FormData, name: string, { max = 100, optional = false } = {}) {
  const value = form.get(name);
  const text = typeof value === "string" ? value.trim() : "";
  if ((!text && !optional) || text.length > max) throw new Error(`Invalid ${name}`);
  return text;
}

const mine = (userId: string, id: string) =>
  and(eq(addresses.id, id), eq(addresses.clerkUserId, userId));

const isDefaultOf = (userId: string) =>
  and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true));

/**
 * The first two statements of a batch (one transaction) that hands the default
 * to address `id`; the caller adds the write that sets it. The partial unique
 * index allows one default per user, so the old one has to go first — but only
 * while there is still a row to give it to. An address removed in another tab,
 * or one that was never this user's, leaves the current default alone.
 */
function releaseDefaultFor(userId: string, id: string) {
  const db = getDb();
  const target = () => db.select({ id: addresses.id }).from(addresses).where(mine(userId, id));
  return [
    // Held until the batch commits: a delete racing in from another tab waits
    // for it instead of landing between the check below and the caller's write.
    target().for("update"),
    db.update(addresses).set({ isDefault: false }).where(and(isDefaultOf(userId), exists(target()))),
  ] as const;
}

/** Creates, or updates when the form carries an `id`. */
export async function saveAddress(form: FormData) {
  const { userId } = await auth.protect();
  const country = field(form, "country", { max: 2 });
  if (!SHIPPING_COUNTRIES.some((code) => code === country)) throw new Error("Invalid country");

  const values = {
    name: field(form, "name"),
    line1: field(form, "line1"),
    line2: field(form, "line2", { optional: true }) || null,
    city: field(form, "city"),
    postalCode: field(form, "postalCode", { max: 20 }),
    country,
    isDefault: form.get("isDefault") === "on",
  };
  const id = field(form, "id", { optional: true });
  const db = getDb();

  if (id) {
    const update = db.update(addresses).set(values).where(mine(userId, id));
    if (values.isDefault) await db.batch([...releaseDefaultFor(userId, id), update]);
    else await update;
  } else {
    const insert = db.insert(addresses).values({ ...values, clerkUserId: userId });
    // A new row always exists, so the old default is cleared unconditionally, in the same batch.
    if (values.isDefault) await db.batch([db.update(addresses).set({ isDefault: false }).where(isDefaultOf(userId)), insert]);
    else await insert;
  }

  redirect("/account/addresses");
}

export async function deleteAddress(form: FormData) {
  const { userId } = await auth.protect();
  await getDb().delete(addresses).where(mine(userId, field(form, "id")));
  refresh();
}

export async function setDefaultAddress(form: FormData) {
  const { userId } = await auth.protect();
  const id = field(form, "id");
  const db = getDb();
  await db.batch([
    ...releaseDefaultFor(userId, id),
    db.update(addresses).set({ isDefault: true }).where(mine(userId, id)),
  ]);
  refresh();
}
```

What changed:
- `owns()` is gone; nothing is looked up before the batch.
- `releaseDefaultFor(userId, id)` returns statements 1 and 2 of the design above. `target` is a function, called twice, because Drizzle's `.for("update")` modifies the query it is called on and the `EXISTS` subquery must not carry the lock clause.
- `saveAddress` separates "edit" from "create". An edit with "make default" runs `[lock, release-if-exists, update]`; an edit of a missing id updates nothing and still redirects to the list, as before. A new address has no race (the row is created in the same batch), so its old-default clear stays unconditional.
- `setDefaultAddress` runs `[lock, release-if-exists, set]` unconditionally.
- `deleteAddress` is unchanged.

**Verify**: `bunx tsc --noEmit` → exit 0; `bun run lint` → exit 0.
**Verify**: `bun test --isolate --conditions=react-server tests/server/actions/addresses.test.ts` → fails (the old test's fake database has no `for`/`from` on its statements). Expected; Step 2 replaces the test.

### Step 2: Replace the address test

Replace `tests/server/actions/addresses.test.ts` with:

```ts
import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type Statement = { kind: "select" | "insert" | "update" | "delete"; values?: Record<string, unknown>; where?: SQL; lock?: string };

let userId: string | null = "user_owner";
let ran: Statement[] = []; // statements awaited on their own
let batches: Statement[][] = []; // statements sent together as one transaction

beforeEach(() => {
  userId = "user_owner";
  ran = [];
  batches = [];
});

// Records each statement instead of running it; nothing happens until it is awaited or batched.
function statement(kind: Statement["kind"]) {
  const record: Statement = { kind };
  const chain = {
    record,
    from: () => chain,
    values(values: Record<string, unknown>) {
      record.values = values;
      return chain;
    },
    set(values: Record<string, unknown>) {
      record.values = values;
      return chain;
    },
    where(condition: SQL) {
      record.where = condition;
      return chain;
    },
    for(strength: string) {
      record.lock = strength;
      return chain;
    },
    // Lets a recorded select sit inside exists(...): its condition, and so its bound values, flow into the outer query.
    getSQL: () => record.where,
    then(resolve: (rows: unknown[]) => void) {
      ran.push(record);
      resolve([]);
    },
  };
  return chain;
}

mock.module("@clerk/nextjs/server", () => ({
  auth: { protect: async () => {
    if (!userId) throw new Error("Unauthenticated");
    return { userId };
  } },
}));
mock.module("next/cache", () => ({ refresh: () => {} }));
// The real redirect() throws to stop the action; so does this one, with the target in the message.
mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
mock.module("@/server/db", () => ({
  getDb: () => ({
    select: () => statement("select"),
    insert: () => statement("insert"),
    update: () => statement("update"),
    delete: () => statement("delete"),
    batch: async (statements: { record: Statement }[]) => {
      batches.push(statements.map(({ record }) => record));
    },
  }),
}));

// Load actions after mocks; static imports would initialize the real Clerk and database modules.
const { deleteAddress, saveAddress, setDefaultAddress } = await import("@/server/actions/addresses");

/** The values a WHERE clause is bound to, e.g. ["addr_1", "user_owner"]. */
const bound = (record: Statement) => (record.where ? new PgDialect().sqlToQuery(record.where).params : []);

function address(fields: Record<string, string> = {}) {
  const form = new FormData();
  const filled = { name: " Ada Lovelace ", line1: "1 Main St", city: "Dublin", postalCode: "D01 F5P2", country: "IE", ...fields };
  for (const [name, value] of Object.entries(filled)) form.set(name, value);
  return form;
}

function only(id: string) {
  const form = new FormData();
  form.set("id", id);
  return form;
}

const toList = /REDIRECT \/account\/addresses/;

test("saving an address requires a signed-in user and valid fields", async () => {
  userId = null;
  await assert.rejects(saveAddress(address()), /Unauthenticated/);
  userId = "user_owner";

  await assert.rejects(saveAddress(address({ country: "US" })), /Invalid country/, "only countries checkout ships to");
  await assert.rejects(saveAddress(address({ line1: "   " })), /Invalid line1/);
  await assert.rejects(saveAddress(address({ name: "x".repeat(101) })), /Invalid name/);
  await assert.rejects(saveAddress(address({ postalCode: "x".repeat(21) })), /Invalid postalCode/);
  assert.deepEqual([ran, batches], [[], []], "rejected input writes nothing");
});

test("a new address is stored trimmed under the signed-in user", async () => {
  await assert.rejects(saveAddress(address()), toList);
  assert.deepEqual(batches, []);
  assert.deepEqual(ran, [{
    kind: "insert",
    values: { name: "Ada Lovelace", line1: "1 Main St", line2: null, city: "Dublin", postalCode: "D01 F5P2", country: "IE", isDefault: false, clerkUserId: "user_owner" },
  }]);
});

test("a new default clears the old one in the same transaction", async () => {
  await assert.rejects(saveAddress(address({ isDefault: "on" })), toList);
  assert.deepEqual(ran, [], "never as two separate statements");
  const [[clear, insert]] = batches;
  assert.deepEqual([clear.kind, clear.values, bound(clear)], ["update", { isDefault: false }, ["user_owner", true]]);
  assert.equal(insert.kind, "insert");
  assert.equal(insert.values?.isDefault, true);
});

test("edits and removals only touch the signed-in user's own address", async () => {
  await assert.rejects(saveAddress(address({ id: "addr_1" })), toList);
  await deleteAddress(only("addr_1"));

  assert.deepEqual(batches, []);
  assert.deepEqual(ran.map((record) => [record.kind, bound(record)]), [
    ["update", ["addr_1", "user_owner"]],
    ["delete", ["addr_1", "user_owner"]],
  ]);
});

// Whether the address still exists is decided by the database, inside the same
// transaction as the swap. What can be checked here is that the swap is built
// that way: lock the target, release the old default only if the target is this
// user's, then set the new one, with no separate look-up beforehand.
test("handing over the default locks the target and releases the old default only while the target exists", async () => {
  await setDefaultAddress(only("addr_1"));
  await assert.rejects(saveAddress(address({ id: "addr_1", isDefault: "on" })), toList);

  assert.deepEqual(ran, [], "one transaction each, nothing checked or written outside it");
  for (const [lock, release, write] of batches) {
    assert.deepEqual([lock.kind, lock.lock, bound(lock)], ["select", "update", ["addr_1", "user_owner"]]);
    assert.deepEqual(
      [release.kind, release.values, bound(release)],
      ["update", { isDefault: false }, ["user_owner", true, "addr_1", "user_owner"]],
      "this user's current default, and only if addr_1 is this user's address",
    );
    assert.deepEqual([write.kind, write.values?.isDefault, bound(write)], ["update", true, ["addr_1", "user_owner"]]);
  }
  assert.equal(batches.length, 2);
});
```

What the last test can and cannot prove: the fake database records statements, it does not run SQL. So the test proves the swap is *built* as designed — a locking select on the target, a release whose bound values include the target id and user (i.e. the `EXISTS` guard is there), then the write, all in one batch with nothing outside it. Whether Postgres then behaves as intended was verified separately by the advisor (see Test plan).

**Verify**: `bun test --isolate --conditions=react-server tests/server/actions/addresses.test.ts` → `5 pass`, `0 fail`.

### Step 3: Run the full gate

**Verify**: `bun run lint` → exit 0; `bun run typecheck` → exit 0; `bun run test` → `0 fail`; `bun run build` → exit 0 (needs `.env.local`).

### Step 4: Check it by hand (needs a signed-in session; otherwise say so in your report)

With `bun run dev`, signed in, on `/account/addresses` with two saved addresses A (default) and B:

1. Click "Set as default" on B → B is the default, A is not.
2. Open the page in a second tab. In tab 1 click "Remove" on B. In tab 2 (not reloaded) click "Set as default" on B → after the refresh, A's default status is unchanged from before the click and no error is shown.
3. Click "Edit" on A, tick "Make this my default address", save → A is the default.

## Test plan

- `tests/server/actions/addresses.test.ts` (5 tests, full file in Step 2): validation and auth; trimmed insert; new default clears the old one in one batch; edits and deletes are bound to `[id, userId]`; **the default hand-over is one batch of lock → guarded release → write, with no statement outside it**.
- Advisor verification that cannot ship as a test without a new dependency: the exact `addresses.ts` above was run against a real Postgres engine (PGlite, in a scratch clone only) with the repository's own `drizzle/0002_addresses.sql` schema and a batch shim that wraps the statements in `BEGIN`/`COMMIT`:

  | Case | Result |
  |---|---|
  | Set default on an existing address | swapped |
  | Set default on the address that already is the default | unchanged |
  | Set default with a missing id | default kept |
  | Set default with another user's address id | nothing changes for either user |
  | Target deleted just before the batch runs (the old race) | default kept |
  | Edit + "make default" on an existing / missing / just-deleted address | swapped / default kept / default kept |
  | New address with and without "make default" | exactly one default afterwards |

  The same script run against the current code loses the default in the two "just deleted" cases.
- Not verified by execution: two truly concurrent transactions. The row lock in statement 1 is what covers that; it rests on Postgres's documented `FOR UPDATE` behaviour, not on a test.

## Done criteria

- [ ] `grep -c "async function owns" src/server/actions/addresses.ts` → `0`
- [ ] `grep -c '\.for("update")' src/server/actions/addresses.ts` → `1`
- [ ] `grep -c "exists(target())" src/server/actions/addresses.ts` → `1`
- [ ] `bun test --isolate --conditions=react-server tests/server/actions/addresses.test.ts` → `5 pass`, `0 fail`
- [ ] `bun run lint`, `bun run typecheck` exit 0; `bun run test` → `0 fail`
- [ ] `git status --short` lists only the two in-scope files (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 008 has not landed (`grep -c ownershipChecks tests/server/actions/addresses.test.ts` is `0` before you start).
- TypeScript rejects `db.batch([...releaseDefaultFor(userId, id), …])`, `.for("update")` or `exists` — the installed `drizzle-orm` (0.45.4) changed. Do not replace the batch with separate awaited statements: outside one transaction the lock protects nothing.
- You are tempted to merge the three statements into one `UPDATE`, or to reorder them. The unique index makes both unsafe (see "Current state").
- In Step 4 any click produces an error page or a 500 — report the server log line.

## Maintenance notes

- The guard now lives in SQL. Anyone changing `releaseDefaultFor` should re-run a real-database check like the one in the Test plan; the unit test only pins the statement shape.
- A third "default hand-over" caller, if one is ever added, must use `releaseDefaultFor` followed by its write in the same `db.batch`.
- The transaction holds one row lock for a few milliseconds. The only statements that can wait on it are a delete or edit of that same address by the same user.
- Reviewer: check that every `db.batch` that sets a default on an existing address starts with `...releaseDefaultFor(...)`, and that no lookup happens before the batch.
