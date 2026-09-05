import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/header";
import { ProductGrid } from "@/components/store/product-grid";
import { Separator } from "@/components/ui/separator";
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
    <main className="flex min-h-[calc(100svh-1rem)] flex-col rounded-lg border bg-card p-5 sm:min-h-[calc(100svh-1.5rem)] sm:p-8 lg:p-12">
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Shop
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {products.length} products
        {query ? ` matching “${query}”` : ""}
      </p>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </main>
  );
}
