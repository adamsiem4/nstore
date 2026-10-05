import { createHash } from "node:crypto";
import { Show } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaptureEvent } from "@/components/analytics/capture-event";
import { pillButtonVariants } from "@/components/ui/pill-button";
import { getStripe } from "@/server/stripe";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const { session_id: sessionId } = await props.searchParams;
  if (typeof sessionId !== "string") notFound();

  const session = await getStripe()
    .checkout.sessions.retrieve(sessionId, { expand: ["line_items"] })
    .catch(() => null);

  if (!session || session.payment_status !== "paid") notFound();

  const currency = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: session.currency ?? "eur",
  });
  const total = currency.format((session.amount_total ?? 0) / 100);
  const shipping = session.shipping_cost?.amount_total;
  // ponytail: one uuid per Stripe session, so a reload re-sends the same event
  // and PostHog storage dedupes it (eventually, same day; not instantly).
  const eventId = createHash("sha256")
    .update(session.id)
    .digest("hex")
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*/, "$1-$2-$3-$4-$5");

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col justify-center py-10 text-center">
      <CaptureEvent
        event="Order Completed"
        uuid={eventId}
        properties={{
          order_id: session.id,
          total: (session.amount_total ?? 0) / 100,
          revenue: (session.amount_subtotal ?? 0) / 100,
          shipping: (shipping ?? 0) / 100,
          currency: session.currency?.toUpperCase(),
          products: session.line_items?.data.map((item) => ({
            name: item.description,
            quantity: item.quantity,
          })),
        }}
      />
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Order confirmed
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Thanks for your order</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        We charged {total}
        {session.customer_details?.email ? ` and emailed ${session.customer_details.email}` : ""}
      </p>

      <ul className="mt-8 flex flex-col gap-2 text-left text-sm">
        {session.line_items?.data.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 border-b pb-2">
            <span>
              {item.quantity}× {item.description}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {new Intl.NumberFormat("en-IE", {
                style: "currency",
                currency: item.currency,
              }).format(item.amount_total / 100)}
            </span>
          </li>
        ))}
        {shipping !== undefined && (
          <li className="flex items-center justify-between gap-4 border-b pb-2">
            <span>Shipping</span>
            <span className="tabular-nums text-muted-foreground">
              {shipping ? currency.format(shipping / 100) : "Free"}
            </span>
          </li>
        )}
      </ul>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className={pillButtonVariants({ className: "h-12 px-8 text-base" })}>
          Continue shopping
        </Link>
        {/* Guests have no order history; /orders asks them to sign in. */}
        <Show when="signed-in">
          <Link href="/orders" className={pillButtonVariants({ variant: "ghost", className: "h-12 px-6 text-base" })}>
            View orders
          </Link>
        </Show>
      </div>
    </div>
  );
}
