# Plan 002: Every paid order gets its confirmation email, and email problems never break payment sync

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- src/app/api/webhooks/stripe/route.ts src/server/services/resend.ts src/server/emails/order.ts tests/app/api/webhooks/stripe/route.test.ts README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S–M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

Two defects sit in the Stripe webhook's email step, and its success path has no tests.

1. **Guests never get the order email.** Checkout only sets the payment's `receipt_email` from the signed-in Clerk user. The webhook only sends when `receipt_email` is set. A guest types their email into Stripe Checkout, pays, and the success page tells them "We charged €X and emailed you@…" — but nothing is sent. Stripe's docs confirm a PaymentIntent's `receipt_email` stays empty unless the integration sets it.
2. **An unconfigured Resend turns every paid webhook into a 500.** The README says every integration except Clerk and the database is optional ("an empty variable disables its integration"). With `RESEND_API_KEY` or `RESEND_FROM_EMAIL` empty, `sendEmail` throws after the payment row is already written, the route answers 500, and Stripe retries each event for days and flags the endpoint as failing.

After this plan: the webhook looks up the Checkout Session itself, emails members and guests alike (guests without the "View your order" link, since they have no order page), acknowledges with 200 when email is switched off, still fails loudly when a configured Resend errors (so Stripe retries), and all of that is covered by tests.

## Current state

- `src/server/actions/checkout.ts:54-56,74-77` — the only place `receipt_email` is set; `email` is `undefined` for guests. **Not modified by this plan** (the guest's address is unknown until they type it into Stripe).

  ```ts
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const email = user?.primaryEmailAddress?.emailAddress;
  // …
      payment_intent_data: {
        receipt_email: email,
        metadata: { clerkUserId: userId ?? "" },
      },
  ```

- `src/app/api/webhooks/stripe/route.ts:80-115` — the email step being replaced:

  ```ts
  if (
    intent.status === "succeeded" &&
    intent.receipt_email &&
    !payment.confirmationEmailSentAt
  ) {
    // Same lookup as the order page; a payment with no Clerk user still gets its total.
    const [order] = intent.metadata.clerkUserId
      ? await getOrders(intent.metadata.clerkUserId, orderNumber(intent.id))
      : [];
    const receipt = orderEmail(
      "confirmed",
      order ?? { /* number, amount, currency, createdAt, items: [], subtotal: null, … */ },
      new URL(request.url).origin,
    );

    await sendEmail(
      { to: intent.receipt_email, ...receipt },
      `payment-confirmation/${intent.id}`,
    );

    await db
      .update(payments)
      .set({ confirmationEmailSentAt: new Date() })
      .where(eq(payments.id, intent.id));
  }
  ```

- `src/server/services/resend.ts` — `getResend()` throws `RESEND_API_KEY is not configured`; `sendEmail()` throws `RESEND_FROM_EMAIL is not configured`. There is no way to ask "is email configured?" without catching.
- `src/server/emails/order.ts:73` — `export function orderEmail(step: OrderStep, order: OrderDetails, origin: string)`. It always renders a "View your order →" button (HTML, lines 156-160) and a `View your order: <url>` line (plain text, line 184) pointing at `/orders/<number>`, a sign-in-only page.
- `src/server/queries/orders.ts` — `getOrders(userId, number?)` returns orders for one Clerk user and does the Stripe Checkout Session lookup the email needs. It cannot see guest payments (they have no user id). **Not modified by this plan**; the webhook stops calling it and keeps importing only `orderNumber` from it.
- `src/app/(store)/checkout/success/page.tsx:59-60` — the "and emailed …" sentence. Not modified: after this plan it is true.
- `tests/app/api/webhooks/stripe/route.test.ts` — 4 tests: valid/invalid/missing signature and "an intent Stripe doesn't know". Nothing exercises the database write or the email.

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
- `src/server/services/resend.ts`
- `src/server/emails/order.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `tests/app/api/webhooks/stripe/route.test.ts`
- `README.md` — the two edits in Step 5 only

**Out of scope** (do NOT touch, even though they look related):
- `src/server/actions/checkout.ts` — do not set `receipt_email` for guests there; it cannot know the address.
- `src/server/queries/orders.ts` — untested and used by the order pages; refactoring it to share the session mapping is not worth the risk here.
- `src/server/actions/order-status.ts` — the dev-only simulator keeps its own `sendEmail` call and keeps throwing when Resend is unset (a developer wants to see that).
- `src/app/(store)/checkout/success/page.tsx`.
- The database schema. `payments.receipt_email` keeps mirroring Stripe's `receipt_email` (null for guests).

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested message: `fix(webhook): email guest orders and acknowledge payments when Resend is unset`

## Steps

### Step 1: Let callers ask whether email is configured

Replace `src/server/services/resend.ts` with:

```ts
import "server-only";

import { Resend } from "resend";

/** False while either Resend variable is empty: email is switched off, not broken. */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

export async function sendEmail(
  email: { to: string; subject: string; text: string; html?: string },
  idempotencyKey?: string,
) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const { error } = await getResend().emails.send(
    { from, ...email },
    { idempotencyKey },
  );

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
```

The only change is the new exported `isEmailConfigured()`.

**Verify**: `bunx tsc --noEmit` → exit 0.

### Step 2: Let the order email omit the account link

In `src/server/emails/order.ts`, add a fourth parameter `account = true` to `orderEmail` and use it in exactly two places: the HTML button table and the plain-text link line. Existing three-argument callers keep today's output.

```diff
--- a/src/server/emails/order.ts
+++ b/src/server/emails/order.ts
@@ -70,6 +70,9 @@ const escape = (value: string) =>
   value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
 
-/** The email for one order step (paid, shipped, delivered): HTML plus a plain-text fallback. */
-export function orderEmail(step: OrderStep, order: OrderDetails, origin: string) {
+/**
+ * The email for one order step (paid, shipped, delivered): HTML plus a plain-text fallback.
+ * `account` is false for guest checkouts: they have no /orders page, so the link is left out.
+ */
+export function orderEmail(step: OrderStep, order: OrderDetails, origin: string, account = true) {
   const { heading, intro, address: addressLabel, subject } = copy[step];
   const reached = steps.indexOf(step);
@@ -154,9 +157,13 @@ export function orderEmail(step: OrderStep, order: OrderDetails, origin: string)
               : ""
           }
-          <table role="presentation" cellpadding="0" cellspacing="0" class="cta" style="margin-top:32px">
+          ${
+            account
+              ? `<table role="presentation" cellpadding="0" cellspacing="0" class="cta" style="margin-top:32px">
             <tr><td class="btn" style="background:${color.button};border-radius:6px">
               <a href="${escape(orderUrl)}" style="display:inline-block;padding:12px 24px;font-size:16px;line-height:24px;color:${color.text};font-weight:600;text-decoration:none">View your order →</a>
             </td></tr>
-          </table>
+          </table>`
+              : ""
+          }
         </td></tr>
         <tr><td class="mu inset" style="padding:24px 32px 0;font-size:13px;line-height:20px;${muted}">
@@ -181,6 +188,5 @@ export function orderEmail(step: OrderStep, order: OrderDetails, origin: string)
     `Total paid: ${money(order.amount)}`,
     ...(shipTo.length ? ["", `${addressLabel}:`, ...shipTo] : []),
-    "",
-    `View your order: ${orderUrl}`,
+    ...(account ? ["", `View your order: ${orderUrl}`] : []),
     "",
     "nstore",
```

**Verify**: `bun test --isolate --conditions=react-server tests/server/emails` → `3 pass`, `0 fail` (existing tests, unchanged behaviour).

### Step 3: Rewrite the webhook's email step

Replace `src/app/api/webhooks/stripe/route.ts` with the file below. Everything up to and including the `.returning({ … })` upsert is unchanged; the import of `getOrders` goes away, `isEmailConfigured` comes in, and the block after the upsert is new.

```ts
import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { orderEmail } from "@/server/emails/order";
import { orderNumber } from "@/server/queries/orders";
import { isEmailConfigured, sendEmail } from "@/server/services/resend";
import { getStripe } from "@/server/services/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.data.object.object !== "payment_intent") {
    return Response.json({ received: true });
  }

  let intent;

  try {
    intent = await stripe.paymentIntents.retrieve(event.data.object.id);
  } catch (error) {
    // An intent Stripe doesn't know can never sync; acknowledge so Stripe stops retrying.
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") {
      return Response.json({ received: true });
    }
    throw error;
  }

  const db = getDb();
  const [payment] = await db
    .insert(payments)
    .values({
      id: intent.id,
      clerkUserId: intent.metadata.clerkUserId || null,
      status: intent.status,
      amount: intent.amount_received,
      currency: intent.currency,
      receiptEmail: intent.receipt_email,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: payments.id,
      set: {
        clerkUserId: intent.metadata.clerkUserId || null,
        status: intent.status,
        amount: intent.amount_received,
        currency: intent.currency,
        receiptEmail: intent.receipt_email,
        updatedAt: new Date(),
      },
    })
    .returning({
      confirmationEmailSentAt: payments.confirmationEmailSentAt,
    });

  if (intent.status === "succeeded" && !payment.confirmationEmailSentAt) {
    if (!isEmailConfigured()) {
      // An empty Resend variable switches email off. The payment is recorded, so
      // acknowledge: a 500 here would make Stripe retry for days for nothing.
      console.warn(`Resend is not configured; no confirmation email for ${intent.id}`);
      return Response.json({ received: true });
    }

    // Straight from Stripe rather than getOrders, which only sees payments tied
    // to a Clerk user: guests paid too. A failed lookup throws, so Stripe retries.
    const { data: [session] } = await stripe.checkout.sessions.list({
      payment_intent: intent.id,
      limit: 1,
      expand: ["data.line_items"],
    });
    // Only signed-in checkouts set receipt_email; a guest typed theirs into Checkout.
    const to = intent.receipt_email ?? session?.customer_details?.email;

    if (to) {
      const receipt = orderEmail(
        "confirmed",
        {
          number: orderNumber(intent.id),
          amount: intent.amount_received,
          currency: intent.currency,
          createdAt: new Date(intent.created * 1000),
          // Empty and null when the payment did not come from Checkout; the total still shows.
          items: (session?.line_items?.data ?? []).map((item) => ({
            id: item.id,
            name: item.description,
            quantity: item.quantity,
            amount: item.amount_total,
            currency: item.currency,
            product: undefined,
          })),
          subtotal: session?.amount_subtotal ?? null,
          shipping: session?.shipping_cost?.amount_total ?? null,
          tax: session?.total_details?.amount_tax ?? 0,
          discount: session?.total_details?.amount_discount ?? 0,
          shipTo: session?.collected_information?.shipping_details ?? null,
        },
        new URL(request.url).origin,
        Boolean(intent.metadata.clerkUserId),
      );

      await sendEmail({ to, ...receipt }, `payment-confirmation/${intent.id}`);

      await db
        .update(payments)
        .set({ confirmationEmailSentAt: new Date() })
        .where(eq(payments.id, intent.id));
    }
  }

  return Response.json({ received: true });
}
```

Behaviour to preserve — do not "simplify" any of these:
- The Resend check comes **after** the upsert: the payment is always recorded.
- When email is off the route returns 200 and does **not** set `confirmationEmailSentAt`, so a later delivery can still send once Resend is configured.
- The session lookup has no `.catch`: a Stripe outage must fail the delivery so Stripe retries, instead of sending an email with no line items and marking it sent.
- `sendEmail` errors propagate (500 → Stripe retries); the Resend idempotency key `payment-confirmation/<intent id>` makes retries and concurrent deliveries safe.

**Verify**: `bunx tsc --noEmit` → exit 0. `bun run lint` → exit 0.

### Step 4: Replace the webhook test file

Replace `tests/app/api/webhooks/stripe/route.test.ts` with:

```ts
import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import Stripe from "stripe";

process.env.STRIPE_SECRET_KEY = "sk_test_nstore";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_nstore";

// What Stripe, Postgres and Resend hold; each test sets these, the route reads them.
let intent: Record<string, unknown> | null = null; // null: an intent Stripe doesn't know
let session: Record<string, unknown> | null = null; // null: a payment made outside Checkout
let row: { confirmationEmailSentAt: Date | null } = { confirmationEmailSentAt: null };
let upserts: Record<string, unknown>[] = [];
let sent: { to: string; subject: string; html: string; text: string; key?: string }[] = [];
let emailConfigured = true;
let failSend = false;

beforeEach(() => {
  intent = null;
  session = null;
  row = { confirmationEmailSentAt: null };
  upserts = [];
  sent = [];
  emailConfigured = true;
  failSend = false;
});

// Real signature checks; only the lookups are stubbed.
mock.module("@/server/services/stripe", () => ({
  getStripe: () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    stripe.paymentIntents.retrieve = (async () => {
      if (intent) return intent;
      throw new Stripe.errors.StripeInvalidRequestError({
        type: "invalid_request_error",
        code: "resource_missing",
        message: "No such payment_intent",
      });
    }) as never;
    stripe.checkout.sessions.list = (async () => ({ data: session ? [session] : [] })) as never;
    return stripe;
  },
}));
mock.module("@/server/services/resend", () => ({
  isEmailConfigured: () => emailConfigured,
  sendEmail: async (email: { to: string; subject: string; html: string; text: string }, key?: string) => {
    if (failSend) throw new Error("Resend failed: unavailable");
    sent.push({ ...email, key });
  },
}));
// One payments row: the upsert returns it, the update stamps it.
mock.module("@/server/db", () => ({
  getDb: () => ({
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            upserts.push(values);
            return [{ ...row }];
          },
        }),
      }),
    }),
    update: () => ({
      set: (values: { confirmationEmailSentAt: Date }) => ({
        where: async () => {
          row = { ...row, ...values };
        },
      }),
    }),
  }),
}));

const { POST } = await import("@/app/api/webhooks/stripe/route");

const payload = JSON.stringify({
  id: "evt_nstore",
  object: "event",
  type: "customer.created",
  data: { object: { id: "cus_nstore", object: "customer" } },
});

function sign(body: string) {
  return new Stripe(process.env.STRIPE_SECRET_KEY!).webhooks.generateTestHeaderStringAsync({
    payload: body,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
}

function webhook(headers: HeadersInit = {}, body = payload) {
  return POST(
    new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers, body }),
  );
}

/** A signed `payment_intent.succeeded` delivery for whatever `intent` currently is. */
async function deliver() {
  const body = JSON.stringify({
    id: "evt_paid",
    object: "event",
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_3TestAB12CD34", object: "payment_intent" } },
  });
  return webhook({ "stripe-signature": await sign(body) }, body);
}

const paid = {
  id: "pi_3TestAB12CD34",
  status: "succeeded",
  amount_received: 6495,
  currency: "eur",
  created: 1_790_000_000,
};
const checkout = {
  amount_subtotal: 6000,
  shipping_cost: { amount_total: 495 },
  total_details: { amount_tax: 0, amount_discount: 0 },
  customer_details: { email: "guest@example.com" },
  collected_information: { shipping_details: null },
  line_items: { data: [{ id: "li_1", description: "Cream Electric Kettle", quantity: 2, amount_total: 6000, currency: "eur" }] },
};

test("accepts a valid signature", async () => {
  assert.equal((await webhook({ "stripe-signature": await sign(payload) })).status, 200);
  assert.deepEqual(upserts, [], "events that are not payment intents write nothing");
});

test("acknowledges a payment intent Stripe doesn't know", async () => {
  const response = await deliver();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true });
  assert.deepEqual(upserts, []);
});

test("rejects an invalid signature", async () => {
  assert.equal((await webhook({ "stripe-signature": "invalid" })).status, 400);
});

test("rejects a missing signature", async () => {
  assert.equal((await webhook()).status, 400);
});

test("a paid member order is recorded and emailed once, however often Stripe redelivers", async () => {
  intent = { ...paid, receipt_email: "member@example.com", metadata: { clerkUserId: "user_member" } };
  session = checkout;

  assert.equal((await deliver()).status, 200);
  assert.equal(upserts.length, 1);
  assert.deepEqual(
    { ...upserts[0], updatedAt: undefined },
    { id: paid.id, clerkUserId: "user_member", status: "succeeded", amount: 6495, currency: "eur", receiptEmail: "member@example.com", updatedAt: undefined },
  );
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "member@example.com");
  assert.equal(sent[0].key, `payment-confirmation/${paid.id}`, "Resend dedupes concurrent deliveries on this key");
  assert.ok(sent[0].text.includes("Cream Electric Kettle × 2"), "line items come from the Checkout Session");
  assert.ok(sent[0].text.includes("http://localhost/orders/ab12cd34"), "members get a link to their order");
  assert.ok(row.confirmationEmailSentAt instanceof Date);

  assert.equal((await deliver()).status, 200);
  assert.equal(upserts.length, 2, "a redelivery still syncs the payment");
  assert.equal(sent.length, 1, "but never sends a second email");
});

test("a guest order is emailed to the address typed into Checkout, without an account link", async () => {
  intent = { ...paid, receipt_email: null, metadata: {} };
  session = checkout;

  assert.equal((await deliver()).status, 200);
  assert.equal(upserts[0].clerkUserId, null);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "guest@example.com");
  assert.ok(sent[0].text.includes("Total paid: €64.95"));
  assert.ok(!sent[0].html.includes("/orders/") && !sent[0].text.includes("/orders/"), "guests have no order page");
  assert.ok(row.confirmationEmailSentAt instanceof Date);
});

test("unpaid, unaddressed and email-disabled payments are recorded without an email", async () => {
  intent = { ...paid, status: "processing", amount_received: 0, receipt_email: "member@example.com", metadata: { clerkUserId: "user_member" } };
  session = checkout;
  assert.equal((await deliver()).status, 200);
  assert.equal(upserts[0].status, "processing");

  // Paid outside Checkout with no receipt address: nobody to write to.
  intent = { ...paid, receipt_email: null, metadata: {} };
  session = null;
  assert.equal((await deliver()).status, 200);

  // README: an empty Resend variable disables email. Stripe must still get a 200.
  intent = { ...paid, receipt_email: "member@example.com", metadata: { clerkUserId: "user_member" } };
  session = checkout;
  emailConfigured = false;
  assert.equal((await deliver()).status, 200);

  assert.equal(upserts.length, 3, "every delivery is recorded");
  assert.deepEqual(sent, []);
  assert.equal(row.confirmationEmailSentAt, null, "so a later delivery can still send it");
});

test("a failed send fails the delivery, so Stripe retries and the email is not marked sent", async () => {
  intent = { ...paid, receipt_email: "member@example.com", metadata: { clerkUserId: "user_member" } };
  session = checkout;
  failSend = true;

  await assert.rejects(deliver(), /Resend failed/);
  assert.equal(upserts.length, 1, "the payment itself is already recorded");
  assert.equal(row.confirmationEmailSentAt, null);

  failSend = false;
  assert.equal((await deliver()).status, 200);
  assert.equal(sent.length, 1);
});
```

The 4 original tests are kept (two gain an assertion that nothing is written); 4 are new.

**Verify**: `bun test --isolate --conditions=react-server tests/app/api/webhooks` → `8 pass`, `0 fail`. One line `Resend is not configured; no confirmation email for pi_3TestAB12CD34` in the output is expected.

### Step 5: Update `README.md`

1. In the "Implemented" list, replace the bullet

   `- Idempotent Resend confirmation emails for paid orders, using one branded HTML and plain-text template that also covers the shipped and delivered steps`

   with

   `- Idempotent Resend confirmation emails for paid orders, members and guests alike (guests at the address they give Stripe Checkout, without the account link), using one branded HTML and plain-text template that also covers the shipped and delivered steps`

2. In the "Environment" section, after the paragraph ending `…server code throws a named error instead of\nfailing silently.`, add a new paragraph:

   ```markdown
   The Stripe webhook is the exception: with Resend unset it still records the
   payment, logs that the confirmation email was skipped, and answers 200 so Stripe
   does not retry.
   ```

**Verify**: `grep -c "members and guests alike" README.md` → `1`; `grep -c "The Stripe webhook is the exception" README.md` → `1`

### Step 6: Run the full gate

**Verify**: `bun run lint` → exit 0; `bunx tsc --noEmit` → exit 0; `bun run test` → `0 fail`; `bun run build` → exit 0 (needs `.env.local`).

## Test plan

All in `tests/app/api/webhooks/stripe/route.test.ts` (Step 4 gives the full file). It follows the repo's existing pattern (`tests/server/actions/returns.test.ts`): module-level `let` state, `mock.module(...)` for `@/server/services/stripe`, `@/server/services/resend` and `@/server/db`, then `await import(...)` of the route. Signatures are real (signed with the Stripe SDK). New cases:

- a paid member order is upserted and emailed once; a redelivery upserts again but sends nothing
- a guest order is emailed to the Checkout address, with no `/orders/` link in HTML or text
- `processing` payments, payments with no address anywhere, and "Resend unset" all return 200, write the payment, send nothing, and leave `confirmationEmailSentAt` null
- a failing send rejects (so Stripe retries), leaves `confirmationEmailSentAt` null, and the retry sends

The advisor ran this exact code against `a89aea0` in a scratch clone: `8 pass, 0 fail`; lint and `tsc` clean.

## Done criteria

- [ ] `bun test --isolate --conditions=react-server tests/app/api/webhooks` → `8 pass`, `0 fail`
- [ ] `bun run test` → `0 fail`
- [ ] `bun run lint` and `bunx tsc --noEmit` exit 0
- [ ] `grep -cE "getOrders\(|import .*getOrders" src/app/api/webhooks/stripe/route.ts` → `0` (no import or call; the one remaining mention is in a comment)
- [ ] `grep -c "isEmailConfigured" src/app/api/webhooks/stripe/route.ts` → `2`
- [ ] `git status --short` lists only the five in-scope files (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/app/api/webhooks/stripe/route.ts` no longer matches the "Current state" excerpt (someone changed the email step).
- `tsc` rejects `session?.collected_information?.shipping_details` or `session?.line_items` — the installed Stripe SDK (22.6.2 at planning time) changed shape. `src/server/queries/orders.ts:91` reads the same fields; do not invent replacements.
- Any test outside `tests/app/api/webhooks` fails after Step 3 — something else imported `getOrders` behaviour from the route.
- You find yourself editing `checkout.ts` or `orders.ts`.

## Maintenance notes

- The mapping from Checkout Session to email fields now exists twice: here and in `src/server/queries/orders.ts:80-97`. If orders and line items are ever persisted in the database (three code comments already point that way), both collapse into a read from that table.
- The email's order date is now Stripe's `intent.created` for everyone; before, members got the `payments.created_at` row time. They differ by seconds.
- Pre-existing and unchanged: for signed-in customers `receipt_email` is set on the PaymentIntent, so in live mode Stripe may send its own receipt next to this email, depending on the account's email settings.
- If Resend is configured later, already-paid orders are not emailed retroactively unless Stripe redelivers an event for them.
- Reviewer: check that no `.catch` crept onto the session lookup or `sendEmail`, and that the 200-when-unset branch does not stamp `confirmationEmailSentAt`.
