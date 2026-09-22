"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CART_COOKIE, parseCart, withQty } from "@/lib/cart";
import { getProduct } from "@/server/queries/products";

/** Shared mutation; only a quantity change counts as a successful addition. */
async function changeQuantity(id: string, delta: number) {
  if (!id || !Number.isInteger(delta) || delta === 0) return false;
  if (delta > 0 && !(await getProduct(id))) return false;

  const jar = await cookies();
  const cart = parseCart(jar.get(CART_COOKIE)?.value);
  const next = withQty(cart, id, delta);
  if (next[id] === cart[id]) return false;

  jar.set(CART_COOKIE, JSON.stringify(next), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

/** Returns confirmation only after the product has actually been added. */
export async function addToCart(formData: FormData) {
  return changeQuantity(String(formData.get("id") ?? ""), 1);
}

/** Native form submission also works before hydration or without JavaScript. */
export async function updateCart(formData: FormData) {
  const changed = await changeQuantity(
    String(formData.get("id") ?? ""),
    Number(formData.get("delta")),
  );

  // ponytail: one literal destination prevents an open redirect from a crafted form.
  if (changed && formData.get("next") === "/cart") redirect("/cart");
}
