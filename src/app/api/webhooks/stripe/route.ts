import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { orderEmail } from "@/server/emails/order";
import { orderNumber } from "@/server/queries/orders";
import { isEmailConfigured, sendEmail } from "@/server/services/resend";
import { getStripe } from "@/server/services/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.data.object.object !== "payment_intent") {
    return Response.json({ received: true });
  }

  let intent;

  try {
    intent = await stripe.paymentIntents.retrieve(event.data.object.id);
  } catch (error) {
    // An intent Stripe doesn't know can never sync; acknowledge so Stripe stops retrying.
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") {
      return Response.json({ received: true });
    }
    throw error;
  }

  const db = getDb();
  const [payment] = await db
    .insert(payments)
    .values({
      id: intent.id,
      clerkUserId: intent.metadata.clerkUserId || null,
      status: intent.status,
      amount: intent.amount_received,
      currency: intent.currency,
      receiptEmail: intent.receipt_email,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: payments.id,
      set: {
        clerkUserId: intent.metadata.clerkUserId || null,
        status: intent.status,
        amount: intent.amount_received,
        currency: intent.currency,
        receiptEmail: intent.receipt_email,
        updatedAt: new Date(),
      },
    })
    .returning({
      confirmationEmailSentAt: payments.confirmationEmailSentAt,
    });

  if (intent.status === "succeeded" && !payment.confirmationEmailSentAt) {
    if (!isEmailConfigured()) {
      // An empty Resend variable switches email off. The payment is recorded, so
      // acknowledge: a 500 here would make Stripe retry for days for nothing.
      console.warn(`Resend is not configured; no confirmation email for ${intent.id}`);
      return Response.json({ received: true });
    }

    // Straight from Stripe rather than getOrders, which only sees payments tied
    // to a Clerk user: guests paid too. A failed lookup throws, so Stripe retries.
    const { data: [session] } = await stripe.checkout.sessions.list({
      payment_intent: intent.id,
      limit: 1,
      expand: ["data.line_items"],
    });
    // Only signed-in checkouts set receipt_email; a guest typed theirs into Checkout.
    const to = intent.receipt_email ?? session?.customer_details?.email;

    if (to) {
      const receipt = orderEmail(
        "confirmed",
        {
          number: orderNumber(intent.id),
          amount: intent.amount_received,
          currency: intent.currency,
          createdAt: new Date(intent.created * 1000),
          // Empty and null when the payment did not come from Checkout; the total still shows.
          items: (session?.line_items?.data ?? []).map((item) => ({
            id: item.id,
            name: item.description,
            quantity: item.quantity,
            amount: item.amount_total,
            currency: item.currency,
            product: undefined,
          })),
          subtotal: session?.amount_subtotal ?? null,
          shipping: session?.shipping_cost?.amount_total ?? null,
          tax: session?.total_details?.amount_tax ?? 0,
          discount: session?.total_details?.amount_discount ?? 0,
          shipTo: session?.collected_information?.shipping_details ?? null,
        },
        new URL(request.url).origin,
        Boolean(intent.metadata.clerkUserId),
      );

      await sendEmail({ to, ...receipt }, `payment-confirmation/${intent.id}`);

      await db
        .update(payments)
        .set({ confirmationEmailSentAt: new Date() })
        .where(eq(payments.id, intent.id));
    }
  }

  return Response.json({ received: true });
}
