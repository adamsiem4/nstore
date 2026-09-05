import { ArrowRightIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

  return (
    <main className="flex min-h-[calc(100svh-1rem)] flex-col rounded-lg border bg-card p-5 sm:min-h-[calc(100svh-1.5rem)] sm:p-8 lg:p-12">
      <SiteHeader />

      <Separator className="mt-5 sm:mt-7" />

      <nav aria-label="Product categories" className="py-3">
        <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`/products?q=${encodeURIComponent(category)}`}
                className={buttonVariants({
                  variant: "ghost",
                  className: "h-10 px-4 text-sm text-muted-foreground",
                })}
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      <section className="grid flex-1 items-center gap-10 py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-14">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Thoughtful everyday goods
          </p>
          <h1 className="max-w-3xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            Fewer things.
            <br />
            Better made.
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            Durable clothing and useful objects, selected for honest materials,
            quiet details, and daily wear.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/products"
              className={buttonVariants({
                className: "h-14 px-7 text-base",
              })}
            >
              Shop the collection
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <p className="text-sm leading-6 text-muted-foreground">
              Free shipping over $75
              <br />
              30-day returns
            </p>
          </div>
        </div>

        <Link href={`/products/${feature.id}`} className="group block">
          <Card className="gap-0 rounded-lg bg-muted/40 transition-colors group-hover:bg-muted">
            <CardContent className="flex items-center justify-between gap-4">
              <Badge variant="outline" className="h-8 rounded-lg bg-card px-3 text-sm">
                New arrival
              </Badge>
              <Badge
                variant="outline"
                className="h-8 gap-1.5 rounded-lg bg-card px-3 text-sm"
              >
                <StarIcon className="fill-current text-amber-500" />
                4.9
              </Badge>
            </CardContent>
            {/* ponytail: no image slot yet — placeholder block holds the layout */}
            <CardContent>
              <div className="h-56 rounded-lg bg-gradient-to-br from-background to-accent sm:h-72 lg:h-80" />
            </CardContent>
            <CardContent className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Featured piece</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {feature.name}
                </h2>
                <p className="mt-2 max-w-sm text-base leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <p className="shrink-0 text-xl font-semibold">
                {money.format(feature.price)}
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      <Separator />

      <section id="featured" className="pt-6 sm:flex sm:items-start sm:gap-10">
        <div className="mb-5 shrink-0 sm:mb-0 sm:w-52">
          <p className="text-sm text-muted-foreground">The edit</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Featured pieces
          </h2>
          <Link
            href="/products"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            View all
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <ul className="grid flex-1 gap-3 sm:grid-cols-3">
          {rest.slice(0, 3).map((product) => (
            <li key={product.id}>
              <Link href={`/products/${product.id}`} className="group block h-full">
                <Card
                  size="sm"
                  className="h-full rounded-lg transition-colors group-hover:bg-muted/60"
                >
                  <CardContent className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-medium">{product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {money.format(product.price)}
                      </p>
                    </div>
                    <ArrowRightIcon className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
