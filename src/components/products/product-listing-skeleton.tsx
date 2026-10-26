import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductResultsSkeleton({ query }: { query?: string }) {
  return (
    <>
      <Skeleton className="mt-3 h-7 w-44 max-w-full" />
      <div className="mt-10">
        <ProductGridSkeleton
          label={query ? `Searching products for ${query}` : "Loading products"}
        />
      </div>
    </>
  );
}

export function ProductListingSkeleton() {
  return (
    <>
      <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Home appliances &amp; household goods
      </p>
      <Skeleton className="mt-3 h-10 w-3/4 max-w-xl sm:h-12" />
      <ProductResultsSkeleton />
    </>
  );
}
