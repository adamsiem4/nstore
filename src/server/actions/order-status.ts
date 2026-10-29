"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { orderEmail } from "@/server/emails/order";
import { getOrders, orderNumber } from "@/server/queries/orders";
import { sendEmail } from "@/server/services/resend";
import { getStripe } from "@/server/services/stripe";

/**
 * Dev tool: move one of your orders to a fulfillment step and send that step's
 * email, standing in for the warehouse. "reset" puts it back to just paid.
 */
export async function simulateOrderStep(form: FormData) {
  // Server actions are public endpoints; never let customers mark their own orders.
  if (process.env.NODE_ENV !== "development") throw new Error("Order simulation is development-only");

  const { userId } = await auth.protect();
  const id = form.get("orderId");
  const step = form.get("step");
  if (typeof id !== "string" || !/^pi_[a-zA-Z0-9]{1,240}$/.test(id)) throw new Error("Invalid order");
  if (step !== "confirmed" && step !== "shipped" && step !== "delivered" && step !== "reset") {
    throw new Error("Invalid step");
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(id);
  if (intent.metadata.clerkUserId !== userId || intent.status !== "succeeded") throw new Error("Order not found");

  const now = new Date().toISOString();
  // Empty strings delete Stripe metadata keys.
  // "confirmed" only re-sends the receipt; the order keeps its step.
  if (step === "reset") {
    await stripe.paymentIntents.update(id, { metadata: { fulfillment: "", shippedAt: "", deliveredAt: "" } });
  } else if (step === "shipped") {
    await stripe.paymentIntents.update(id, { metadata: { fulfillment: step, shippedAt: now, deliveredAt: "" } });
  } else if (step === "delivered") {
    await stripe.paymentIntents.update(id, {
      metadata: { fulfillment: step, shippedAt: intent.metadata.shippedAt || now, deliveredAt: now },
    });
  }

  if (step !== "reset") {
    const [order] = await getOrders(userId, orderNumber(id));
    const to = intent.receipt_email ?? order?.email;
    if (!order || !to) throw new Error("Order has no email to send to");
    const requestHeaders = await headers();
    const origin = `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;
    // No idempotency key: re-sending is the point of a dev tool.
    await sendEmail({ to, ...orderEmail(step, order, origin) });
  }

  refresh();
}
