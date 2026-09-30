"use client";

import { LoaderCircleIcon } from "lucide-react";
import posthog from "posthog-js";
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import { MAX_QTY } from "@/lib/cart";
import { clearCart, updateCart } from "@/server/cart";

/**
 * Stepper button that reports its own form's pending state: the icon swaps for
 * a spinner and both ends of the stepper lock until the server action lands,
 * so a double click cannot queue a second quantity change.
 */
export function QuantityButton({
  children,
  disabled,
  ...props
}: ComponentProps<typeof PillButton> & { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <PillButton
      {...props}
      type="submit"
      variant="ghost"
      size="icon-sm"
      aria-busy={pending}
      disabled={disabled || pending}
      className={cn("disabled:opacity-100", props.className)}
    >
      {pending ? (
        <LoaderCircleIcon aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      ) : (
        children
      )}
    </PillButton>
  );
}

function ConfirmButton({ children, label }: { children: ReactNode; label?: string }) {
  const { pending } = useFormStatus();

  return (
    <PillButton
      type="submit"
      variant="ghost"
      size="xs"
      aria-busy={pending}
      disabled={pending}
      aria-label={label}
      className="text-error hover:bg-error/10 hover:text-error disabled:opacity-100"
    >
      {pending ? (
        <LoaderCircleIcon aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
      ) : (
        children
      )}
    </PillButton>
  );
}

const UNDO_WINDOW = 5000;

/**
 * Removing a line or clearing the cart cannot be undone by clicking the other
 * way, so both ask first. The confirmation swaps in place rather than opening
 * a dialog: it keeps the answer next to what it is about, and it disarms
 * itself on Escape or after five idle seconds.
 */
function ConfirmAction({
  action,
  label,
  confirm,
  subject,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  confirm: string;
  /** appended to both accessible names when the visible text is ambiguous */
  subject?: string;
  /** hidden fields */
  children?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    cancel.current?.focus();
    const timer = window.setTimeout(() => setArmed(false), UNDO_WINDOW);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setArmed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [armed]);

  if (!armed) {
    return (
      <PillButton
        type="button"
        variant="link"
        size="xs"
        aria-label={subject && `${label} ${subject}`}
        onClick={() => setArmed(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        {label}
      </PillButton>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      {children}
      <span aria-hidden="true" className="font-mono text-xs text-muted-foreground">
        Sure?
      </span>
      <ConfirmButton label={subject && `${confirm} ${subject}`}>{confirm}</ConfirmButton>
      <PillButton
        ref={cancel}
        type="button"
        variant="link"
        size="xs"
        onClick={() => setArmed(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        Keep
      </PillButton>
    </form>
  );
}

export function RemoveLineButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmAction
      // Client wrapper is safe: the form only exists after a JS click arms it.
      action={async (formData) => {
        await updateCart(formData);
        posthog.capture("Product Removed", { product_id: id, name });
      }}
      label="Remove"
      confirm="Yes, remove"
      subject={name}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={-MAX_QTY} />
    </ConfirmAction>
  );
}

export function ClearCartButton() {
  return <ConfirmAction action={clearCart} label="Clear cart" confirm="Yes, clear" />;
}
