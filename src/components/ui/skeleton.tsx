import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("block rounded-md bg-foreground/10 motion-safe:animate-pulse", className)}
    />
  );
}

export function LoadingRegion({
  label = "Loading content",
  children,
  ...props
}: ComponentProps<"div"> & { label?: string }) {
  return (
    <div {...props} role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
