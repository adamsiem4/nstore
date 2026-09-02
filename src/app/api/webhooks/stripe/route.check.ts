import assert from "node:assert/strict";
import Stripe from "stripe";

import { POST } from "./route";

process.env.STRIPE_SECRET_KEY = "sk_test_nstore";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_nstore";

const payload = JSON.stringify({
  id: "evt_nstore",
  object: "event",
  type: "customer.created",
  data: { object: { id: "cus_nstore", object: "customer" } },
});
const signature = await new Stripe(
  process.env.STRIPE_SECRET_KEY,
).webhooks.generateTestHeaderStringAsync({
  payload,
  secret: process.env.STRIPE_WEBHOOK_SECRET,
});

const valid = await POST(
  new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  }),
);
assert.equal(valid.status, 200);

const invalid = await POST(
  new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "invalid" },
    body: payload,
  }),
);
assert.equal(invalid.status, 400);

const missing = await POST(
  new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: payload,
  }),
);
assert.equal(missing.status, 400);

console.log("ok — Stripe webhook signatures");
