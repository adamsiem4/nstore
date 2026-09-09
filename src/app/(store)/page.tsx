import {
  ArrowDownIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  SmileIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, money } from "@/lib/utils";
import { getProducts } from "@/server/queries/products";

export default async function HomePage() {
  const products = await getProducts();
  const [feature, ...rest] = products;
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <a
        href="#home-content"
        className="sr-only z-50 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-4 focus:outline-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <Separator className="mt-5 sm:mt-6" />

      <main id="home-content" tabIndex={-1} className="outline-none">
        <section
          aria-labelledby="home-heading"
          className="grid items-center gap-10 py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-14"
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium tracking-wide">
              <SparklesIcon aria-hidden="true" className="size-4" />
              A little better, every day
            </p>
            <h1
              id="home-heading"
              className="mt-6 text-5xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-7xl xl:text-[5.5rem]"
            >
              Less chore.
              <br />
              More living.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Slow mornings. Big bakes. Fresh starts. Find home essentials that
              make your everyday a little more you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className={cn(
                  buttonVariants(),
                  "h-12 w-full gap-3 rounded-full px-6 text-sm focus-visible:ring-foreground min-[420px]:w-auto",
                )}
              >
                Shop the essentials
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
              <a
                href="#featured"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 w-full gap-3 rounded-full px-6 text-sm focus-visible:ring-foreground min-[420px]:w-auto",
                )}
              >
                Meet the favourites
                <ArrowDownIcon aria-hidden="true" className="size-4" />
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <SmileIcon aria-hidden="true" className="size-4 shrink-0" />
              Good things for the place you call home.
            </p>
          </div>

          <Link
            href={`/products/${feature.id}`}
            aria-labelledby="hero-product-name hero-product-price"
            className="group block rounded-xl border bg-muted/40 p-3 outline-none transition-[border-color,box-shadow] duration-200 hover:border-foreground/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-card sm:p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
              <span className="font-medium tracking-[0.12em] uppercase">
                The everyday edit
              </span>
              <span className="text-muted-foreground">{feature.category}</span>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-[#f3f2ef]">
              <Image
                src={feature.image}
                alt=""
                width={1536}
                height={1536}
                sizes="(max-width: 1023px) 100vw, 42vw"
                preload
                className="aspect-[6/5] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
              />
              <span
                aria-hidden="true"
                className="absolute right-4 bottom-4 flex size-20 rotate-6 flex-col items-center justify-center gap-1 rounded-full border border-foreground/10 bg-card text-center text-[11px] leading-3 font-medium text-card-foreground shadow-sm sm:size-24 sm:text-xs sm:leading-4"
              >
                <SmileIcon className="size-6" />
                Home, sweet
                <br />
                home.
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-1 pt-4 pb-1">
              <div>
                <h2 id="hero-product-name" className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {feature.name}
                </h2>
                <p id="hero-product-price" className="mt-1 text-sm text-muted-foreground">
                  {money.format(feature.price)}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary/80"
              >
                <ArrowRightIcon className="size-5 transition-transform duration-200 motion-safe:group-hover:-rotate-45" />
              </span>
            </div>
          </Link>
        </section>

        <ul aria-label="Shopping with nstore" className="grid gap-5 border-y py-6 sm:grid-cols-3 sm:gap-6">
          <li className="flex items-center gap-3">
            <TruckIcon aria-hidden="true" className="size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">A little extra, on us</p>
              <p className="mt-1 text-sm text-muted-foreground">Free shipping on orders over €60</p>
            </div>
          </li>
          <li className="flex items-center gap-3 sm:justify-center">
            <RotateCcwIcon aria-hidden="true" className="size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Make yourself at home</p>
              <p className="mt-1 text-sm text-muted-foreground">30 days to change your mind</p>
            </div>
          </li>
          <li className="flex items-center gap-3 sm:justify-end">
            <SparklesIcon aria-hidden="true" className="size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Small upgrades. Big smiles.</p>
              <p className="mt-1 text-sm text-muted-foreground">{products.length} everyday essentials to explore</p>
            </div>
          </li>
        </ul>

        <section
          id="featured"
          tabIndex={-1}
          aria-labelledby="featured-heading"
          className="scroll-mt-6 py-10 outline-none sm:py-12"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Meet your daily helpers</p>
              <h2 id="featured-heading" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Little upgrades. Big yes.
              </h2>
            </div>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 gap-3 rounded-full px-5 focus-visible:ring-foreground",
              )}
            >
              Shop all essentials
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {rest.slice(0, 4).map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="group flex h-full flex-col rounded-xl border p-2.5 outline-none transition-[border-color,box-shadow] duration-200 hover:border-foreground/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-card sm:p-3"
                >
                  <div className="overflow-hidden rounded-xl bg-[#f3f2ef]">
                    <Image
                      src={product.image}
                      alt=""
                      width={1536}
                      height={1536}
                      sizes="(max-width: 1023px) 50vw, 25vw"
                      className="aspect-square w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.035]"
                    />
                  </div>
                  <div className="px-1 pt-4">
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                    <h3 className="mt-1 text-sm leading-6 font-medium sm:text-base">{product.name}</h3>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-2 pb-1">
                    <p className="text-sm text-muted-foreground">{money.format(product.price)}</p>
                    <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="categories-heading" className="rounded-xl bg-muted/60 p-5 sm:p-8">
          <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Every corner, covered.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            From the first coffee to the last load of laundry. Where shall we start?
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  href={`/products?q=${encodeURIComponent(category)}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 gap-3 rounded-full px-4 focus-visible:ring-foreground",
                  )}
                >
                  {category}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold tracking-tight">nstore</span>
        <p className="text-muted-foreground">A little better, every day.</p>
      </footer>
    </div>
  );
}
