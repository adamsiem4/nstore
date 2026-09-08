import { NextResponse } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { getStripe } from "@/server/stripe";

/** Clear the cart only after Stripe confirms payment. */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const session = sessionId
    ? await getStripe().checkout.sessions.retrieve(sessionId).catch(() => null)
    : null;

  if (!session || session.payment_status !== "paid") {
    return NextResponse.redirect(new URL("/cart", origin));
  }

  const response = NextResponse.redirect(
    new URL(`/checkout/success?session_id=${session.id}`, origin),
  );
  response.cookies.delete(CART_COOKIE);
  return response;
}
