import Link from "next/link";
import { money } from "@/lib/utils";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full rounded-lg border bg-background p-4 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* ponytail: no image slot yet — placeholder block keeps the grid honest */}
      <div className="aspect-4/3 rounded-lg bg-gradient-to-br from-muted to-accent" />
      <h3 className="mt-5 font-medium">{product.name}</h3>
      <p className="mt-1 text-muted-foreground">{money.format(product.price)}</p>
    </Link>
  );
}
