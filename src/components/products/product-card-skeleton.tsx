import type { ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Loading counterpart to ProductCard; keep its frame and content rhythm in sync. */
export function ProductCardSkeleton({
  className,
  ...props
}: ComponentProps<"article">) {
  return (
    <article
      {...props}
      aria-hidden="true"
      className={cn(
        "flex h-full flex-col rounded-xl bg-product-shot p-2 text-shot-ink",
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        <Skeleton className="aspect-square w-full rounded-md bg-shot-ink/10" />
        <Skeleton className="mt-4 ml-1 size-2.5 rounded-full bg-shot-ink/10" />
        <Skeleton className="mt-3 ml-1 h-5 w-3/5 bg-shot-ink/10" />
        <Skeleton className="mt-1 ml-1 h-4 w-4/5 bg-shot-ink/10" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 px-1 pb-1">
        <Skeleton className="h-4 w-16 bg-shot-ink/10" />
        <Skeleton className="h-7 w-18 rounded-xl bg-shot-ink/10" />
      </div>
    </article>
  );
}
