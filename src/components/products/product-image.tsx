"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProductImageProps = Omit<ImageProps, "fill" | "placeholder" | "onLoad" | "onError">;

export function ProductImage({ src, className, alt, ...props }: ProductImageProps) {
  const [settledSource, setSettledSource] = useState<ImageProps["src"] | null>(null);
  const loading = settledSource !== src;

  return (
    <span className={cn("relative block overflow-hidden bg-product-shot", className)} data-image-loading={loading}>
      {loading && <Skeleton className="absolute inset-0 rounded-none bg-shot-ink/10" />}
      <Image
        {...props}
        src={src}
        alt={alt}
        className="relative h-full w-full object-cover"
        ref={(image) => {
          if (image?.complete) setSettledSource(src);
        }}
        onLoad={() => setSettledSource(src)}
        onError={() => setSettledSource(src)}
      />
    </span>
  );
}
