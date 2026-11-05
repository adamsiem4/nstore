import { ProductCardSkeleton } from "@/components/products/product-card-skeleton";
import { LoadingRegion } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductGridSkeleton({
  count = 6,
  label = "Loading products",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </LoadingRegion>
  );
}
