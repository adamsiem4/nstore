import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/utils";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full rounded-xl border bg-background p-4 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="overflow-hidden rounded-xl">
        <Image
          src={product.image}
          alt={product.name}
          width={1536}
          height={1536}
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="aspect-square w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
        {product.category}
      </p>
      <h2 className="mt-1 font-medium">{product.name}</h2>
      <p className="mt-1 text-muted-foreground">{money.format(product.price)}</p>
    </Link>
  );
}
