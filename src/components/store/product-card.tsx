import Image from "next/image";
import Link from "next/link";
import { QuickAddButton } from "@/components/store/cart";
import { money } from "@/lib/utils";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col rounded-xl bg-product-shot p-2 dark:bg-surface">
      <Link
        href={`/products/${product.id}`}
        className="flex flex-1 flex-col rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-product-shot dark:focus-visible:ring-offset-surface"
      >
        {/* The shot's own backdrop is --product-shot, so in light mode the
            image dissolves into the card and only the corner radius shows. */}
        <Image
          src={product.image}
          alt={product.name}
          width={1536}
          height={1536}
          sizes="(max-width: 639px) 78vw, (max-width: 1023px) 45vw, 25vw"
          className="aspect-square w-full rounded-md object-cover"
        />
        <span
          aria-hidden="true"
          style={{ backgroundColor: product.color }}
          className="mt-4 ml-1 block size-2.5 rounded-full ring-1 ring-foreground/15"
        />
        <h2 className="mt-3 px-1 text-sm font-semibold tracking-wide uppercase">
          {product.name}
        </h2>
        {/* ponytail: first sentence, truncated by CSS — the catalog copy is
            spec-first, so sentence one is the one-line summary. */}
        <p className="mt-1 truncate px-1 font-mono text-xs text-muted-foreground">
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
