import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/store/cart";
import { ProductCard } from "@/components/store/product-card";
import { money } from "@/lib/utils";
import { getProductDetails } from "@/server/queries/product-details";
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

const crumbClass =
  "rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground";
const sectionHeadingClass = "text-xs font-semibold tracking-[0.14em] uppercase";

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const [product, details, catalog] = await Promise.all([
    getProduct(slug),
    getProductDetails(slug),
    getProducts(),
  ]);
  if (!product || !details) notFound();

  const related = catalog
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <main
      id="content"
      tabIndex={-1}
      className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10"
    >
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/products" className={crumbClass}>
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?q=${encodeURIComponent(product.category)}`}
              className={crumbClass}
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* One square render is all the photography this catalog has, so the hero
          stays a two-column lockup and the detail sheet runs full width under
          it — a pinned gallery column would just hold a hole open. */}
      <article className="mt-6 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <Image
          src={product.image}
          alt={product.name}
          width={1536}
          height={1536}
          sizes="(max-width: 1023px) 100vw, 50vw"
          preload
          className="aspect-square w-full rounded-xl bg-product-shot object-cover"
        />

        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              style={{ backgroundColor: product.color }}
              className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/15"
            />
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {product.category}
            </p>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl tabular-nums">{money.format(product.price)}</p>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            {product.description}
          </p>
          <AddToCartButton product={product} />
          <p className="mt-4 text-sm text-muted-foreground">
            Free shipping over €60 · 30-day returns
          </p>
        </div>
      </article>

      <section aria-labelledby="highlights-heading" className="mt-12 border-t pt-10 sm:mt-16">
        <h2 id="highlights-heading" className={sectionHeadingClass}>
          Key details
        </h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {details.highlights.map((highlight) => (
            <li key={highlight.title} className="rounded-xl bg-surface p-5 sm:p-6">
              <h3 className="font-medium">{highlight.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {highlight.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="specs-heading" className="mt-12 border-t pt-10">
        <h2 id="specs-heading" className={sectionHeadingClass}>
          Specifications
        </h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <dl className="text-sm">
            {details.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-6 border-b py-3 first:border-t"
              >
                <dt className="text-muted-foreground">{spec.label}</dt>
                <dd className="text-right font-medium tabular-nums">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="font-medium">Materials</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {details.materials.map((material) => (
                  <li
                    key={material}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {material}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium">In the box</h3>
              <ul className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                {details.inBox.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-medium">Care</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{details.care}</p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12 border-t pt-10 sm:mt-16">
          <h2
            id="related-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            More in {product.category.toLowerCase()}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
