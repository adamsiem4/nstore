"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { SHIPPING_COUNTRIES } from "@/lib/cart";
import { getDb } from "@/server/db";
import { addresses } from "@/server/db/schema";

// ponytail: the form's `required`/`maxLength`/<select> stop honest mistakes
// before submit, so a bad value here means a crafted request: it throws
// instead of round-tripping field errors.
function field(form: FormData, name: string, { max = 100, optional = false } = {}) {
  const value = form.get(name);
  const text = typeof value === "string" ? value.trim() : "";
  if ((!text && !optional) || text.length > max) throw new Error(`Invalid ${name}`);
  return text;
}

const mine = (userId: string, id: string) =>
  and(eq(addresses.id, id), eq(addresses.clerkUserId, userId));

/** Creates, or updates when the form carries an `id`. */
export async function saveAddress(form: FormData) {
  const { userId } = await auth.protect();
  const country = field(form, "country", { max: 2 });
  if (!SHIPPING_COUNTRIES.some((code) => code === country)) throw new Error("Invalid country");

  const values = {
    name: field(form, "name"),
    line1: field(form, "line1"),
    line2: field(form, "line2", { optional: true }) || null,
    city: field(form, "city"),
    postalCode: field(form, "postalCode", { max: 20 }),
    country,
    isDefault: form.get("isDefault") === "on",
  };
  const id = field(form, "id", { optional: true });
  const db = getDb();
  const write = id
    ? db.update(addresses).set(values).where(mine(userId, id))
    : db.insert(addresses).values({ ...values, clerkUserId: userId });

  // The partial unique index allows one default per user, so the old one is
  // cleared in the same batch (one transaction) before the new one is set.
  const clearDefault = db
    .update(addresses)
    .set({ isDefault: false })
    .where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true)));
  if (values.isDefault) await db.batch([clearDefault, write]);
  else await write;

  redirect("/account/addresses");
}

export async function deleteAddress(form: FormData) {
  const { userId } = await auth.protect();
  await getDb().delete(addresses).where(mine(userId, field(form, "id")));
  refresh();
}

export async function setDefaultAddress(form: FormData) {
  const { userId } = await auth.protect();
  const db = getDb();
  await db.batch([
    db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.clerkUserId, userId), eq(addresses.isDefault, true))),
    db.update(addresses).set({ isDefault: true }).where(mine(userId, field(form, "id"))),
  ]);
  refresh();
}
