import assert from "node:assert/strict";
import { mock } from "bun:test";

let userId = "user_owner";
let intent = {
  id: "pi_order",
  status: "succeeded",
  metadata: { clerkUserId: userId },
  latest_charge: { refunded: false },
};
let failWrite = false;
mock.module("@clerk/nextjs/server", () => ({
  auth: { protect: async () => {
    if (!userId) throw new Error("Unauthenticated");
    return { userId };
  } },
}));
mock.module("next/cache", () => ({ refresh: () => {} }));
mock.module("@/server/stripe", () => ({
  getStripe: () => ({ paymentIntents: {
    retrieve: async () => intent,
    update: async (_id, { metadata }) => {
      if (failWrite) throw new Error("Stripe unavailable");
      intent = { ...intent, metadata: { ...intent.metadata, ...metadata } };
      return intent;
    },
  } }),
}));
const { requestOrderReturn } = await import("./returns.ts");
const form = new FormData();
form.set("orderId", intent.id);
form.set("details", "  Return the kettle; it does not fit.  ");

userId = null;
await assert.rejects(requestOrderReturn(form), /Unauthenticated/);
userId = "user_other";
assert.equal((await requestOrderReturn(form)).requested, false);
userId = "user_owner";
intent.status = "processing";
assert.equal((await requestOrderReturn(form)).requested, false);
intent.status = "succeeded";
intent.latest_charge.refunded = true;
assert.equal((await requestOrderReturn(form)).requested, false);
intent.latest_charge.refunded = false;
form.set("orderId", "not-an-order");
assert.equal((await requestOrderReturn(form)).requested, false);
form.set("orderId", intent.id);
for (const details of ["   ", "x".repeat(501), new Blob(["not text"])]) {
  form.set("details", details);
  assert.equal((await requestOrderReturn(form)).requested, false);
}
assert.equal(intent.metadata.returnStatus, undefined);
form.set("details", "  Return the kettle; it does not fit.  ");
failWrite = true;
await assert.rejects(requestOrderReturn(form), /Stripe unavailable/);
assert.equal(intent.metadata.returnStatus, undefined);
failWrite = false;
assert.equal((await requestOrderReturn(form)).requested, true);
assert.equal(intent.metadata.returnStatus, "requested");
assert.equal(intent.metadata.returnDetails, "Return the kettle; it does not fit.");
assert.equal(intent.metadata.clerkUserId, "user_owner");
form.set("details", "A second request must not replace the first.");
assert.equal((await requestOrderReturn(form)).requested, true);
assert.equal(intent.metadata.returnDetails, "Return the kettle; it does not fit.");
console.log("ok — authorized paid-order returns persist once; invalid, foreign, refunded and failed requests do not");
