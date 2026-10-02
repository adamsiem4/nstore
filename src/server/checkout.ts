"use server";

import { auth, clerkClient, currentUser, type User } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SHIPPING_COUNTRIES, toLineItems, totals } from "@/lib/cart";
import { getCartLines } from "@/server/cart-lines";
import { getDb } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { getStripe } from "@/server/stripe";

/**
 * The user's Stripe customer, carrying their default address so Checkout
 * pre-fills it. The id lives in Clerk's private metadata; our table stays the
 * source of truth and overwrites the customer's shipping on every checkout.
 */
async function customerWithShipping(user: User, email: string | undefined, address: typeof addresses.$inferSelect) {
  const stripe = getStripe();
  const params = {
    email,
    shipping: {
      name: address.name,
      // "" clears a line2 left over from a previous default.
      address: { line1: address.line1, line2: address.line2 ?? "", city: address.city, postal_code: address.postalCode, country: address.country },
    },
  };

  const saved = user.privateMetadata.stripeCustomerId;
  if (typeof saved === "string") {
    // Deleted in the dashboard, or made under the other test/live key: start a new one.
    const updated = await stripe.customers.update(saved, params).catch((error: { code?: string }) => {
      if (error.code === "resource_missing") return null;
      throw error;
    });
    if (updated) return updated.id;
  }

  const { id } = await stripe.customers.create({ ...params, metadata: { clerkUserId: user.id } });
  await (await clerkClient()).users.updateUserMetadata(user.id, { privateMetadata: { stripeCustomerId: id } });
  return id;
}

/** Cart cookie → Stripe Checkout Session → hosted payment page. */
export async function startCheckout() {
  const lines = await getCartLines();

  if (lines.length === 0) return;

  const { shipping } = totals(lines);
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const email = user?.primaryEmailAddress?.emailAddress;
  const [address] = user
    ? await getDb()
        .select()
        .from(addresses)
        .where(and(eq(addresses.clerkUserId, user.id), eq(addresses.isDefault, true)))
    : [];
  const customer = user && address ? await customerWithShipping(user, email, address) : undefined;

  // ponytail: origin from the request — works on localhost and Vercel, no env var
  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: toLineItems(lines),
    // Stripe takes one or the other; the customer already carries the email.
    ...(customer ? { customer } : { customer_email: email }),
    payment_intent_data: {
      receipt_email: email,
      metadata: { clerkUserId: userId ?? "" },
    },
    success_url: `${origin}/api/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
    // Same figure the cart showed: €4.95 under €60, free from there.
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: shipping ? "Standard shipping" : "Free shipping",
          fixed_amount: { amount: shipping, currency: "eur" },
        },
      },
    ],
  });

  if (!session.url) throw new Error("Stripe returned a session without a URL");

  redirect(session.url);
}
