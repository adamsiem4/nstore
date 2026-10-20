import assert from "node:assert/strict";
import { mock, test } from "bun:test";
import Stripe from "stripe";

process.env.STRIPE_SECRET_KEY = "sk_test_nstore";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_nstore";

// Real signature checks; only the PaymentIntent lookup is stubbed, as one Stripe doesn't know.
mock.module("@/server/services/stripe", () => ({
  getStripe: () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    stripe.paymentIntents.retrieve = async () => {
      throw new Stripe.errors.StripeInvalidRequestError({
        type: "invalid_request_error",
        code: "resource_missing",
        message: "No such payment_intent",
      });
    };
    return stripe;
  },
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

test("accepts a valid signature", async () => {
  assert.equal((await webhook({ "stripe-signature": await sign(payload) })).status, 200);
});

test("acknowledges a payment intent Stripe doesn't know", async () => {
  const unknown = JSON.stringify({
    id: "evt_unknown",
    object: "event",
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_unknown", object: "payment_intent" } },
  });
  const response = await webhook({ "stripe-signature": await sign(unknown) }, unknown);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true });
});

test("rejects an invalid signature", async () => {
  assert.equal((await webhook({ "stripe-signature": "invalid" })).status, 400);
});

test("rejects a missing signature", async () => {
  assert.equal((await webhook()).status, 400);
});
