import { auth } from "@clerk/nextjs/server";
import { ChevronRightIcon, PackageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/layout/account-shell";
import { OrderItem, orderDate, orderMoney } from "@/components/store/order-item";
import { OrderList } from "@/components/store/order-list";
import { pillButtonVariants } from "@/components/ui/pill-button";
import { getOrders } from "@/server/queries/orders";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const { userId } = await auth.protect();
  const orders = await getOrders(userId);

  // Markup stays server-rendered; OrderList only filters it as you type.
  // ponytail: search covers the 20 orders loaded above; move it to SQL once
  // line items are persisted and the list paginates.
  const rows = orders.map((order) => ({
    id: order.id,
    text: [`#${order.number}`, orderDate.format(order.createdAt), ...order.items.map((item) => item.name)]
      .join(" ")
      .toLowerCase(),
    header: (
      <div key={`header-${order.id}`} className="flex flex-wrap items-center justify-between gap-3 bg-muted px-5 py-3">
        <dl className="flex gap-x-8 text-xs text-muted-foreground">
          <div>
            <dt>Order #</dt>
            <dd className="mt-0.5 font-mono text-sm text-foreground">{order.number}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
              {orderMoney(order.amount, order.currency)}
            </dd>
          </div>
        </dl>
        <Link
          href={`/orders/${order.number}`}
          className={pillButtonVariants({ variant: "outline", className: "h-10 gap-1 bg-background pr-3 pl-4" })}
        >
          View details<span className="sr-only"> for order {order.number}</span>
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
    ),
    items: order.items.map((item) => <OrderItem key={item.id} item={item} />),
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
