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
      <ul className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </LoadingRegion>
  );
}
