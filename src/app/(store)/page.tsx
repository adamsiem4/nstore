import {
  ArrowDownIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DragRow } from "@/components/store/drag-row";
import { ProductCard } from "@/components/store/product-card";
import { pillButtonVariants } from "@/components/ui/pill-button";
import { getProducts } from "@/server/queries/products";

export default async function HomePage() {
  const products = await getProducts();
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">

      <main id="content" tabIndex={-1} className="outline-none">
        <section
          aria-labelledby="home-heading"
          className="relative isolate -mx-2 -mt-2 flex min-h-[calc(100svh-var(--chrome))] flex-col items-center justify-center overflow-hidden rounded-xl border px-6 py-16 text-center text-hero-ink sm:-mx-5 sm:-mt-5 sm:px-10 sm:py-24 lg:-mx-7 lg:-mt-7"
        >
          {/* ponytail: two <Image>s toggled by the dark class — a useTheme()
              client boundary would cost a hydration flash on the LCP element.
              Opacity, not `hidden`: a display:none fill image measures 0px
              wide and next/image then warns about `sizes`.
              Both sit in the viewport, so both download whatever `loading`
              says; eager only stops the LCP element going through the lazy
              path, and fetchPriority replaces `priority`, deprecated in 16.
              `preload` stays off: that one really would add two <link>s. */}
          <Image
            src="/hero-gradient-light.webp"
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="-z-10 object-cover dark:opacity-0"
          />
          <Image
            src="/hero-gradient-dark.webp"
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="-z-10 object-cover opacity-0 dark:opacity-100"
          />
          {/* ponytail: colours come from --hero-* in globals.css, so the scrim
              is one element with no dark: variant — it is transparent in
              light, 40% black over the dark mesh. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-hero-scrim" />
          <h1
            id="home-heading"
            className="text-5xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-7xl xl:text-[5.5rem]"
          >
            Less chore.
            <br />
            More living.
          </h1>
          <p className="mt-6 max-w-md text-pretty text-base leading-7 text-hero-ink-muted sm:text-lg sm:leading-8">
            Slow mornings. Big bakes. Fresh starts. Find home essentials that
            make your everyday a little more you.
          </p>
          <div className="mt-8 flex w-full flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className={pillButtonVariants({
                className: "h-12 w-full gap-3 bg-hero-cta px-6 text-sm text-hero-cta-ink hover:bg-hero-cta/90 focus-visible:ring-hero-cta focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-[420px]:w-auto",
              })}
            >
              Shop the essentials
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
            <a
              href="#featured"
              className={pillButtonVariants({
                variant: "outline",
                // dark: overrides exist because the outline variant ships its
                // own dark:border-input / dark:bg-input fills; tailwind-merge
                // keeps the last class per property, so these win.
                className: "h-12 w-full gap-3 border-hero-line bg-transparent px-6 text-sm text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink focus-visible:ring-hero-cta focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-[420px]:w-auto dark:border-hero-line dark:bg-transparent dark:hover:bg-hero-ink/10",
              })}
            >
              Meet the favourites
              <ArrowDownIcon aria-hidden="true" className="size-4" />
            </a>
          </div>
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
              className={pillButtonVariants({
                variant: "outline",
                className: "h-11 gap-3 px-5 focus-visible:ring-foreground",
              })}
            >
              Shop all essentials
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>
          {/* ponytail: scroll-snap, not a carousel library — wheel, touch and
              keyboard come free from the overflow container; DragRow only adds
              mouse drag. The -m-2/p-2 pair keeps the card ring from clipping
              without moving the row. */}
          <DragRow className="-m-2 grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-p-2 p-2 [scrollbar-width:none] sm:auto-cols-[45%] sm:gap-4 lg:auto-cols-[calc((100%-3rem)/4)] [&::-webkit-scrollbar]:hidden">
            {products.slice(0, 8).map((product) => (
              <li key={product.id} className="snap-start">
                <ProductCard product={product} />
              </li>
            ))}
          </DragRow>
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
                  className={pillButtonVariants({
                    variant: "outline",
                    className: "h-11 gap-3 px-4 focus-visible:ring-foreground",
                  })}
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
