"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { getStripe } from "@/server/stripe";

type ReturnState = { requested: boolean; error?: string };

export async function requestOrderReturn(form: FormData): Promise<ReturnState> {
  const { userId } = await auth.protect();
  const id = form.get("orderId");
  const details = form.get("details");
  if (typeof id !== "string" || !/^pi_[a-zA-Z0-9]{1,240}$/.test(id)) {
    return { requested: false, error: "Invalid order." };
  }
  if (typeof details !== "string" || !details.trim() || details.trim().length > 500) {
    return { requested: false, error: "Describe the items and reason for your return in 500 characters or fewer." };
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(id, { expand: ["latest_charge"] });
  if (intent.metadata.clerkUserId !== userId || intent.status !== "succeeded") {
    return { requested: false, error: "This order is not available for a return." };
  }
  const charge = intent.latest_charge;
  if (charge && typeof charge !== "string" && charge.refunded) {
    return { requested: false, error: "This order has already been refunded." };
  }
  if (intent.metadata.returnStatus !== "requested") {
    // ponytail: requests live on the Stripe payment; review them there, no separate returns database.
    await stripe.paymentIntents.update(
      id,
      { metadata: { returnStatus: "requested", returnDetails: details.trim() } },
      { idempotencyKey: `return-request/${id}` },
    );
  }
  refresh();
  return { requested: true };
}
