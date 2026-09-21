import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ponytail: two radii, one button. `rounded-full` is the capsule the store
// already speaks in — hero CTAs, the catalog nav, every 40px icon target.
// `rounded-xl` is the 12px surface radius of the panels and product cards, so
// a block button reads as part of the box it fills instead of a chip dropped
// into it. Both wrap ui/button, so variants, sizes and states stay defined
// once; these components only decide the corner. The radius class lands
// before `className`, so a call site can still override it.
const PILL = "rounded-full";
const SOFT = "rounded-xl";

type PillProps = ComponentProps<typeof Button>;
type PillClasses = VariantProps<typeof buttonVariants> & { className?: string };

/** Capsule button: free-standing actions — CTAs, chips, icon targets. */
function PillButton({ className, ...props }: PillProps) {
  return <Button {...props} className={cn(PILL, className)} />;
}

/** Softened button: block actions that fill a panel, a grid cell, or a row. */
function SoftPillButton({ className, ...props }: PillProps) {
  return <Button {...props} className={cn(SOFT, className)} />;
}

/** `PillButton`'s classes for what a button cannot be: links and labels. */
function pillButtonVariants({ className, ...variants }: PillClasses = {}) {
  return cn(buttonVariants(variants), PILL, className);
}

export { PillButton, SoftPillButton, pillButtonVariants };
