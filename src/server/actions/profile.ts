"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { refresh } from "next/cache";

type PhoneState = { saved: boolean; error?: string };

/** An unverified contact number, so only its shape is checked. Empty clears it. */
export async function savePhone(form: FormData): Promise<PhoneState> {
  const { userId } = await auth.protect();
  const value = form.get("phone");
  const phone = typeof value === "string" ? value.trim() : "";
  const digits = phone.replace(/\D/g, "").length;
  if (phone && (phone.length > 30 || !/^\+?[\d\s().-]+$/.test(phone) || digits < 7 || digits > 15)) {
    return { saved: false, error: "Enter a phone number with 7 to 15 digits, like +32 470 12 34 56." };
  }

  // Merged into privateMetadata, so stripeCustomerId stays; null removes the key.
  await (await clerkClient()).users.updateUserMetadata(userId, { privateMetadata: { phone: phone || null } });
  refresh();
  return { saved: true };
}
