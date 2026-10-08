"use client";

import { useActionState, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { requestOrderReturn } from "@/server/returns";

export function OrderReturn({
  orderId,
  status,
}: {
  orderId: string;
  status: "available" | "requested" | "refunded" | "unavailable";
}) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [state, action, pending] = useActionState(
    async (_previous: { requested: boolean; error?: string }, form: FormData) => {
      try {
        return await requestOrderReturn(form);
      } catch {
        return { requested: false, error: "We couldn't save your return request. Please try again." };
      }
    },
    { requested: false },
  );
  const formId = `return-${orderId}`;

  return (
    <div className="border-t px-5 py-4">
      {status === "refunded" ? (
        <p className="text-sm text-muted-foreground">This order has been refunded.</p>
      ) : status === "requested" || state.requested ? (
        <p role="status" className="text-sm">
          <span className="font-semibold">Return requested.</span>{" "}
          Await return instructions before sending anything back. A request does not issue a refund.
        </p>
      ) : status === "unavailable" ? (
        <p className="text-sm text-muted-foreground">Return details are unavailable. Refresh the page to try again.</p>
      ) : (
        <>
          <PillButton
            type="button"
            variant="outline"
            aria-expanded={open}
            aria-controls={formId}
            disabled={pending}
            onClick={() => setOpen(!open)}
            className="h-10 px-4"
          >
            {open ? "Cancel return request" : "Request a return"}
          </PillButton>
          {open && (
            <form id={formId} action={action} aria-busy={pending} className="mt-4 grid max-w-lg gap-3">
              <input type="hidden" name="orderId" value={orderId} />
              <p id={`${formId}-policy`} className="text-sm text-muted-foreground">
                Returns are accepted within 30 days of delivery. Items should be unused and in their original packaging.
                Your request will be reviewed before a refund is issued.
              </p>
              <label className="grid gap-2 text-sm font-medium">
                Items and reason for return
                <textarea
                  name="details"
                  required
                  maxLength={500}
                  rows={3}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  disabled={pending}
                  aria-describedby={`${formId}-policy${state.error ? ` ${formId}-error` : ""}`}
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                />
              </label>
              {state.error && <p id={`${formId}-error`} role="alert" className="text-sm text-error">{state.error}</p>}
              <PillButton type="submit" disabled={pending} className="h-10 justify-self-start px-5">
                {pending ? "Submitting…" : "Submit return request"}
              </PillButton>
            </form>
          )}
        </>
      )}
    </div>
  );
}
