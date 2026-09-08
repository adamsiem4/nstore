import "server-only";

import { cookies } from "next/headers";
import { type CartLine, CART_COOKIE, parseCart } from "@/lib/cart";
import { getProduct } from "@/server/queries/products";

/** Cart cookie → catalog lines, dropping ids that no longer exist. */
export async function getCartLines(): Promise<CartLine[]> {
  const cart = parseCart((await cookies()).get(CART_COOKIE)?.value);

  const lines = await Promise.all(
    Object.entries(cart).map(async ([id, quantity]) => {
      const product = await getProduct(id);
      return product ? { product, quantity } : undefined;
    }),
  );

  return lines.filter((line) => line !== undefined);
}
