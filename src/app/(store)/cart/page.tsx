import { ShoppingBagIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CartLineList, CartSuggestions, CartSummary, ShippingProgress } from "@/components/store/cart";
import { pillButtonVariants } from "@/components/ui/pill-button";
import { suggest, totals } from "@/lib/cart";
import { getCartLines } from "@/server/cart-lines";
import { getProducts } from "@/server/queries/products";

export const metadata: Metadata = { title: "My cart" };

export default async function CartPage() {
  const [lines, catalog] = await Promise.all([getCartLines(), getProducts()]);
  const { count, subtotal } = totals(lines);
  const itemLabel = `${count} ${count === 1 ? "item" : "items"}`;
  const picks = suggest(lines, catalog);

  return (
    <main id="content" tabIndex={-1} className="flex flex-1 flex-col rounded-xl border bg-card p-3 sm:p-8 lg:p-10">
      {lines.length === 0 ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <ShoppingBagIcon aria-hidden="true" className="size-8 text-muted-foreground" />
            <h1 className="mt-6 flex flex-wrap items-baseline justify-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              My cart
              <span className="text-muted-foreground">{itemLabel}</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">Your cart is empty.</p>
            <Link href="/products" className={pillButtonVariants({ className: "mt-8 h-12 px-8 text-base" })}>
              Continue shopping
            </Link>
          </div>
          <CartSuggestions heading="Start with a favourite" products={picks} />
        </>
      ) : (
        <>
          <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_16rem] lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                My cart
                <span className="text-muted-foreground">{itemLabel}</span>
              </h1>
              <ShippingProgress subtotal={subtotal} className="mt-6" />
              <CartLineList lines={lines} className="mt-6" />
            </div>
            <aside aria-labelledby="order-summary" className="min-w-0 rounded-xl bg-muted p-5 md:sticky md:top-28">
              <h2 id="order-summary" className="text-lg font-semibold tracking-tight sm:text-2xl">Order summary</h2>
              <CartSummary lines={lines} className="mt-5" />
            </aside>
          </div>
          {/* Outside the grid: the sticky summary must not ride over it, and
              on a phone the checkout button comes first. */}
          <CartSuggestions heading="Pairs well with" products={picks} className="mt-12" />
        </>
      )}
    </main>
  );
}
