import { MinusIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CartSubmitButton } from "@/components/store/cart-submit-button";
import { DragRow } from "@/components/store/drag-row";
import { ProductCard } from "@/components/store/product-card";
import { PillButton, SoftPillButton } from "@/components/ui/pill-button";
import { type CartLine, FREE_SHIPPING_CENTS, MAX_QTY, totals } from "@/lib/cart";
import { cn, money } from "@/lib/utils";
import { updateCart } from "@/server/cart";
import { startCheckout } from "@/server/checkout";
import type { Product } from "@/types/product";

const euros = (cents: number) => money.format(cents / 100);

/** One hidden-field form per cart mutation. */
export function CartFormButton({
  id,
  delta,
  label,
  ...button
}: { id: string; delta: number; label: string } & ComponentProps<typeof PillButton>) {
  return (
    <form action={updateCart}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <PillButton type="submit" variant="ghost" size="icon-sm" aria-label={label} {...button} />
    </form>
  );
}

export function AddToCartButton({ product }: { product: Product }) {
  return (
    <form action={updateCart} className="mt-10 max-w-sm">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <input type="hidden" name="next" value="/cart" />
      <CartSubmitButton className="h-12 w-full justify-between px-6 text-base">
        <span>Add to cart</span>
        <span className="tabular-nums">{money.format(product.price)}</span>
      </CartSubmitButton>
    </form>
  );
}

/** The free-shipping countdown most of the surveyed carts lead with. */
export function ShippingProgress({ subtotal, className }: { subtotal: number; className?: string }) {
  const left = FREE_SHIPPING_CENTS - subtotal;

  return (
    <div className={className}>
      <p role="status" className="text-sm">
        {left > 0 ? (
          <>
            <span className="font-mono tabular-nums">{euros(left)}</span> away from free shipping
          </>
        ) : (
          "You've got free shipping"
        )}
      </p>
      <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_CENTS) * 100)}%` }}
          className={cn(
            "h-full rounded-full bg-foreground transition-[width] duration-500 ease-out",
            left <= 0 && "bg-success",
          )}
        />
      </div>
    </div>
  );
}

/** Lines drawn like the product tile: shot backdrop, colourway dot, mono figures. */
export function CartLineList({ lines, className }: { lines: CartLine[]; className?: string }) {
  return (
    <ul aria-label="Cart items" className={cn("@container divide-y border-y", className)}>
      {lines.map(({ product, quantity }) => (
        <li key={product.id} className="flex gap-4 py-4">
          {/* Same destination as the name beside it; one tab stop is enough. */}
          <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <Image
              src={product.image}
              alt=""
              width={256}
              height={256}
              sizes="112px"
              className="size-20 rounded-lg bg-product-shot object-cover @lg:size-28"
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={`/products/${product.id}`}
                className="rounded-sm text-sm font-semibold tracking-wide uppercase outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foreground"
              >
                {product.name}
              </Link>
              <p className="shrink-0 font-mono text-xs tabular-nums">
                {money.format(product.price * quantity)}
              </p>
            </div>
            <p className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                style={{ backgroundColor: product.color }}
                className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/15"
              />
              <span className="truncate">{product.description.split(". ")[0]}</span>
            </p>
            <div className="mt-auto flex items-center gap-2 pt-3">
              <div role="group" aria-label={`Quantity for ${product.name}`} className="flex items-center rounded-full border">
                <CartFormButton id={product.id} delta={-1} label={`One less ${product.name}`}>
                  <MinusIcon aria-hidden="true" />
                </CartFormButton>
                <span className="w-6 text-center font-mono text-xs tabular-nums">{quantity}</span>
                <CartFormButton
                  id={product.id}
                  delta={1}
                  label={`One more ${product.name}`}
                  disabled={quantity >= MAX_QTY}
                >
                  <PlusIcon aria-hidden="true" />
                </CartFormButton>
              </div>
              <CartFormButton
                id={product.id}
                delta={-MAX_QTY}
                label={`Remove ${product.name}`}
                variant="link"
                size="xs"
                className="text-muted-foreground hover:text-foreground"
              >
                Remove
              </CartFormButton>
              {quantity > 1 && (
                // A phone-width line has no room for it beside the stepper.
                <p className="ml-auto hidden font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums @sm:block">
                  {money.format(product.price)} each
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Subtotal and shipping; the total rides on the checkout button, the way Material Kitchen does it. */
export function CartSummary({
  lines,
  className,
  children,
}: {
  lines: CartLine[];
  className?: string;
  /** secondary action under the checkout button */
  children?: ReactNode;
}) {
  const { subtotal, shipping, total } = totals(lines);

  return (
    <div className={className}>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right font-mono tabular-nums">{euros(subtotal)}</dd>
        <dt className="text-muted-foreground">Shipping</dt>
        <dd className="text-right font-mono tabular-nums">{shipping ? euros(shipping) : "Free"}</dd>
      </dl>
      <form action={startCheckout} className="mt-5">
        <SoftPillButton type="submit" className="h-12 w-full justify-between px-6 text-base">
          <span>Check out</span>
          <span className="tabular-nums">{euros(total)}</span>
        </SoftPillButton>
      </form>
      {children}
      <p className="mt-3 text-xs text-muted-foreground">
        Tax included · Secure payment by Stripe · 30-day returns
      </p>
    </div>
  );
}

/** In-cart cross-sell, the row Snowe, Ferm Living and Ghia end their carts with. */
export function CartSuggestions({
  heading,
  products,
  className,
}: {
  heading: string;
  products: Product[];
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className={cn("@container", className)}>
      <h2 className="text-xs font-semibold tracking-[0.14em] uppercase">{heading}</h2>
      {/* The home page's snap row; container widths, because the drawer and
          the page give it very different room. */}
      <DragRow className="-m-2 mt-2 grid snap-x snap-mandatory auto-cols-[62%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-p-2 p-2 [scrollbar-width:none] @sm:auto-cols-[46%] @2xl:auto-cols-[31%] @4xl:auto-cols-[calc((100%-2.25rem)/4)] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li key={product.id} className="snap-start">
            <ProductCard product={product} />
          </li>
        ))}
      </DragRow>
    </section>
  );
}

/** The drawer's body: the cart page's nudge, lines, suggestions and summary, stacked. */
export function CartSheet({ lines, picks }: { lines: CartLine[]; picks: Product[] }) {
  const { subtotal } = totals(lines);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-6">
        {lines.length > 0 ? (
          <>
            <ShippingProgress subtotal={subtotal} />
            <CartLineList lines={lines} className="mt-4" />
          </>
        ) : (
          <p className="py-12 text-center text-muted-foreground">Your cart is empty.</p>
        )}
        {/* Keyed so emptying the cart starts the new row at its first card:
            scroll snapping would otherwise chase the card it last held. */}
        <CartSuggestions
          key={lines.length > 0 ? "pairs" : "start"}
          heading={lines.length > 0 ? "Pairs well with" : "Start with a favourite"}
          products={picks}
          className="mt-8"
        />
      </div>
      {lines.length > 0 && (
        <CartSummary lines={lines} className="border-t p-5">
          {/* Frama's pairing: check out, or the full page. The drawer closes
              itself on any link click. */}
          <Link
            href="/cart"
            className="mx-auto mt-3 flex h-8 w-fit items-center rounded-sm text-sm underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-foreground"
          >
            View cart
          </Link>
        </CartSummary>
      )}
    </>
  );
}
