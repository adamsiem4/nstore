import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  StarIcon,
  TagIcon,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button";
import { money } from "@/lib/utils";
import { getProducts } from "@/server/queries/products";

const categories = [
  "Outerwear",
  "Knitwear",
  "Bags",
  "Accessories",
  "Socks",
  "Leather",
];

export default async function HomePage() {
  const products = await getProducts();
  const [feature, ...rest] = products;
  const edit = rest.slice(0, 3);

  return (
    <div className="flex min-h-[calc(100svh-1.5rem)] flex-col gap-3 rounded-[2rem] bg-muted/50 p-3 sm:min-h-[calc(100svh-2rem)] sm:rounded-[2.5rem] sm:p-4">
      <SiteHeader />

      <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <li key={category}>
            <Link
              href={`/products?q=${encodeURIComponent(category)}`}
              className="inline-flex h-11 items-center rounded-full bg-card px-6 text-sm whitespace-nowrap shadow-sm transition-colors hover:bg-accent"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid flex-1 gap-3 lg:grid-cols-4 lg:grid-rows-[1.35fr_1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-accent to-card p-6 lg:row-span-2">
          <h2 className="text-4xl font-semibold tracking-[-0.04em]">
            New arrivals
          </h2>
          <Link
            href={`/products/${feature.id}`}
            className="group mt-8 block rounded-3xl bg-card/80 p-5 shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold">
                  {money.format(feature.price)}
                </p>
                <p className="text-sm text-muted-foreground">{feature.name}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-medium">
                <StarIcon className="size-3.5 fill-current text-amber-500" />
                4.9
              </span>
            </div>
            <div className="mt-5 aspect-4/3 rounded-2xl bg-gradient-to-br from-muted to-accent" />
            <p className="mt-4 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </Link>
          <Link
            href="/products"
            className="mt-6 flex h-14 items-center justify-between rounded-full bg-card/80 pr-2 pl-6 text-sm shadow-sm backdrop-blur transition-colors hover:bg-card"
          >
            Browse the catalog
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <ArrowRightIcon className="size-4" />
            </span>
          </Link>
        </section>

        <section className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-card p-8 lg:col-span-2">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-16 size-72 rounded-full bg-accent/70 blur-3xl"
          />
          <div className="relative">
            <h1 className="max-w-md text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Everyday things, made well.
            </h1>
            <p className="mt-4 max-w-sm text-pretty text-muted-foreground">
              A small catalog of durable basics, chosen for useful materials,
              quiet details, and daily wear.
            </p>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className={buttonVariants({
                size: "lg",
                className: "h-12 rounded-full px-6",
              })}
            >
              Shop the collection
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <span className="inline-flex h-12 items-center gap-2 rounded-full bg-muted px-5 text-sm">
              <TagIcon className="size-4" />
              {products.length} pieces in stock
            </span>
          </div>
        </section>

        <div className="flex flex-col gap-3 lg:row-span-2">
          <section className="flex-1 rounded-[1.75rem] bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase">
                Our promise
              </p>
              <ArrowUpRightIcon className="size-4 text-muted-foreground" />
            </div>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground">Free shipping</span> over $75
              </li>
              <li>
                <span className="text-foreground">30-day returns</span>, no
                questions
              </li>
              <li>
                <span className="text-foreground">Made for daily use</span>, not
                for show
              </li>
            </ul>
          </section>

          <section className="flex-1 rounded-[1.75rem] bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase">
                Your account
              </p>
              <ArrowUpRightIcon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              <span className="text-foreground">Sign in</span> to keep your
              orders and addresses in one place.
            </p>
            <Link
              href="/sign-up"
              className={buttonVariants({
                size: "lg",
                className: "mt-5 h-11 w-full rounded-full",
              })}
            >
              Create an account
            </Link>
          </section>
        </div>

        <section
          id="featured"
          className="scroll-mt-8 rounded-[1.75rem] bg-card p-6 lg:col-span-2"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">The edit</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
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
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {edit.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="group block h-full rounded-3xl bg-muted/60 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-background to-accent" />
                  <p className="mt-4 font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {money.format(product.price)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
