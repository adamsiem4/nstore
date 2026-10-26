import { ProductCardSkeleton } from "@/components/products/product-card-skeleton";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

const sectionHeadingClass = "text-xs font-semibold tracking-[0.14em] uppercase";

export function ProductDetailSkeleton() {
  return (
    <LoadingRegion label="Loading product details">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>Shop</li>
          <li aria-hidden="true">/</li>
          <li>
            <Skeleton className="h-5 w-20" />
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Skeleton className="h-5 w-28" />
          </li>
        </ol>
      </nav>

      <article className="mt-6 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-product-shot">
          <Skeleton className="absolute inset-0 rounded-none bg-shot-ink/10" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="mt-3 h-10 w-4/5 sm:h-12" />
          <Skeleton className="mt-4 h-8 w-24" />
          <div className="mt-6 max-w-lg space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="mt-10 h-12 w-full max-w-sm rounded-xl" />
          <Skeleton className="mt-4 h-5 w-64 max-w-full" />
        </div>
      </article>

      <section aria-labelledby="highlights-heading" className="mt-12 border-t pt-10 sm:mt-16">
        <h2 id="highlights-heading" className={sectionHeadingClass}>
          Key details
        </h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="rounded-xl bg-surface p-5 sm:p-6">
              <Skeleton className="h-6 w-2/3" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
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
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex items-baseline justify-between gap-6 border-b py-3 first:border-t"
              >
                <dt>
                  <Skeleton className="h-5 w-24" />
                </dt>
                <dd>
                  <Skeleton className="h-5 w-20" />
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="font-medium">Materials</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div>
              <h3 className="font-medium">In the box</h3>
              <div className="mt-3 flex flex-col gap-1">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex h-5 items-center gap-2">
                    <span aria-hidden="true">·</span>
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-medium">Care</h3>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 border-t pt-10 sm:mt-16">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </section>
    </LoadingRegion>
  );
}

export function RelatedProductsSkeleton({ category }: { category: string }) {
  return (
    <section aria-labelledby="related-heading" className="mt-12 border-t pt-10 sm:mt-16">
      <h2 id="related-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        More in {category.toLowerCase()}
      </h2>
      <LoadingRegion label={`Loading more products in ${category}`}>
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </LoadingRegion>
    </section>
  );
}
