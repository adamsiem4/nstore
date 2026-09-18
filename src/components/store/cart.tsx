import { PlusIcon } from "lucide-react";
import { PillButton, SoftPillButton } from "@/components/ui/pill-button";
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
      <SoftPillButton type="submit" className="h-12 w-full justify-between px-6 text-base">
        <span>Add to cart</span>
        <span className="tabular-nums">{money.format(product.price)}</span>
      </SoftPillButton>
    </form>
  );
}

export function QuickAddButton({ product }: { product: Product }) {
  return (
    <form action={updateCart}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <PillButton type="submit" variant="outline" size="sm" aria-label={`Add ${product.name} to cart`}>
        <PlusIcon />
        Add
      </PillButton>
    </form>
  );
}
