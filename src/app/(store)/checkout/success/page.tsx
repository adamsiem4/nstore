import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

  const total = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: session.currency ?? "eur",
  }).format((session.amount_total ?? 0) / 100);

  return (
    <main className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />
      <div className="mx-auto flex max-w-lg flex-1 flex-col justify-center py-10 text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Order confirmed
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Thanks{session.customer_details?.name ? `, ${session.customer_details.name}` : ""}.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We charged {total}
          {session.customer_details?.email ? ` and emailed ${session.customer_details.email}` : ""}.
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
        </ul>

        <Link href="/products" className={buttonVariants({ className: "mt-8 self-center" })}>
          Keep shopping
        </Link>
      </div>
    </main>
  );
}
