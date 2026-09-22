import { PlusIcon } from "lucide-react";
import { CartSubmitButton } from "@/components/store/cart-submit-button";
import { PillButton } from "@/components/ui/pill-button";
import { money } from "@/lib/utils";
import { updateCart } from "@/server/cart";
import type { Product } from "@/types/product";

/** One hidden-field form per cart mutation. */
export function CartFormButton({
  id,
  delta,
  label,
  children,
  disabled,
  variant = "ghost",
}: {
  id: string;
  delta: number;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "ghost" | "outline";
}) {
  return (
    <form action={updateCart}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <PillButton type="submit" variant={variant} size="icon-sm" aria-label={label} disabled={disabled}>
        {children}
      </PillButton>
    </form>
  );
}

export function AddToCartButton({ product }: { product: Product }) {
  return (
    <form action={updateCart} className="mt-10 max-w-sm">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <input type="hidden" name="next" value="/cart" />
      <CartSubmitButton className="h-12 w-full justify-between px-6 text-base">
        <span>Add to cart</span>
        <span className="tabular-nums">{money.format(product.price)}</span>
      </CartSubmitButton>
    </form>
  );
}

/**
 * Sits on the product tile at the same 12px radius as the product page's "Add
 * to cart", and keeps the light palette in both modes — so the outline
 * variant's dark: fills are overridden rather than inherited.
 */
export function QuickAddButton({ product }: { product: Product }) {
  return (
    <form action={updateCart}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <CartSubmitButton
        compact
        variant="outline"
        size="sm"
        aria-label={`Add ${product.name} to cart`}
        className="border-shot-line bg-transparent text-shot-ink hover:bg-shot-ink/10 hover:text-shot-ink focus-visible:ring-shot-ink dark:border-shot-line dark:bg-transparent dark:hover:bg-shot-ink/10"
      >
        <PlusIcon className="size-3" />
        Add
      </CartSubmitButton>
    </form>
  );
}
