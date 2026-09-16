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
import { buttonVariants } from "@/components/ui/button";
import { cn, money } from "@/lib/utils";
import { getProducts } from "@/server/queries/products";

export default async function HomePage() {
  const products = await getProducts();
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">

      <main id="content" tabIndex={-1} className="outline-none">
        <section
          aria-labelledby="home-heading"
          className="relative isolate -mx-2 -mt-2 mb-10 flex min-h-[calc(100svh-var(--chrome)-var(--promo))] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-16 text-center text-neutral-900 sm:-mx-5 sm:-mt-5 sm:mb-12 sm:px-10 sm:py-24 lg:-mx-7 lg:-mt-7 dark:text-white"
        >
          {/* ponytail: two <Image>s toggled by the dark class — a useTheme()
              client boundary would cost a hydration flash on the LCP element.
              Opacity, not `hidden`: a display:none fill image measures 0px
              wide and next/image then warns about `sizes`. */}
          <Image
            src="/hero-gradient-light.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover dark:opacity-0"
          />
          <Image
            src="/hero-gradient-dark.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover opacity-0 dark:opacity-100"
          />
          {/* ponytail: scrim, not decoration — the dark mesh's teal streak is
              3.2:1 against white text on its own, 7.4:1 under this scrim. The
              light mesh carries dark text at 6.9:1, so it needs none. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 hidden bg-black/40 dark:block"
          />
          <p className="inline-flex items-center gap-2 rounded-full border border-neutral-900/20 bg-white/45 px-3 py-2 text-xs font-medium tracking-wide dark:border-white/35 dark:bg-white/10">
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
          <p className="mt-6 max-w-md text-pretty text-base leading-7 text-neutral-800 sm:text-lg sm:leading-8 dark:text-white/85">
            Slow mornings. Big bakes. Fresh starts. Find home essentials that
            make your everyday a little more you.
          </p>
          <div className="mt-8 flex w-full flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className={cn(
                buttonVariants(),
                "h-12 w-full gap-3 rounded-full bg-neutral-900 px-6 text-sm text-white hover:bg-neutral-900/90 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-[420px]:w-auto dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 dark:focus-visible:ring-white",
              )}
            >
              Shop the essentials
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
            <a
              href="#featured"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 w-full gap-3 rounded-full border-neutral-900/35 bg-transparent px-6 text-sm text-neutral-900 hover:bg-neutral-900/10 hover:text-neutral-900 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-[420px]:w-auto dark:border-white/45 dark:text-white dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white",
              )}
            >
              Meet the favourites
              <ArrowDownIcon aria-hidden="true" className="size-4" />
            </a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-neutral-800 dark:text-white/80">
            <SmileIcon aria-hidden="true" className="size-4 shrink-0" />
            Good things for the place you call home.
          </p>
        </section>

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
            {products.slice(0, 4).map((product) => (
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

        <ul aria-label="Shopping with nstore" className="mt-10 grid gap-5 border-t pt-8 sm:mt-12 sm:grid-cols-3 sm:gap-6">
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
      </main>

    </div>
  );
}
