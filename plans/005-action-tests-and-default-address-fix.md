# Plan 005: Checkout, cart and address actions are covered by tests, and a stale address id can no longer wipe the default

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- src/server/actions/addresses.ts src/server/actions/checkout.ts src/server/actions/cart.ts src/lib/cart.ts tests/server/actions`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

Three Server Actions on the money and ownership paths have no tests at all: `startCheckout` (builds the Stripe Checkout Session — prices, shipping, customer, return URLs), the cart cookie actions, and the address book actions (ownership scoping, the one-default rule). A regression in any of them — charging the wrong shipping, dropping the ownership filter from an address `WHERE` clause — passes the whole suite today.

Writing the address tests exposes one real bug, fixed here: `setDefaultAddress` and `saveAddress` (edit + "make default") clear the user's current default **before** knowing whether the submitted id matches a row. With an id that no longer exists (deleted in another tab) or was never the user's, the old default is cleared and nothing replaces it; the next checkout silently loses its pre-filled address.

## Current state

- `src/server/actions/addresses.ts` (74 lines) — `saveAddress`, `deleteAddress`, `setDefaultAddress`. The bug:

  ```ts
  // saveAddress, lines 41-52
  const write = id
    ? db.update(addresses).set(values).where(mine(userId, id))
    : db.insert(addresses).values({ ...values, clerkUserId: userId });
  // …
  const clearDefault = db
    .update(addresses)
    .set({ isDefault: false })
    .where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true)));
  if (values.isDefault) await db.batch([clearDefault, write]);   // clears even when `write` matches no row
  else await write;

  // setDefaultAddress, lines 63-73
  await db.batch([
    db.update(addresses).set({ isDefault: false }).where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true))),
    db.update(addresses).set({ isDefault: true }).where(mine(userId, field(form, "id"))),   // may match nothing
  ]);
  ```

  `mine(userId, id)` is `and(eq(addresses.id, id), eq(addresses.clerkUserId, userId))`. `db.batch([...])` is the Neon HTTP driver's single-transaction batch; the schema has a partial unique index allowing one default per user, which is why the clear must come first.
- `src/server/actions/checkout.ts` (96 lines) — `startCheckout()`: reads cart lines, the Clerk user, the user's default address; creates/updates a Stripe customer when there is an address; creates the Checkout Session; `redirect(session.url)`. **Tested, not modified.**
- `src/server/actions/cart.ts` (46 lines) — `addToCart`, `updateCart`, `clearCart` over an httpOnly `cart` cookie. **Tested, not modified.**
- `src/lib/cart.ts` — pure cart math (`parseCart`, `withQty`, `totals`, `toLineItems`); already tested by `tests/lib/cart.test.ts`. Constants: `MAX_QTY = 99`, free shipping from 6000 cents, otherwise 495.
- Existing test pattern to follow — `tests/server/actions/returns.test.ts` and `order-status.test.ts`:

  ```ts
  import assert from "node:assert/strict";
  import { mock, test } from "bun:test";

  let userId: string | null = "user_owner";
  mock.module("@clerk/nextjs/server", () => ({
    auth: { protect: async () => {
      if (!userId) throw new Error("Unauthenticated");
      return { userId };
    } },
  }));
  mock.module("next/cache", () => ({ refresh: () => {} }));
  // …
  // Load actions after mocks; static imports would initialize real Clerk/Stripe modules.
  const { simulateOrderStep } = await import("@/server/actions/order-status");
  ```

  Each test file runs isolated (`bun test --isolate`), so `mock.module` calls do not leak between files.

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
- `src/server/actions/addresses.ts`
- `tests/server/actions/addresses.test.ts` (create)
- `tests/server/actions/checkout.test.ts` (create)
- `tests/server/actions/cart.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- `src/server/actions/checkout.ts`, `src/server/actions/cart.ts`, `src/lib/cart.ts` — characterised by the new tests, not changed. If a new test fails against them, that is a finding to report, not something to "fix" in either direction.
- `src/app/(store)/account/addresses/**` — the forms stay as they are.
- `src/server/db/schema.ts` and migrations.
- Adding a test database, PGlite, or any new dependency.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested message: `fix(addresses): keep the default when the target address is gone; test checkout, cart and address actions`

## Steps

### Step 1: Add the address tests first and watch one fail

Create `tests/server/actions/addresses.test.ts`:

```ts
import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type Write = { kind: "insert" | "update" | "delete"; values?: Record<string, unknown>; where?: SQL };

let userId: string | null = "user_owner";
let owned = true; // whether the submitted id is one of this user's addresses
let ran: Write[] = []; // writes awaited on their own
let batches: Write[][] = []; // writes sent together as one transaction

beforeEach(() => {
  userId = "user_owner";
  owned = true;
  ran = [];
  batches = [];
});

// Records each write instead of running it; nothing happens until it is awaited or batched.
function write(kind: Write["kind"]) {
  const record: Write = { kind };
  const chain = {
    record,
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
    insert: () => write("insert"),
    update: () => write("update"),
    delete: () => write("delete"),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (owned ? [{ id: "addr_1" }] : []) }) }) }),
    batch: async (writes: { record: Write }[]) => {
      batches.push(writes.map(({ record }) => record));
    },
  }),
}));

// Load actions after mocks; static imports would initialize the real Clerk and database modules.
const { deleteAddress, saveAddress, setDefaultAddress } = await import("@/server/actions/addresses");

/** The values a WHERE clause is bound to, e.g. ["addr_1", "user_owner"]. */
const bound = (record: Write) => (record.where ? new PgDialect().sqlToQuery(record.where).params : []);

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

test("edits, removals and default changes only touch the signed-in user's own address", async () => {
  await assert.rejects(saveAddress(address({ id: "addr_1" })), toList);
  await deleteAddress(only("addr_1"));
  await setDefaultAddress(only("addr_1"));

  assert.deepEqual(ran.map((record) => [record.kind, bound(record)]), [
    ["update", ["addr_1", "user_owner"]],
    ["delete", ["addr_1", "user_owner"]],
  ]);
  const [[clear, promote]] = batches;
  assert.deepEqual([clear.values, bound(clear)], [{ isDefault: false }, ["user_owner", true]]);
  assert.deepEqual([promote.values, bound(promote)], [{ isDefault: true }, ["addr_1", "user_owner"]]);
});

test("an address that is gone or someone else's leaves the current default alone", async () => {
  owned = false;
  await assert.rejects(saveAddress(address({ id: "addr_gone", isDefault: "on" })), toList);
  await setDefaultAddress(only("addr_gone"));
  assert.deepEqual([ran, batches], [[], []]);
});
```

How the fake database works, so you can debug it: `write(kind)` returns a chainable, awaitable object that only **records** `values`/`where`. Awaiting it pushes the record onto `ran`; passing it to `db.batch([...])` pushes the group onto `batches`. `bound(record)` renders the recorded Drizzle `WHERE` condition with `PgDialect().sqlToQuery(...)` and returns its bound parameters, which is how the tests check that every statement is scoped to the signed-in user without pinning SQL text.

**Verify**: `bun test --isolate --conditions=react-server tests/server/actions/addresses.test.ts` → `4 pass`, `1 fail`; the failing test is `an address that is gone or someone else's leaves the current default alone`. That failure is the bug.

### Step 2: Fix the bug

Replace `src/server/actions/addresses.ts` with:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
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

/** False for an address removed in another tab, or one that was never this user's. */
async function owns(userId: string, id: string) {
  const [address] = await getDb()
    .select({ id: addresses.id })
    .from(addresses)
    .where(mine(userId, id))
    .limit(1);
  return Boolean(address);
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
  // Nothing to update: writing anyway would clear the current default and set none.
  if (id && !(await owns(userId, id))) redirect("/account/addresses");

  const db = getDb();
  const write = id
    ? db.update(addresses).set(values).where(mine(userId, id))
    : db.insert(addresses).values({ ...values, clerkUserId: userId });

  // The partial unique index allows one default per user, so the old one is
  // cleared in the same batch (one transaction) before the new one is set.
  const clearDefault = db
    .update(addresses)
    .set({ isDefault: false })
    .where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true)));
  if (values.isDefault) await db.batch([clearDefault, write]);
  else await write;

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
  // Same guard as saveAddress: only swap the default when there is a row to give it to.
  if (await owns(userId, id)) {
    await db.batch([
      db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true))),
      db.update(addresses).set({ isDefault: true }).where(mine(userId, id)),
    ]);
  }
  refresh();
}
```

Changes versus today: the new `owns()` helper; one guard line in `saveAddress` (an edit of a missing address goes straight back to the list, writing nothing — the same destination as before, minus the cleared default); `setDefaultAddress` reads the id once and only runs the batch when the address is the user's. `deleteAddress` is unchanged.

**Verify**: `bun test --isolate --conditions=react-server tests/server/actions/addresses.test.ts` → `5 pass`, `0 fail`.

### Step 3: Add the checkout tests

Create `tests/server/actions/checkout.test.ts`:

```ts
import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import type { CartLine } from "@/lib/cart";

const kettle = { id: "kettle", name: "Kettle", description: "Boils water", category: "Kitchen appliances", image: "/products/kettle.webp", color: "#d6d4cd", price: 49 };
const home = { id: "addr_1", clerkUserId: "user_member", name: "Ada Lovelace", line1: "1 Main St", line2: null, city: "Dublin", postalCode: "D01", country: "IE", isDefault: true, createdAt: new Date() };

type Params = Record<string, unknown>;

let lines: CartLine[] = [];
let user: { id: string; primaryEmailAddress: { emailAddress: string }; privateMetadata: Record<string, unknown> } | null = null;
let defaultAddress: typeof home | null = null;
let savedCustomerExists = true;
let sessions: Params[] = [];
let customerUpdates: [string, Params][] = [];
let customerCreates: Params[] = [];
let metadataWrites: [string, Params][] = [];

beforeEach(() => {
  lines = [{ product: kettle, quantity: 1 }];
  user = null;
  defaultAddress = null;
  savedCustomerExists = true;
  sessions = [];
  customerUpdates = [];
  customerCreates = [];
  metadataWrites = [];
});

mock.module("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: user?.id ?? null }),
  currentUser: async () => user,
  clerkClient: async () => ({ users: { updateUserMetadata: async (id: string, update: Params) => {
    metadataWrites.push([id, update]);
  } } }),
}));
mock.module("next/headers", () => ({
  headers: async () => new Headers({ host: "shop.example", "x-forwarded-proto": "https" }),
}));
// The real redirect() throws to stop the action; so does this one, with the target in the message.
mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
mock.module("@/server/queries/cart", () => ({ getCartLines: async () => lines }));
mock.module("@/server/db", () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: async () => (defaultAddress ? [defaultAddress] : []) }) }) }),
}));
mock.module("@/server/services/stripe", () => ({
  getStripe: () => ({
    customers: {
      update: async (id: string, params: Params) => {
        // What Stripe answers for a customer deleted in the dashboard or made under another key.
        if (!savedCustomerExists) throw Object.assign(new Error("No such customer"), { code: "resource_missing" });
        customerUpdates.push([id, params]);
        return { id };
      },
      create: async (params: Params) => {
        customerCreates.push(params);
        return { id: "cus_new" };
      },
    },
    checkout: { sessions: { create: async (params: Params) => {
      sessions.push(params);
      return { url: "https://checkout.stripe.example/session" };
    } } },
  }),
}));

// Load the action after mocks; static imports would initialize the real Clerk and Stripe modules.
const { startCheckout } = await import("@/server/actions/checkout");

const toStripe = /REDIRECT https:\/\/checkout\.stripe\.example\/session/;
const shippingOf = (session: Params) =>
  (session.shipping_options as { shipping_rate_data: { display_name: string; fixed_amount: { amount: number; currency: string } } }[])[0].shipping_rate_data;

test("an empty cart never reaches Stripe", async () => {
  lines = [];
  assert.equal(await startCheckout(), undefined);
  assert.deepEqual(sessions, []);
});

test("a guest pays catalog prices plus flat shipping and returns through the paid check", async () => {
  await assert.rejects(startCheckout(), toStripe);

  const [session] = sessions;
  assert.deepEqual(session.line_items, [{
    quantity: 1,
    price_data: { currency: "eur", unit_amount: 4900, product_data: { name: "Kettle", description: "Boils water" } },
  }]);
  assert.deepEqual(shippingOf(session), { type: "fixed_amount", display_name: "Standard shipping", fixed_amount: { amount: 495, currency: "eur" } });
  assert.equal(session.success_url, "https://shop.example/api/checkout/return?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(session.cancel_url, "https://shop.example/cart", "a cancelled checkout keeps the cart");
  assert.equal(session.customer, undefined);
  assert.equal(session.customer_email, undefined, "Checkout asks a guest for their email");
  assert.deepEqual(session.payment_intent_data, { receipt_email: undefined, metadata: { clerkUserId: "" } });
});

test("an order from €60 ships free", async () => {
  lines = [{ product: kettle, quantity: 2 }];
  await assert.rejects(startCheckout(), toStripe);
  assert.deepEqual(shippingOf(sessions[0]).fixed_amount, { amount: 0, currency: "eur" });
  assert.equal(shippingOf(sessions[0]).display_name, "Free shipping");
});

test("a member without a saved address is tied to the payment by id and email", async () => {
  user = { id: "user_member", primaryEmailAddress: { emailAddress: "ada@example.com" }, privateMetadata: {} };
  await assert.rejects(startCheckout(), toStripe);

  assert.equal(sessions[0].customer, undefined);
  assert.equal(sessions[0].customer_email, "ada@example.com");
  assert.deepEqual(sessions[0].payment_intent_data, { receipt_email: "ada@example.com", metadata: { clerkUserId: "user_member" } });
  assert.deepEqual([customerUpdates, customerCreates], [[], []], "no Stripe customer without an address to pre-fill");
});

test("a member's default address and phone pre-fill Checkout through their saved Stripe customer", async () => {
  user = { id: "user_member", primaryEmailAddress: { emailAddress: "ada@example.com" }, privateMetadata: { stripeCustomerId: "cus_saved", phone: "+353 1 234 5678" } };
  defaultAddress = home;
  await assert.rejects(startCheckout(), toStripe);

  assert.deepEqual(customerUpdates, [["cus_saved", {
    email: "ada@example.com",
    phone: "+353 1 234 5678",
    shipping: { name: "Ada Lovelace", address: { line1: "1 Main St", line2: "", city: "Dublin", postal_code: "D01", country: "IE" } },
  }]]);
  assert.equal(sessions[0].customer, "cus_saved");
  assert.ok(!("customer_email" in sessions[0]), "Stripe rejects a session with both customer and customer_email");
  assert.deepEqual([customerCreates, metadataWrites], [[], []]);
});

test("a saved Stripe customer that no longer exists is replaced and remembered", async () => {
  user = { id: "user_member", primaryEmailAddress: { emailAddress: "ada@example.com" }, privateMetadata: { stripeCustomerId: "cus_deleted" } };
  defaultAddress = home;
  savedCustomerExists = false;
  await assert.rejects(startCheckout(), toStripe);

  assert.equal(customerCreates.length, 1);
  assert.deepEqual(customerCreates[0].metadata, { clerkUserId: "user_member" });
  assert.equal(customerCreates[0].phone, "", "an empty phone clears a number removed from the profile");
  assert.deepEqual(metadataWrites, [["user_member", { privateMetadata: { stripeCustomerId: "cus_new" } }]]);
  assert.equal(sessions[0].customer, "cus_new");
});
```

**Verify**: `bun test --isolate --conditions=react-server tests/server/actions/checkout.test.ts` → `6 pass`, `0 fail`.

### Step 4: Add the cart action tests

Create `tests/server/actions/cart.test.ts`:

```ts
import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";

let cookie: string | undefined;
let options: Record<string, unknown> | undefined;

beforeEach(() => {
  cookie = undefined;
  options = undefined;
});

mock.module("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookie === undefined ? undefined : { value: cookie }),
    set: (_name: string, value: string, cookieOptions: Record<string, unknown>) => {
      cookie = value;
      options = cookieOptions;
    },
    delete: () => {
      cookie = undefined;
    },
  }),
}));
// The real redirect() throws to stop the action; so does this one, with the target in the message.
mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
mock.module("@/server/queries/products", () => ({
  getProduct: async (id: string) => (id === "kettle" ? { id: "kettle" } : undefined),
}));

// Load actions after mocks; static imports would initialize the real cookie store and database.
const { addToCart, clearCart, updateCart } = await import("@/server/actions/cart");

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const cart = () => (cookie === undefined ? undefined : JSON.parse(cookie));

test("adding stores catalog products in a script-proof cookie and reports whether anything changed", async () => {
  assert.equal(await addToCart(form({ id: "no-such-product" })), false, "only catalog products can be added");
  assert.equal(await addToCart(form({})), false);
  assert.equal(cookie, undefined);

  assert.equal(await addToCart(form({ id: "kettle" })), true);
  assert.equal(await addToCart(form({ id: "kettle" })), true);
  assert.deepEqual(cart(), { kettle: 2 });
  assert.deepEqual(options, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });

  cookie = JSON.stringify({ kettle: 99 });
  assert.equal(await addToCart(form({ id: "kettle" })), false, "a full line is not a successful add");
  assert.deepEqual(cart(), { kettle: 99 });
});

test("quantity changes ignore junk and can remove lines for products that left the catalog", async () => {
  cookie = JSON.stringify({ kettle: 2, retired: 1 });
  for (const delta of ["0", "1.5", "abc", ""]) await updateCart(form({ id: "kettle", delta }));
  assert.deepEqual(cart(), { kettle: 2, retired: 1 });

  await updateCart(form({ id: "kettle", delta: "-1" }));
  await updateCart(form({ id: "retired", delta: "-1" }));
  assert.deepEqual(cart(), { kettle: 1 });

  await updateCart(form({ id: "retired", delta: "1" }));
  assert.deepEqual(cart(), { kettle: 1 }, "but never add them back");
});

test("a changed cart redirects only to the cart page", async () => {
  cookie = JSON.stringify({ kettle: 1 });
  await assert.rejects(updateCart(form({ id: "kettle", delta: "1", next: "/cart" })), /REDIRECT \/cart$/);
  await updateCart(form({ id: "kettle", delta: "1", next: "https://evil.example" }));
  await updateCart(form({ id: "kettle", delta: "0", next: "/cart" }));
  assert.deepEqual(cart(), { kettle: 3 });
});

test("clearing empties the cart", async () => {
  cookie = JSON.stringify({ kettle: 1 });
  await clearCart();
  assert.equal(cookie, undefined);
});
```

**Verify**: `bun test --isolate --conditions=react-server tests/server/actions/cart.test.ts` → `4 pass`, `0 fail`.

### Step 5: Run the full gate

**Verify**: `bun run lint` → exit 0; `bunx tsc --noEmit` → exit 0; `bun run test` → `0 fail` (15 more passing tests than before this plan).

## Test plan

Three new files, 15 tests, all given in full above and run by the advisor against `a89aea0` (`15 pass` with the Step 2 fix; the "gone or someone else's" test fails without it).

- `addresses.test.ts` (5): unauthenticated and invalid input write nothing; a new address is stored trimmed under the signed-in user; a new default clears the old one in one batch; edit/delete/set-default statements are bound to `[id, userId]`; a missing/foreign id leaves the default alone (**the regression test**).
- `checkout.test.ts` (6): empty cart never reaches Stripe; guest session (catalog prices in cents, €4.95 shipping, return/cancel URLs, empty `clerkUserId`); free shipping from €60; member without address (`customer_email` + `receipt_email`); member with default address (customer updated with shipping and phone, `customer` set, no `customer_email`); a deleted saved Stripe customer is recreated and stored in Clerk private metadata.
- `cart.test.ts` (4): only catalog products can be added, cookie flags, full line is not a successful add; junk deltas ignored, retired products can be removed but not re-added; redirect only to the literal `/cart`; clear.

## Done criteria

- [ ] `bun test --isolate --conditions=react-server tests/server/actions` → `0 fail`, and the three new files report 5, 6 and 4 passing tests
- [ ] `bun run test` → `0 fail`
- [ ] `bun run lint` and `bunx tsc --noEmit` exit 0
- [ ] `git status --short` lists only the four in-scope files (and `plans/`)
- [ ] `git diff --stat -- src/server/actions/checkout.ts src/server/actions/cart.ts` → no output
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- In Step 1 the test run is not exactly "4 pass, 1 fail" with the named failing test — the code under test is not what this plan was written against.
- A checkout or cart test fails. Those actions are not being changed, so a failure means behaviour drifted since `a89aea0`; report the assertion and the actual value instead of editing the test or the action.
- `new PgDialect().sqlToQuery(...)` throws or returns parameters in a different order than `["addr_1", "user_owner"]` — the installed `drizzle-orm` (0.45.4 at planning time) changed; do not rewrite the assertions to match blindly.
- Making a test pass seems to require changing `checkout.ts` or `cart.ts`.

## Maintenance notes

- The address tests check which statements run and what their `WHERE` clauses are bound to; they do not execute SQL. The one-default **database** invariant is still enforced only by the partial unique index `addresses_one_default_idx`.
- `owns()` adds one indexed read before an edit or default change. There is a tiny window in which the address could be deleted between the check and the batch; the outcome is the old behaviour (default cleared), which needs two tabs racing within milliseconds.
- If `startCheckout` gains parameters (coupons, tax, a new shipping tier), extend `checkout.test.ts` in the same style: assert on the object passed to `checkout.sessions.create`.
- Reviewer: the fake `getDb()` in each test mirrors the exact call chain the action uses (`select().from().where()` in checkout, `…where().limit()` in addresses). If an action's query shape changes, its test's fake must change with it — a `TypeError: … is not a function` from a test is that, not a product bug.
