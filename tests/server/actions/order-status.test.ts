import assert from "node:assert/strict";
import { afterAll, mock, test } from "bun:test";

const originalNodeEnv = process.env.NODE_ENV;
afterAll(() => {
  if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: originalNodeEnv });
});

let userId: string | null = "user_owner";
let privateMetadata: Record<string, unknown> = { role: "admin", devToolsEnabled: true };
let intent = {
  id: "pi_order",
  status: "succeeded",
  receipt_email: "owner@example.com",
  metadata: { clerkUserId: "user_owner" } as Record<string, string>,
};
const sent: { to: string; subject: string }[] = [];

mock.module("@clerk/nextjs/server", () => ({
  auth: { protect: async () => {
    if (!userId) throw new Error("Unauthenticated");
    return { userId };
  } },
  currentUser: async () => userId ? ({ id: userId, privateMetadata }) : null,
  clerkClient: async () => ({ users: {
    updateUserMetadata: async (_id: string, update: { privateMetadata: Record<string, unknown> }) => {
      privateMetadata = { ...privateMetadata, ...update.privateMetadata };
    },
  } }),
}));
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

// Load actions after mocks; static imports would initialize real Clerk/Stripe modules.
const { simulateOrderStep } = await import("@/server/actions/order-status");
const { setDevToolsEnabled } = await import("@/server/actions/profile");

function form(step: string, orderId = intent.id) {
  const data = new FormData();
  data.set("orderId", orderId);
  data.set("step", step);
  return data;
}

test("order simulation is development-only, owner-only, and walks the steps", async () => {
  Object.assign(process.env, { NODE_ENV: "production" });
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

test("order simulation rejects customers and admins whose account switch is off", async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  privateMetadata = { devToolsEnabled: true };
  await assert.rejects(simulateOrderStep(form("shipped")), /not enabled/);

  privateMetadata = { role: "admin", devToolsEnabled: false };
  await assert.rejects(simulateOrderStep(form("shipped")), /not enabled/);

  privateMetadata = { role: "admin", devToolsEnabled: "true" };
  await assert.rejects(simulateOrderStep(form("shipped")), /not enabled/);
});

function devToolsForm(enabled: string) {
  const data = new FormData();
  data.set("enabled", enabled);
  return data;
}

test("the admin's saved switch gates subsequent order actions and cannot grant admin access", async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  userId = "user_owner";
  privateMetadata = { role: "admin" };
  await assert.rejects(simulateOrderStep(form("reset")), /not enabled/);

  await setDevToolsEnabled(devToolsForm("true"));
  await simulateOrderStep(form("reset"));
  await setDevToolsEnabled(devToolsForm("false"));
  await assert.rejects(simulateOrderStep(form("reset")), /not enabled/);
  await assert.rejects(setDevToolsEnabled(devToolsForm("yes")), /Invalid developer tools setting/);

  privateMetadata = { devToolsEnabled: true };
  const forged = devToolsForm("true");
  forged.set("role", "admin");
  await assert.rejects(setDevToolsEnabled(forged), /admin account/);
  await assert.rejects(simulateOrderStep(form("reset")), /not enabled/);

  privateMetadata = { role: "admin", devToolsEnabled: true };
  Object.assign(process.env, { NODE_ENV: "production" });
  await assert.rejects(setDevToolsEnabled(devToolsForm("true")), /in development/);
  await assert.rejects(simulateOrderStep(form("reset")), /development-only/);

  Object.assign(process.env, { NODE_ENV: "development" });
  userId = null;
  await assert.rejects(setDevToolsEnabled(devToolsForm("true")), /Unauthenticated/);
  await assert.rejects(simulateOrderStep(form("reset")), /Unauthenticated/);
});
