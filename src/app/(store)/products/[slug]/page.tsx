import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/store/cart";
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
    <main
      id="content"
      tabIndex={-1}
      className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10"
    >
      <article className="grid flex-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Image
          src={product.image}
          alt={product.name}
          width={1536}
          height={1536}
          sizes="(max-width: 1023px) 100vw, 50vw"
          preload
          className="aspect-square w-full rounded-xl object-cover"
        />
        <div>
          <Link
            href="/products"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to shop
          </Link>
          <p className="mt-6 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {product.category}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl">{money.format(product.price)}</p>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            {product.description}
          </p>
          <AddToCartButton product={product} />
          <p className="mt-4 text-sm text-muted-foreground">
            Free shipping over €60 · 30-day returns
          </p>
        </div>
      </article>
    </main>
  );
}
