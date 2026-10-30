"use client";

import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { savePhone } from "@/server/actions/profile";

// Plain elements with .clerk-* classes (globals.css): this row has to match
// Clerk's forms above it, not the store's Input and Button.

const text = "text-[0.9375rem] leading-[1.3846]";

// Unmounts on close, so a reopened form starts without the last draft or error.
function PhoneEditor({
  phone: savedPhone,
  closing,
  onCancel,
  onSaved,
  onClosed,
}: {
  phone: string;
  closing: boolean;
  onCancel: () => void;
  onSaved: () => void;
  onClosed: () => void;
}) {
  // The saved number can refresh while the form folds away; its text must not flip.
  const [phone] = useState(savedPhone);
  const [draft, setDraft] = useState(phone);
  const [state, action, pending] = useActionState(
    async (_previous: { saved: boolean; error?: string }, form: FormData) => {
      try {
        const result = await savePhone(form);
        if (result.saved) onSaved();
        return result;
      } catch {
        return { saved: false, error: "We couldn't save your phone number. Please try again." };
      }
    },
    { saved: false },
  );
  const busy = pending || closing;

  return (
    <div
      className={`unfold py-1 pl-2.5 ${closing ? "unfold-closing" : ""}`}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClosed();
      }}
    >
      <form
        action={action}
        aria-busy={busy}
        onSubmit={(event) => {
          if (busy) event.preventDefault();
        }}
        className="grid gap-4"
      >
        <h3 className={`mb-4 font-semibold ${text}`}>{phone ? "Edit phone number" : "Add phone number"}</h3>
        <label className={`grid gap-2 font-medium ${text}`}>
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            // Controls stay enabled while busy: disabling one drops focus to the page.
            readOnly={busy}
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? "phone-error" : undefined}
            className="clerk-input"
          />
        </label>
        {state.error && <p id="phone-error" role="alert" className="text-sm text-error">{state.error}</p>}
        <div className="mt-2 flex flex-row-reverse items-center gap-2">
          <button type="submit" disabled={!draft.trim() || draft.trim() === phone} className="clerk-button clerk-button-primary">
            {pending || state.saved ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => !busy && onCancel()} className="clerk-button">
            Cancel
          </button>
          {phone && (
            <button
              type="button"
              // An empty form clears the number on the server.
              onClick={() => !busy && startTransition(() => action(new FormData()))}
              className="clerk-button clerk-button-danger mr-auto"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export function PhoneForm({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  // Set while the form folds away, and after it: how it closed.
  const [closed, setClosed] = useState<"cancelled" | "saved" | null>(null);
  const edit = () => {
    setClosed(null);
    setOpen(true);
  };
  // The trigger remounts when the form closes, so it takes focus back.
  const returning = closed !== null;

  return (
    // Same flex layout and breakpoint as Clerk's Profile and Email rows above, so
    // the columns shrink together at every width.
    <section
      aria-labelledby="phone-title"
      className="flex flex-col gap-2 border-t border-foreground/7 py-4 min-[993px]:flex-row min-[993px]:gap-6"
    >
      <h2 id="phone-title" className={`font-medium min-[993px]:w-66 min-[993px]:py-1.5 ${text}`}>
        Phone number
      </h2>
      {/* One minimum height for empty, saved and folding, so the row never hops. */}
      <div className="min-h-[32.77px] w-full min-w-0">
        {open ? (
          <PhoneEditor
            phone={phone}
            closing={returning}
            onCancel={() => setClosed("cancelled")}
            onSaved={() => setClosed("saved")}
            onClosed={() => setOpen(false)}
          />
        ) : phone ? (
          <div className="flex items-center justify-between gap-3 pl-2.5">
            <span className={`min-w-0 wrap-anywhere ${text}`}>{phone}</span>
            <button
              type="button"
              autoFocus={returning}
              onClick={edit}
              aria-label="Edit phone number"
              className="clerk-button clerk-button-compact mr-1"
            >
              Edit
            </button>
          </div>
        ) : (
          <button type="button" autoFocus={returning} onClick={edit} className="clerk-button clerk-button-row">
            <PlusIcon aria-hidden="true" className="size-4" />
            Add phone number
            <ArrowRightIcon aria-hidden="true" className="clerk-button-arrow" />
          </button>
        )}
        <p role="status" className="sr-only">{closed === "saved" && !open && "Phone number updated."}</p>
      </div>
    </section>
  );
}
