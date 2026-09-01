import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <article className="grid gap-12 lg:grid-cols-2">
      {/* ponytail: no image slot yet — placeholder block holds the layout */}
      <div className="aspect-square rounded-[2rem] bg-zinc-100" />
      <div className="lg:py-8">
        <Link href="/products" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Back to shop
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-3 text-2xl">{money.format(product.price)}</p>
        <p className="mt-6 text-zinc-600">{product.description}</p>
        <span className="mt-10 inline-flex h-12 items-center rounded-full bg-zinc-900 px-8 font-medium text-white">
          Add to cart
        </span>
        <p className="mt-4 text-sm text-zinc-500">
          Free shipping over $75 · 30-day returns
        </p>
      </div>
    </article>
  );
}
