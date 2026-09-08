"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CART_COOKIE, parseCart, withQty } from "@/lib/cart";
import { getProduct } from "@/server/queries/products";

/** Single action behind every cart form: delta > 0 adds, delta < 0 removes. */
export async function updateCart(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta"));
  if (!id || !Number.isInteger(delta) || delta === 0) return;
  if (delta > 0 && !(await getProduct(id))) return;

  const jar = await cookies();
  const next = withQty(parseCart(jar.get(CART_COOKIE)?.value), id, delta);

  jar.set(CART_COOKIE, JSON.stringify(next), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  // ponytail: one literal destination prevents an open redirect from a crafted form.
  if (formData.get("next") === "/cart") redirect("/cart");
}
