import assert from "node:assert/strict";
import { mock, test } from "bun:test";

let userId = "user_owner";
let intent = {
  id: "pi_order",
  status: "succeeded",
  receipt_email: "owner@example.com",
  metadata: { clerkUserId: "user_owner" } as Record<string, string>,
};
const sent: { to: string; subject: string }[] = [];

mock.module("@clerk/nextjs/server", () => ({ auth: { protect: async () => ({ userId }) } }));
mock.module("next/cache", () => ({ refresh: () => {} }));
mock.module("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000" }) }));
mock.module("@/server/services/resend", () => ({ sendEmail: async (email: { to: string; subject: string }) => sent.push(email) }));
mock.module("@/server/services/stripe", () => ({
  getStripe: () => ({ paymentIntents: {
    retrieve: async () => intent,
    update: async (_id: string, { metadata }: { metadata: Record<string, string> }) => {
      // Stripe drops keys set to "".
      const merged = { ...intent.metadata, ...metadata };
      intent = { ...intent, metadata: Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== "")) };
      return intent;
    },
  } }),
}));
mock.module("@/server/queries/orders", () => ({
  orderNumber: (id: string) => id.slice(-8).toUpperCase(),
  getOrders: async () => [{
    number: "PI_ORDER", amount: 1000, currency: "eur", createdAt: new Date(), items: [], subtotal: null,
    shipping: null, tax: 0, discount: 0, shipTo: null, email: "owner@example.com",
  }],
}));

const { simulateOrderStep } = await import("@/server/actions/order-status");

function form(step: string, orderId = intent.id) {
  const data = new FormData();
  data.set("orderId", orderId);
  data.set("step", step);
  return data;
}

test("order simulation is development-only, owner-only, and walks the steps", async () => {
  await assert.rejects(simulateOrderStep(form("shipped")), /development-only/);
  Object.assign(process.env, { NODE_ENV: "development" });

  userId = "user_other";
  await assert.rejects(simulateOrderStep(form("shipped")), /Order not found/);
  userId = "user_owner";
  await assert.rejects(simulateOrderStep(form("teleported")), /Invalid step/);
  await assert.rejects(simulateOrderStep(form("shipped", "not-an-order")), /Invalid order/);
  assert.equal(sent.length, 0);

  await simulateOrderStep(form("shipped"));
  assert.equal(intent.metadata.fulfillment, "shipped");
  const shippedAt = intent.metadata.shippedAt;
  assert.ok(shippedAt);

  await simulateOrderStep(form("delivered"));
  assert.equal(intent.metadata.fulfillment, "delivered");
  assert.equal(intent.metadata.shippedAt, shippedAt, "delivery keeps the ship date");
  assert.ok(intent.metadata.deliveredAt);

  await simulateOrderStep(form("confirmed"));
  assert.equal(intent.metadata.fulfillment, "delivered", "resending the receipt keeps the step");

  assert.deepEqual(sent.map((email) => email.subject), [
    "Your nstore order PI_ORDER is on its way",
    "Your nstore order PI_ORDER has been delivered",
    "Your nstore order PI_ORDER",
  ]);
  assert.ok(sent.every((email) => email.to === "owner@example.com"));

  await simulateOrderStep(form("reset"));
  assert.deepEqual(intent.metadata, { clerkUserId: "user_owner" });
  assert.equal(sent.length, 3, "reset sends nothing");
});
