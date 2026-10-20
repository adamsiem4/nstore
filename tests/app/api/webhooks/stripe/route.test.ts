import assert from "node:assert/strict";
import { test } from "bun:test";
import Stripe from "stripe";
import { POST } from "@/app/api/webhooks/stripe/route";

process.env.STRIPE_SECRET_KEY = "sk_test_nstore";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_nstore";

const payload = JSON.stringify({
  id: "evt_nstore",
  object: "event",
  type: "customer.created",
  data: { object: { id: "cus_nstore", object: "customer" } },
});

function webhook(headers: HeadersInit = {}) {
  return POST(
    new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers, body: payload }),
  );
}

test("accepts a valid signature", async () => {
  const signature = await new Stripe(
    process.env.STRIPE_SECRET_KEY!,
  ).webhooks.generateTestHeaderStringAsync({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  assert.equal((await webhook({ "stripe-signature": signature })).status, 200);
});

test("rejects an invalid signature", async () => {
  assert.equal((await webhook({ "stripe-signature": "invalid" })).status, 400);
});

test("rejects a missing signature", async () => {
  assert.equal((await webhook()).status, 400);
});
