import { eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { sendEmail } from "@/server/resend";
import { getStripe } from "@/server/stripe";

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

  const intent = await stripe.paymentIntents.retrieve(event.data.object.id);
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
    await sendEmail(
      {
        to: intent.receipt_email,
        subject: "Your NStore payment was received",
        text: `We received your payment of ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: intent.currency,
        }).format(intent.amount_received / 100)}.`,
      },
      `payment-confirmation/${intent.id}`,
    );

    await db
      .update(payments)
      .set({ confirmationEmailSentAt: new Date() })
      .where(eq(payments.id, intent.id));
  }

  return Response.json({ received: true });
}
