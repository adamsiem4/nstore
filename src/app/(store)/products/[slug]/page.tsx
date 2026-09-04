import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/header";
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
    <div className="flex flex-col gap-3 rounded-[2rem] bg-muted/50 p-3 sm:rounded-[2.5rem] sm:p-4">
      <SiteHeader />
      <article className="grid gap-8 rounded-[1.75rem] bg-card p-6 sm:p-10 lg:grid-cols-2 lg:gap-12">
        {/* ponytail: no image slot yet — placeholder block holds the layout */}
        <div className="aspect-square rounded-[1.5rem] bg-gradient-to-br from-muted to-accent" />
        <div className="lg:py-8">
          <Link
            href="/products"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to shop
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-2xl">{money.format(product.price)}</p>
          <p className="mt-6 text-muted-foreground">{product.description}</p>
          {/* ponytail: no cart yet — a chip, not a fake button */}
          <span className="mt-10 inline-flex h-12 items-center rounded-full bg-primary px-8 font-medium text-primary-foreground">
            Add to cart
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Free shipping over $75 · 30-day returns
          </p>
        </div>
      </article>
    </div>
  );
}
