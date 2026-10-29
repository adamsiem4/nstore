import assert from "node:assert/strict";
import { test } from "bun:test";
import { orderEmail } from "@/server/emails/order";

const order = {
  number: "AB12CD34",
  amount: 6495,
  currency: "eur",
  createdAt: new Date("2026-10-29T12:00:00Z"),
  items: [{ id: "li_1", name: "Pan <large> & lid", quantity: 2, amount: 6000, currency: "eur", product: undefined }],
  subtotal: 6000,
  shipping: 0,
  tax: 0,
  discount: 0,
  shipTo: { name: "Ada Lovelace", address: { line1: "1 Main St", line2: null, city: "Dublin", postal_code: "D01", state: null, country: "IE" } },
};

test("confirmation email content", () => {
  const { subject, html, text } = orderEmail("confirmed", order, "http://localhost:3000");

  assert.equal(subject, "Your nstore order AB12CD34");
  assert.ok(!/NStore/.test(html + text), "brand is lowercase");
  assert.ok(html.includes("Pan &#60;large&#62; &#38; lid"), "item names are escaped");
  assert.ok(!html.includes("<large>"));
  assert.ok(html.includes("http://localhost:3000/orders/ab12cd34"));
  assert.ok(html.includes("Free"), "zero shipping reads Free");
  assert.ok(text.includes("Total paid: €64.95"));
  assert.ok(text.includes("Ireland"));
  assert.ok(text.includes("Status: Confirmed\n"));
});

test("shipped and delivered emails change the wording and progress", () => {
  const shipped = orderEmail("shipped", order, "http://localhost:3000");
  assert.equal(shipped.subject, "Your nstore order AB12CD34 is on its way");
  assert.ok(shipped.text.includes("Status: Confirmed → Shipped\n"));

  const delivered = orderEmail("delivered", order, "http://localhost:3000");
  assert.equal(delivered.subject, "Your nstore order AB12CD34 has been delivered");
  assert.ok(delivered.text.includes("Status: Confirmed → Shipped → Delivered"));
  assert.ok(delivered.text.includes("Delivered to:"));
});

test("email without Stripe details still shows the total", () => {
  const { html, text } = orderEmail(
    "confirmed",
    { ...order, items: [], subtotal: null, shipping: null, shipTo: null },
    "http://localhost:3000",
  );

  assert.ok(text.includes("Total paid: €64.95"));
  assert.ok(!html.includes("Subtotal") && !html.includes("Shipping to"));
});
