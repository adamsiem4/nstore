import type { Metadata } from "next";
import { ProductGrid } from "@/components/store/product-grid";
import { getProducts } from "@/server/queries/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "The full nstore catalog.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
      <p className="mt-2 text-zinc-600">{products.length} products</p>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </>
  );
}
