// ponytail: assert script, not a test framework — run with `bun run test`
import assert from "node:assert/strict";
import type { Product } from "@/types/product";
import { MAX_QTY, SHIPPING_CENTS, parseCart, suggest, toLineItems, totals, withQty } from "./cart";

const kettle: Product = {
  id: "kettle",
  name: "Kettle",
  description: "Boils water",
  category: "Kitchen appliances",
  image: "/products/kettle.webp",
  color: "#d6d4cd",
  price: 49,
};

assert.deepEqual(parseCart(undefined), {});
assert.deepEqual(parseCart("not json"), {}, "garbage cookies must not throw");
assert.deepEqual(parseCart("[1,2]"), {}, "arrays are not carts");
assert.deepEqual(
  parseCart(JSON.stringify({ a: 2, b: 0, c: -1, d: 1.5, e: "3", f: 1e9 })),
  { a: 2, f: MAX_QTY },
  "only positive integer quantities survive, clamped",
);

assert.deepEqual(withQty({}, "a", 1), { a: 1 });
assert.deepEqual(withQty({ a: 1 }, "a", 1), { a: 2 });
assert.deepEqual(withQty({ a: 1, b: 1 }, "a", -1), { b: 1 }, "empty line is removed");
assert.deepEqual(withQty({ a: 3 }, "a", -MAX_QTY), {}, "remove button clears the line");
assert.deepEqual(withQty({ a: 5 }, "a", MAX_QTY), { a: MAX_QTY }, "quantity is capped");
const before = { a: 1 };
withQty(before, "a", 1);
assert.deepEqual(before, { a: 1 }, "withQty must not mutate its input");

assert.deepEqual(toLineItems([]), []);
assert.deepEqual(
  toLineItems([{ product: kettle, quantity: 3 }]),
  [
    {
      quantity: 3,
      price_data: {
        currency: "eur",
        unit_amount: 4900,
        product_data: { name: "Kettle", description: "Boils water" },
      },
    },
  ],
  "Stripe bills cents per unit, quantity carries the rest",
);

// Money path: the €60 promise on the home and product pages is the boundary.
assert.deepEqual(totals([]), { count: 0, subtotal: 0, shipping: 0, total: 0 }, "an empty cart owes nothing");
assert.deepEqual(
  totals([{ product: kettle, quantity: 1 }]),
  { count: 1, subtotal: 4900, shipping: SHIPPING_CENTS, total: 4900 + SHIPPING_CENTS },
  "under €60 pays the flat rate",
);
assert.equal(totals([{ product: { ...kettle, price: 60 }, quantity: 1 }]).shipping, 0, "exactly €60 ships free");
assert.equal(totals([{ product: { ...kettle, price: 30 }, quantity: 2 }]).shipping, 0, "quantity counts toward free shipping");

const toaster = { ...kettle, id: "toaster" };
const pan = { ...kettle, id: "pan", category: "Cookware" };
const mop = { ...kettle, id: "mop", category: "Cleaning" };
assert.deepEqual(
  suggest([{ product: kettle, quantity: 1 }], [pan, kettle, mop, toaster]).map(({ id }) => id),
  ["toaster", "pan", "mop"],
  "same category first, catalog order otherwise, never what is already in the cart",
);
assert.deepEqual(suggest([], [pan, kettle, mop], 2).map(({ id }) => id), ["pan", "kettle"], "an empty cart gets the catalog's lead");

console.log("ok — cart cookie parsing, quantity math, clamping, Stripe line items, shipping threshold, suggestions");
