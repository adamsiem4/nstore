import Link from "next/link";
import { ProductGrid } from "@/components/store/product-grid";
import { getProducts } from "@/server/queries/products";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <section className="rounded-[2.5rem] bg-zinc-100 px-8 py-20 text-center sm:px-16 sm:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          New season
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Everyday things, made well.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600">
          A small catalog of durable basics. Free shipping over $75, returns for
          30 days.
        </p>
        <Link
          href="/products"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white hover:bg-zinc-700"
        >
          Shop the collection
        </Link>
      </section>

      <section className="mt-20">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
          <Link href="/products" className="text-sm text-zinc-600 hover:text-zinc-900">
            View all
          </Link>
        </div>
        <ProductGrid products={products.slice(0, 3)} />
      </section>
    </>
  );
}
