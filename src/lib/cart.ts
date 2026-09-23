import type Stripe from "stripe";
import type { Product } from "@/types/product";

// ponytail: the cart is a cookie of {id: qty} — no store, no client state, no db
export type Cart = Record<string, number>;

export const CART_COOKIE = "cart";
export const MAX_QTY = 99;

// ponytail: the "Free shipping over €60" the home and product pages promise;
// below it Stripe charges one flat rate. Cents, because €4.95 does not add up
// exactly in float euros.
export const FREE_SHIPPING_CENTS = 6000;
export const SHIPPING_CENTS = 495;

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

/** What the cart, the drawer and Stripe all agree on — every amount in cents. */
export function totals(lines: CartLine[]) {
  let count = 0;
  let subtotal = 0;
  for (const { product, quantity } of lines) {
    count += quantity;
    subtotal += product.price * 100 * quantity;
  }
  const shipping = count === 0 || subtotal >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;
  return { count, subtotal, shipping, total: subtotal + shipping };
}

/** Cross-sell: the cart's own categories first, never what is already in it. */
export function suggest(lines: CartLine[], catalog: Product[], limit = 6): Product[] {
  const ids = new Set(lines.map(({ product }) => product.id));
  const categories = new Set(lines.map(({ product }) => product.category));
  // Array#sort is stable, so each group keeps catalog order.
  return catalog
    .filter(({ id }) => !ids.has(id))
    .sort((a, b) => Number(categories.has(b.category)) - Number(categories.has(a.category)))
    .slice(0, limit);
}

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
