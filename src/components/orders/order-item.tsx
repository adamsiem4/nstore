import Link from "next/link";
import { ProductImage } from "@/components/products/product-image";
import type { Order } from "@/server/queries/orders";

export const orderDate = new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" });
export const orderMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);

export function OrderItem({ item }: { item: Order["items"][number] }) {
  const { product } = item;
  return (
    <li className="flex items-center gap-4 py-4">
      {product && (
        // Same destination as the name beside it; one tab stop is enough.
        <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <ProductImage
            src={product.image}
            alt=""
            width={256}
            height={256}
            sizes="80px"
            className="size-20 rounded-lg"
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
              {item.name}
            </Link>
          ) : (
            <p className="text-sm font-semibold tracking-wide uppercase">{item.name}</p>
          )}
          <p className="mt-1 font-mono text-xs text-muted-foreground">Qty {item.quantity}</p>
        </div>
        <p className="shrink-0 font-mono text-xs tabular-nums">{orderMoney(item.amount, item.currency)}</p>
      </div>
    </li>
  );
}
