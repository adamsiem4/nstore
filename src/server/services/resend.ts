import "server-only";

import { Resend } from "resend";

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

export async function sendEmail(
  email: { to: string; subject: string; text: string; html?: string },
  idempotencyKey?: string,
) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const { error } = await getResend().emails.send(
    { from, ...email },
    { idempotencyKey },
  );

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
