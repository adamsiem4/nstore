"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { toLineItems, totals } from "@/lib/cart";
import { getCartLines } from "@/server/cart-lines";
import { getStripe } from "@/server/stripe";

/** Cart cookie → Stripe Checkout Session → hosted payment page. */
export async function startCheckout() {
  const lines = await getCartLines();

  if (lines.length === 0) return;

  const { shipping } = totals(lines);
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const email = user?.primaryEmailAddress?.emailAddress;

  // ponytail: origin from the request — works on localhost and Vercel, no env var
  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: toLineItems(lines),
    customer_email: email,
    payment_intent_data: {
      receipt_email: email,
      metadata: { clerkUserId: userId ?? "" },
    },
    success_url: `${origin}/api/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: {
      allowed_countries: ["IE", "GB", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT", "PL", "SE", "DK", "FI"],
    },
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
