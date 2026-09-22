"use client";

import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ComponentProps, startTransition, useEffect, useState } from "react";
import { SoftPillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import { addToCart } from "@/server/cart";

/** Enhances a native cart form with pending, success, and failure feedback. */
export function CartSubmitButton({
  children,
  className,
  disabled,
  compact = false,
  ...props
}: Omit<ComponentProps<typeof SoftPillButton>, "onClick" | "formAction"> & {
  compact?: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<"pending" | "stay" | "cart" | "error" | null>(null);
  const pending = confirmation === "pending";
  const added = confirmation === "stay" || confirmation === "cart";
  const failed = confirmation === "error";

  useEffect(() => {
    if (!confirmation || confirmation === "pending") return;
    const timeout = window.setTimeout(() => {
      if (confirmation === "cart") router.push("/cart");
      else setConfirmation(null);
    }, failed ? 3000 : 2000);
    return () => window.clearTimeout(timeout);
  }, [confirmation, failed, router]);

  return (
    <>
      <SoftPillButton
        {...props}
        type="submit"
        aria-busy={pending}
        disabled={disabled || pending || added}
        onClick={(event) => {
          const form = event.currentTarget.form;
          if (!form) return;
          event.preventDefault();
          setConfirmation("pending");
          const formData = new FormData(form);
          startTransition(async () => {
            try {
              const changed = await addToCart(formData);
              setConfirmation(changed ? (formData.get("next") === "/cart" ? "cart" : "stay") : "error");
            } catch {
              setConfirmation("error");
            }
          });
        }}
        className={cn(
          "relative overflow-hidden duration-200 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
          compact && "min-w-24",
          (pending || added) && "disabled:opacity-100",
          className,
          added &&
            "border-success bg-success text-success-foreground hover:bg-success hover:text-success-foreground dark:border-success dark:bg-success dark:hover:bg-success",
          failed &&
            "border-error bg-error text-error-foreground hover:bg-error hover:text-error-foreground dark:border-error dark:bg-error dark:hover:bg-error",
        )}
      >
        <span
          className={cn(
            "inline-flex w-full items-center gap-[inherit] transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none",
            compact ? "justify-center" : "justify-between",
            (pending || confirmation) && "-translate-y-1 opacity-0",
          )}
        >
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none",
            pending ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          <LoaderCircleIcon
            className={cn("size-4", pending && "animate-spin motion-reduce:animate-none")}
          />
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center gap-2 transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none",
            added ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          <CheckIcon className="size-4" />
          <span>{compact ? "Added" : "Added to cart"}</span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center gap-2 transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none",
            failed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          <XIcon className="size-4" />
          <span>{compact ? "Retry" : "Try again"}</span>
        </span>
      </SoftPillButton>
      <span role="status" className="sr-only">
        {failed ? "Could not add to cart. Try again." : added ? "Added to cart" : pending ? "Adding to cart" : ""}
      </span>
    </>
  );
}
