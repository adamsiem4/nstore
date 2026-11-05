import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types/product";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    // grid-cols-N, not a bare grid: the implicit track is auto-sized and the
    // card's truncated description is nowrap, so its min-content is the whole
    // sentence — an auto track would push the page 600px wide on a phone.
    // minmax(0,1fr) floors the track at zero and lets truncate do its job.
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} eager={index === 0} />
        </li>
      ))}
    </ul>
  );
}
