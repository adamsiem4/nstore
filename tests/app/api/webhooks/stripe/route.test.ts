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

// Load the route after mocks; a static import would initialize the real Stripe, Resend and db modules.
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
