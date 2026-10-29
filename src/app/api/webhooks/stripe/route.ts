import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { receiptEmail } from "@/server/emails/receipt";
import { getOrders, orderNumber } from "@/server/queries/orders";
import { sendEmail } from "@/server/services/resend";
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

  if (
    intent.status === "succeeded" &&
    intent.receipt_email &&
    !payment.confirmationEmailSentAt
  ) {
    // Same lookup as the order page; a payment with no Clerk user still gets its total.
    const [order] = intent.metadata.clerkUserId
      ? await getOrders(intent.metadata.clerkUserId, orderNumber(intent.id))
      : [];
    const receipt = receiptEmail(
      order ?? {
        number: orderNumber(intent.id),
        amount: intent.amount_received,
        currency: intent.currency,
        createdAt: new Date(intent.created * 1000),
        items: [],
        subtotal: null,
        shipping: null,
        tax: 0,
        discount: 0,
        shipTo: null,
      },
      new URL(request.url).origin,
    );

    await sendEmail(
      { to: intent.receipt_email, ...receipt },
      `payment-confirmation/${intent.id}`,
    );

    await db
      .update(payments)
      .set({ confirmationEmailSentAt: new Date() })
      .where(eq(payments.id, intent.id));
  }

  return Response.json({ received: true });
}
