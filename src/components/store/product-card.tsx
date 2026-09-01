import Link from "next/link";
import { money } from "@/lib/utils";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block rounded-3xl border border-zinc-200 p-6 transition-colors hover:border-zinc-400"
    >
      {/* ponytail: no image slot yet — placeholder block keeps the grid honest */}
      <div className="aspect-4/3 rounded-2xl bg-zinc-100" />
      <h3 className="mt-5 font-medium">{product.name}</h3>
      <p className="mt-1 text-zinc-600">{money.format(product.price)}</p>
    </Link>
  );
}
