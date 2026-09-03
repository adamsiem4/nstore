import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid } from "@/components/store/product-grid";
import { getProducts } from "@/server/queries/products";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <section className="overflow-hidden rounded-[2rem] border bg-card text-card-foreground shadow-sm sm:rounded-[2.5rem]">
      <div className="relative isolate overflow-hidden border-b bg-muted/30 px-6 py-20 text-center sm:px-12 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute -top-32 right-0 -z-10 size-80 rounded-full bg-primary/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-0 -z-10 size-80 rounded-full bg-muted blur-3xl"
        />

        <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground" />
          Thoughtful essentials
        </p>
        <h1 className="mx-auto mt-7 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-7xl lg:text-8xl">
          Everyday things,
          <br />
          made well.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          A small catalog of durable basics, chosen for useful materials,
          quiet details, and daily wear.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className={buttonVariants({
              size: "lg",
              className: "h-11 rounded-full px-6",
            })}
          >
            Shop the collection
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
          <Link
            href="#featured"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "h-11 rounded-full px-6",
            })}
          >
            Featured picks
          </Link>
        </div>
        <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <li>Free shipping over $75</li>
          <li>30-day returns</li>
          <li>Made for daily use</li>
        </ul>
      </div>

      <div id="featured" className="scroll-mt-8 px-6 py-10 sm:px-10 sm:py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">The edit</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Featured pieces
            </h2>
          </div>
          <Link
            href="/products"
            className={buttonVariants({
              variant: "ghost",
              className: "rounded-full",
            })}
          >
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>
        <ProductGrid products={products.slice(0, 3)} />
      </div>
    </section>
  );
}
