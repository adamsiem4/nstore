import { PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CartSubmitButton } from "@/components/store/cart-submit-button";
import { money } from "@/lib/utils";
import { updateCart } from "@/server/cart";
import type { Product } from "@/types/product";

/**
 * Sits on the product tile at the same 12px radius as the product page's "Add
 * to cart", and keeps the light palette in both modes — so the outline
 * variant's dark: fills are overridden rather than inherited.
 */
function QuickAddButton({ product }: { product: Product }) {
  return (
    <form action={updateCart}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <CartSubmitButton
        compact
        variant="outline"
        size="sm"
        aria-label={`Add ${product.name} to cart`}
        className="border-shot-line bg-transparent text-shot-ink hover:bg-shot-ink/10 hover:text-shot-ink focus-visible:ring-shot-ink dark:border-shot-line dark:bg-transparent dark:hover:bg-shot-ink/10"
      >
        <PlusIcon className="size-3" />
        Add
      </CartSubmitButton>
    </form>
  );
}

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  /** first card in a grid: it is the LCP element, so it must not lazy-load */
  eager?: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-xl bg-product-shot p-2 text-shot-ink">
      <Link
        href={`/products/${product.id}`}
        className="flex flex-1 flex-col rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-shot-ink focus-visible:ring-offset-2 focus-visible:ring-offset-product-shot"
      >
        {/* The shot's own backdrop is --product-shot and so is the tile, in
            both modes — the image dissolves into it and only the corner
            radius shows. */}
        <Image
          src={product.image}
          alt={product.name}
          width={1536}
          height={1536}
          sizes="(max-width: 639px) 78vw, (max-width: 1023px) 45vw, 25vw"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="aspect-square w-full rounded-md object-cover"
        />
        <span
          aria-hidden="true"
          style={{ backgroundColor: product.color }}
          className="mt-4 ml-1 block size-2.5 rounded-full ring-1 ring-shot-ink/15"
        />
        <h2 className="mt-3 px-1 text-sm font-semibold tracking-wide uppercase">
          {product.name}
        </h2>
        {/* ponytail: first sentence, truncated by CSS — the catalog copy is
            spec-first, so sentence one is the one-line summary. */}
        <p className="mt-1 truncate px-1 font-mono text-xs text-shot-ink-muted">
          {product.description.split(". ")[0]}
        </p>
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3 px-1 pb-1">
        <p className="font-mono text-xs tabular-nums">{money.format(product.price)}</p>
        <QuickAddButton product={product} />
      </div>
    </article>
  );
}
