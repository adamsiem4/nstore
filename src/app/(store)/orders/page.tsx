import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { PackageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { pillButtonVariants } from "@/components/ui/pill-button";
import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { getStripe } from "@/server/stripe";

export const metadata: Metadata = { title: "My orders" };

const date = new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" });
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);

export default async function OrdersPage() {
  const { userId } = await auth.protect();

  // The Stripe webhook records every payment with the Clerk id it was made under.
  const orders = await getDb()
    .select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.clerkUserId, userId), eq(payments.status, "succeeded")))
    .orderBy(desc(payments.createdAt))
    .limit(20);

  // ponytail: line items stay in Stripe — one session lookup per order, capped
  // at the 20 latest; persist them in the webhook if this page gets slow.
  const stripe = getStripe();
  const items = await Promise.all(
    orders.map((order) =>
      stripe.checkout.sessions
        .list({ payment_intent: order.id, limit: 1, expand: ["data.line_items"] })
        .then(({ data }) => data[0]?.line_items?.data ?? [])
        .catch(() => []),
    ),
  );

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <PackageIcon aria-hidden="true" className="size-8 text-muted-foreground" />
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">My orders</h1>
        <p className="mt-4 text-lg text-muted-foreground">You haven&apos;t placed an order yet.</p>
        <Link href="/products" className={pillButtonVariants({ className: "mt-8 h-12 px-8 text-base" })}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <h1 className="flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        My orders
        <span className="text-muted-foreground">{orders.length}</span>
      </h1>

      <ol className="mt-8 flex flex-col gap-4">
        {orders.map((order, index) => (
          <li key={order.id} className="rounded-xl bg-muted p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-semibold">
                <time dateTime={order.createdAt.toISOString()}>{date.format(order.createdAt)}</time>
              </h2>
              <span className="font-semibold tabular-nums">{money(order.amount, order.currency)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Order {order.id.slice(-8).toUpperCase()}
            </p>
            {items[index].length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {items[index].map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 border-t pt-2">
                    <span>
                      {item.quantity}× {item.description}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {money(item.amount_total, item.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
