import { MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CartFormButton } from "@/components/store/cart";
import { SoftPillButton, pillButtonVariants } from "@/components/ui/pill-button";
import { MAX_QTY } from "@/lib/cart";
import { money } from "@/lib/utils";
import { getCartLines } from "@/server/cart-lines";
import { startCheckout } from "@/server/checkout";

export const metadata: Metadata = { title: "My cart" };

export default async function CartPage() {
  const lines = await getCartLines();
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <main id="content" tabIndex={-1} className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      {count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <ShoppingBagIcon className="size-8 text-muted-foreground" />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            My cart<sup className="ml-1 align-super text-2xl text-muted-foreground">(0)</sup>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">It seems to be empty…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Suspiciously light. Nothing rattles when you shake it.
          </p>
          <Link href="/products" className={pillButtonVariants({ className: "mt-8 h-12 px-8 text-base" })}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid flex-1 items-start gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              My cart
              <sup className="ml-1 align-super text-2xl text-muted-foreground">({count})</sup>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Review your order and proceed to checkout.
            </p>
            <ul className="mt-8 flex flex-col divide-y">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 py-5 sm:gap-6">
                  <Link href={`/products/${product.id}`} className="shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={256}
                      height={256}
                      className="size-24 rounded-xl bg-muted object-cover sm:size-32"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/products/${product.id}`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{money.format(product.price)} each</p>
                    <p className="mt-1 text-sm font-medium tabular-nums">
                      Total: {money.format(product.price * quantity)}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                        <CartFormButton id={product.id} delta={-1} variant="outline" label={`One less ${product.name}`}>
                          <MinusIcon />
                        </CartFormButton>
                        <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
                        <CartFormButton
                          id={product.id}
                          delta={1}
                          variant="outline"
                          label={`One more ${product.name}`}
                          disabled={quantity >= MAX_QTY}
                        >
                          <PlusIcon />
                        </CartFormButton>
                      </div>
                      <CartFormButton id={product.id} delta={-MAX_QTY} label={`Remove ${product.name}`}>
                        <Trash2Icon />
                      </CartFormButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-xl bg-muted p-5 lg:sticky lg:top-6">
            <h2 className="text-2xl font-semibold tracking-tight">Order summary</h2>
            <p className="mt-1 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {count} {count === 1 ? "product" : "products"}
            </p>
            <dl className="mt-5 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money.format(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>Free</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                <dt className="font-medium">
                  Total <span className="text-xs font-normal text-muted-foreground">(tax included)</span>
                </dt>
                <dd className="text-lg font-semibold tabular-nums">{money.format(subtotal)}</dd>
              </div>
            </dl>
            <form action={startCheckout} className="mt-5">
              <SoftPillButton type="submit" className="h-12 w-full text-base">
                Proceed to checkout
              </SoftPillButton>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">Secure payment by Stripe · 30-day returns</p>
          </aside>
        </div>
      )}
    </main>
  );
}
