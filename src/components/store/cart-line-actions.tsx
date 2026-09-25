"use client";

import { LoaderCircleIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import { MAX_QTY } from "@/lib/cart";
import { updateCart } from "@/server/cart";

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

function ConfirmButton({ name }: { name: string }) {
  const { pending } = useFormStatus();

  return (
    <PillButton
      type="submit"
      variant="ghost"
      size="xs"
      aria-busy={pending}
      disabled={pending}
      aria-label={`Yes, remove ${name}`}
      className="text-error hover:bg-error/10 hover:text-error disabled:opacity-100"
    >
      {pending ? (
        <LoaderCircleIcon aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
      ) : (
        "Yes, remove"
      )}
    </PillButton>
  );
}

const UNDO_WINDOW = 5000;

/**
 * Removing a whole line is the one cart action that cannot be undone by
 * clicking the other way, so it asks first. The confirmation swaps into the
 * row rather than opening a dialog: it keeps the answer next to the item it
 * is about, and it disarms itself on Escape or after five idle seconds.
 */
export function RemoveLineButton({ id, name }: { id: string; name: string }) {
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
        aria-label={`Remove ${name}`}
        onClick={() => setArmed(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        Remove
      </PillButton>
    );
  }

  return (
    <form action={updateCart} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={-MAX_QTY} />
      <span aria-hidden="true" className="font-mono text-xs text-muted-foreground">
        Sure?
      </span>
      <ConfirmButton name={name} />
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
