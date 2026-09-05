import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { money } from "@/lib/utils";
import { getProduct, getProducts } from "@/server/queries/products";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <main className="flex min-h-[calc(100svh-1rem)] flex-col rounded-lg border bg-card p-5 sm:min-h-[calc(100svh-1.5rem)] sm:p-8 lg:p-12">
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />
      <article className="grid flex-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ponytail: no image slot yet — placeholder block holds the layout */}
        <div className="aspect-square rounded-lg bg-gradient-to-br from-muted to-accent" />
        <div>
          <Link
            href="/products"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to shop
          </Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl">{money.format(product.price)}</p>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            {product.description}
          </p>
          {/* ponytail: no cart yet — a chip, not a fake button */}
          <Badge className="mt-10 h-12 rounded-lg px-8 text-base">
            Add to cart
          </Badge>
          <p className="mt-4 text-sm text-muted-foreground">
            Free shipping over $75 · 30-day returns
          </p>
        </div>
      </article>
    </main>
  );
}
