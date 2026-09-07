import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { money } from "@/lib/utils";
import { getProducts } from "@/server/queries/products";

export default async function HomePage() {
  const products = await getProducts();
  const [feature, ...rest] = products;

  return (
    <main className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <SiteHeader />

      <Separator className="my-5 sm:my-6" />

      <section className="grid flex-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Home appliances &amp; household goods
          </p>
          <h1 className="max-w-3xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            A better home.
            <br />
            Every day.
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            From your first coffee to a freshly made room. Thoughtful appliances
            and household essentials for the way you live.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/products"
              className={buttonVariants({
                className: "h-14 px-7 text-base",
              })}
            >
              Find your essentials
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <p className="text-sm leading-6 text-muted-foreground">
              {products.length} everyday essentials
              <br />
              30-day returns
            </p>
          </div>
        </div>

        <Link href={`/products/${feature.id}`} className="group block">
          <Card className="gap-0 bg-muted/40 transition-colors group-hover:bg-muted">
            <CardContent className="flex items-center justify-between gap-4">
              <Badge variant="outline" className="h-8 rounded-lg bg-card px-3 text-sm">
                New for home
              </Badge>
              <Badge
                variant="outline"
                className="h-8 rounded-lg bg-card px-3 text-sm"
              >
                {feature.category}
              </Badge>
            </CardContent>
            <CardContent>
              <Image
                src={feature.image}
                alt={feature.name}
                width={1536}
                height={1536}
                sizes="(max-width: 1023px) 100vw, 42vw"
                preload
                className="aspect-square max-h-96 w-full rounded-xl object-contain bg-[#eeede7]"
              />
            </CardContent>
            <CardContent className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Meet your daily helper</p>
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

      <section id="featured" className="pt-6 lg:flex lg:items-start lg:gap-10">
        <div className="mb-5 shrink-0 lg:mb-0 lg:w-52">
          <p className="text-sm text-muted-foreground">Made for home</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Everyday favourites
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
                  className="h-full transition-colors group-hover:bg-muted/60"
                >
                  <CardContent className="grid gap-3 xl:grid-cols-[4rem_1fr] xl:items-center">
                    <Image
                      src={product.image}
                      alt=""
                      width={1536}
                      height={1536}
                      sizes="64px"
                      className="size-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-base font-medium">{product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {money.format(product.price)}
                      </p>
                    </div>
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
