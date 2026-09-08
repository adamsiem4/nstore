import type Stripe from "stripe";
import type { Product } from "@/types/product";

// ponytail: the cart is a cookie of {id: qty} — no store, no client state, no db
export type Cart = Record<string, number>;

export const CART_COOKIE = "cart";
export const MAX_QTY = 99;

/** Untrusted cookie in, sane cart out. */
export function parseCart(raw: string | undefined): Cart {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};

  const cart: Cart = {};
  for (const [id, qty] of Object.entries(parsed)) {
    if (typeof qty === "number" && Number.isInteger(qty) && qty > 0) {
      cart[id] = Math.min(qty, MAX_QTY);
    }
  }
  return cart;
}

/** Add `delta` to a line; zero or less drops it, anything huge clamps to MAX_QTY. */
export function withQty(cart: Cart, id: string, delta: number): Cart {
  const next = { ...cart };
  const qty = (next[id] ?? 0) + delta;

  if (qty <= 0) delete next[id];
  else next[id] = Math.min(qty, MAX_QTY);

  return next;
}

export type CartLine = { product: Product; quantity: number };

/** Catalog prices are whole euros; Stripe bills in cents. */
export function toLineItems(
  lines: CartLine[],
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return lines.map(({ product, quantity }) => ({
    quantity,
    price_data: {
      currency: "eur",
      unit_amount: product.price * 100,
      product_data: { name: product.name, description: product.description },
    },
  }));
}
