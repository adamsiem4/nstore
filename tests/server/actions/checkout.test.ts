import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { CartLine } from "@/lib/cart";

const kettle = { id: "kettle", name: "Kettle", description: "Boils water", category: "Kitchen appliances", image: "/products/kettle.webp", color: "#d6d4cd", price: 49 };
const home = { id: "addr_1", clerkUserId: "user_member", name: "Ada Lovelace", line1: "1 Main St", line2: null, city: "Dublin", postalCode: "D01", country: "IE", isDefault: true, createdAt: new Date() };

type Params = Record<string, unknown>;

let lines: CartLine[] = [];
let user: { id: string; primaryEmailAddress: { emailAddress: string }; privateMetadata: Record<string, unknown> } | null = null;
let defaultAddress: typeof home | null = null;
let addressQuery: SQL | undefined; // the WHERE clause the default-address lookup ran with
let savedCustomerExists = true;
let sessions: Params[] = [];
let customerUpdates: [string, Params][] = [];
let customerCreates: Params[] = [];
let metadataWrites: [string, Params][] = [];

beforeEach(() => {
  lines = [{ product: kettle, quantity: 1 }];
  user = null;
  defaultAddress = null;
  addressQuery = undefined;
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
  getDb: () => ({ select: () => ({ from: () => ({ where: async (condition: SQL) => {
    addressQuery = condition;
    return defaultAddress ? [defaultAddress] : [];
  } }) }) }),
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
  // The fake returns whatever it holds, so the filter is what keeps another member's address out.
  assert.deepEqual(new PgDialect().sqlToQuery(addressQuery!).params, ["user_member", true], "only this member's default address is looked up");
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
