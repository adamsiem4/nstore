import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/header";
import { ProductGrid } from "@/components/store/product-grid";
import { getProducts } from "@/server/queries/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "The full nstore catalog.",
};

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : undefined;
  const products = await getProducts(query);

  return (
    <div className="flex flex-col gap-3 rounded-[2rem] bg-muted/50 p-3 sm:rounded-[2.5rem] sm:p-4">
      <SiteHeader />
      <div className="rounded-[1.75rem] bg-card p-6 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
        <p className="mt-2 text-muted-foreground">
          {products.length} products
          {query ? ` matching “${query}”` : ""}
        </p>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
