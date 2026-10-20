import "server-only";

import { cookies } from "next/headers";
import { type CartLine, CART_COOKIE, parseCart } from "@/lib/cart";
import { getProducts } from "@/server/queries/products";
import type { Product } from "@/types/product";

/** Cart cookie → lines in order via the render-deduped catalog, dropping missing ids. */
export async function getCartLines(): Promise<CartLine[]> {
  const cart = parseCart((await cookies()).get(CART_COOKIE)?.value);
  const productsById = new Map<string, Product>();

  for (const product of await getProducts()) {
    productsById.set(product.id, product);
  }

  const lines: CartLine[] = [];

  for (const [id, quantity] of Object.entries(cart)) {
    const product = productsById.get(id);
    if (product) lines.push({ product, quantity });
  }

  return lines;
}
