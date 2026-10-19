import { auth } from "@clerk/nextjs/server";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/layout/account-shell";
import { OrderItem, orderDate, orderMoney } from "@/components/store/order-item";
import { OrderReturn } from "@/components/store/order-return";
import { Badge } from "@/components/ui/badge";
import { getOrders } from "@/server/queries/orders";

const region = new Intl.DisplayNames("en", { type: "region" });
const status = { available: "Paid", unavailable: "Paid", requested: "Return requested", refunded: "Refunded" };

export async function generateMetadata(props: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Order ${id.toUpperCase()}` };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <h2 className="bg-muted px-5 py-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { userId } = await auth.protect();
  const { id } = await props.params;
  // Scoped to the signed-in user, so someone else's order number is a 404.
  const [order] = await getOrders(userId, id);
  if (!order) notFound();
  const format = (cents: number) => orderMoney(cents, order.currency);
  const quantity = order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const address = order.shipTo?.address;

  return (
    <AccountShell back={{ href: "/orders", label: "Your orders" }} title={`Order ${order.number}`}>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
        <span>
          Placed <time dateTime={order.createdAt.toISOString()}>{orderDate.format(order.createdAt)}</time>
        </span>
        <Badge variant={order.returnStatus === "refunded" ? "outline" : "secondary"}>{status[order.returnStatus]}</Badge>
      </p>

      <div className="mt-8 grid gap-6">
        <Section title={`Items (${quantity})`}>
          {order.items.length > 0 ? (
            <ul className="divide-y px-5">
              {order.items.map((item) => (
                <OrderItem key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-muted-foreground">Item details are unavailable. Refresh the page to try again.</p>
          )}
          <dl className="grid gap-2 border-t px-5 py-4 text-sm">
            {order.subtotal !== null && <Row label="Subtotal">{format(order.subtotal)}</Row>}
            {order.shipping !== null && <Row label="Shipping">{order.shipping ? format(order.shipping) : "Free"}</Row>}
            {order.discount > 0 && <Row label="Discount">−{format(order.discount)}</Row>}
            {order.tax > 0 && <Row label="Tax">{format(order.tax)}</Row>}
            <div className="mt-1 flex justify-between gap-4 border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{format(order.amount)}</dd>
            </div>
          </dl>
        </Section>

        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="Shipping address">
            {order.shipTo && address ? (
              <address className="px-5 py-4 text-sm leading-relaxed not-italic">
                <span className="font-semibold">{order.shipTo.name}</span>
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {[address.postal_code, address.city].filter(Boolean).join(" ")}
                <br />
                {address.country && (region.of(address.country) ?? address.country)}
              </address>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">Not available.</p>
            )}
          </Section>

          <Section title="Payment">
            {order.card || order.email ? (
              <dl className="grid gap-2 px-5 py-4 text-sm">
                {order.card && (
                  <Row label="Card">
                    <span className="capitalize">{order.card.brand}</span> •••• {order.card.last4}
                  </Row>
                )}
                {order.email && <Row label="Receipt sent to">{order.email}</Row>}
              </dl>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">Not available.</p>
            )}
            {order.receiptUrl && (
              <a
                href={order.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 border-t px-5 py-3 text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset"
              >
                View receipt
                <ExternalLinkIcon aria-hidden="true" className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </Section>
        </div>

        <Section title="Returns">
          <OrderReturn orderId={order.id} status={order.returnStatus} />
        </Section>
      </div>
    </AccountShell>
  );
}
