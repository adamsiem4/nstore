import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/header";
import { ProductGrid } from "@/components/store/product-grid";
import { Separator } from "@/components/ui/separator";
import { getProducts } from "@/server/queries/products";

export const metadata: Metadata = {
  title: "Shop Home Essentials",
  description:
    "Discover home appliances and household goods: kitchen appliances, cookware, cleaning, laundry, storage, and home comfort.",
};

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : undefined;
  const products = await getProducts(query);

  return (
    <main className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />
      <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Home appliances &amp; household goods
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        {query ? "Find your everyday." : "A little better, every day."}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {products.length} products
        {query ? ` matching “${query}”` : ""}
      </p>
      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-muted-foreground">
            No essentials found. Try “kettle”, “laundry”, or a category above.
          </p>
        )}
      </div>
    </main>
  );
}
