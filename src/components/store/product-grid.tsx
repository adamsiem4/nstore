import { ProductCard } from "@/components/store/product-card";
import type { Product } from "@/types/product";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    // grid-cols-1, not a bare grid: the implicit track is auto-sized and the
    // card's truncated description is nowrap, so its min-content is the whole
    // sentence — one column would push the page 600px wide on a phone.
    // minmax(0,1fr) floors the track at zero and lets truncate do its job.
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
