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
        "flex h-full flex-col rounded-lg bg-product-shot p-1.5 text-shot-ink",
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        <Skeleton className="aspect-square w-full rounded-md bg-shot-ink/10" />
        <Skeleton className="mt-2.5 ml-1 size-2 rounded-full bg-shot-ink/10" />
        <Skeleton className="mt-1.5 ml-1 h-4 w-3/5 bg-shot-ink/10" />
        <Skeleton className="mt-1 ml-1 h-3 w-4/5 bg-shot-ink/10" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 px-1 pb-0.5">
        <Skeleton className="h-4 w-16 bg-shot-ink/10" />
        <Skeleton className="h-7 w-18 rounded-xl bg-shot-ink/10" />
      </div>
    </article>
  );
}
