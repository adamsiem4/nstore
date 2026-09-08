import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button type="submit" variant={variant} size="icon-sm" aria-label={label} disabled={disabled}>
        {children}
      </Button>
    </form>
  );
}

export function AddToCartButton({ product }: { product: Product }) {
  return (
    <form action={updateCart} className="mt-10 max-w-sm">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <input type="hidden" name="next" value="/cart" />
      <Button type="submit" className="h-12 w-full justify-between rounded-lg px-6 text-base">
        <span>Add to cart</span>
        <span className="tabular-nums">{money.format(product.price)}</span>
      </Button>
    </form>
  );
}

export function QuickAddButton({ product }: { product: Product }) {
  return (
    <form action={updateCart}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="delta" value="1" />
      <Button type="submit" variant="outline" size="sm" aria-label={`Add ${product.name} to cart`}>
        <PlusIcon />
        Add
      </Button>
    </form>
  );
}
