import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { PackageIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccountShell } from "@/components/layout/account-shell";
import { OrderList } from "@/components/store/order-list";
import { OrderReturn } from "@/components/store/order-return";
import { getDb } from "@/server/db";
import { payments, products } from "@/server/db/schema";
import { getStripe } from "@/server/stripe";

export const metadata: Metadata = { title: "Your orders" };

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
  const sessions = await Promise.all(
    orders.map((order) =>
      stripe.checkout.sessions
        .list({ payment_intent: order.id, limit: 1, expand: ["data.line_items", "data.payment_intent.latest_charge"] })
        .then(({ data }) => data[0] ?? null)
        .catch(() => null),
    ),
  );
  const items = sessions.map((session) => session?.line_items?.data ?? []);
  const returnStatuses = sessions.map((session) => {
    const intent = session?.payment_intent;
    if (!intent || typeof intent === "string") return "unavailable" as const;
    const charge = intent.latest_charge;
    return charge && typeof charge !== "string" && charge.refunded ? "refunded"
      : intent.metadata.returnStatus === "requested" ? "requested" : "available";
  });

  // Stripe line items only carry the product name; match it back to the
  // catalog for the photo and link. Renamed or removed products show text only.
  const names = [...new Set(items.flat().map((item) => item.description).filter((name) => name !== null))];
  const catalog = names.length
    ? await getDb()
        .select({ id: products.id, name: products.name, image: products.image })
        .from(products)
        .where(inArray(products.name, names))
    : [];
  const byName = new Map(catalog.map((product) => [product.name, product]));

  // Markup stays server-rendered; OrderList only filters it as you type.
  // ponytail: search covers the 20 orders loaded above; move it to SQL once
  // line items are persisted and the list paginates.
  const rows = orders.map((order, index) => ({
    id: order.id,
    text: [`#${order.id.slice(-8)}`, date.format(order.createdAt), ...items[index].map((item) => item.description)]
      .join(" ")
      .toLowerCase(),
    header: (
      <dl key={`header-${order.id}`} className="flex flex-wrap gap-x-8 gap-y-2 bg-muted px-5 py-3 text-xs text-muted-foreground">
        <div>
          <dt>Order placed</dt>
          <dd className="mt-0.5 text-sm font-semibold text-foreground">
            <time dateTime={order.createdAt.toISOString()}>{date.format(order.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
            {money(order.amount, order.currency)}
          </dd>
        </div>
        <div className="sm:ml-auto sm:text-right">
          <dt>Order #</dt>
          <dd className="mt-0.5 font-mono text-sm text-foreground">{order.id.slice(-8).toUpperCase()}</dd>
        </div>
      </dl>
    ),
    items: items[index].map((item) => {
      const product = item.description ? byName.get(item.description) : undefined;
      return (
        <li key={item.id} className="flex items-center gap-4 py-4">
          {product && (
            // Same destination as the name beside it; one tab stop is enough.
            <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
              <Image
                src={product.image}
                alt=""
                width={256}
                height={256}
                sizes="80px"
                className="size-20 rounded-lg bg-product-shot object-cover"
              />
            </Link>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              {product ? (
                <Link
                  href={`/products/${product.id}`}
                  className="rounded-sm text-sm font-semibold tracking-wide uppercase outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  {item.description}
                </Link>
              ) : (
                <p className="text-sm font-semibold tracking-wide uppercase">{item.description}</p>
              )}
              <p className="mt-1 font-mono text-xs text-muted-foreground">Qty {item.quantity}</p>
            </div>
            <p className="shrink-0 font-mono text-xs tabular-nums">{money(item.amount_total, item.currency)}</p>
          </div>
        </li>
      );
    }),
    footer: <OrderReturn key={`return-${order.id}`} orderId={order.id} status={returnStatuses[index]} />,
  }));

  return (
    <AccountShell title="Your orders">
      {rows.length === 0 && (
        <Link
          href="/products"
          className="mt-8 flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
        >
          <PackageIcon aria-hidden="true" className="size-8" />
          <span className="font-semibold">No orders yet. Start shopping</span>
        </Link>
      )}
      {rows.length > 0 && <OrderList orders={rows} />}
    </AccountShell>
  );
}
