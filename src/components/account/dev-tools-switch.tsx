"use client";

import { useActionState } from "react";
import { setDevToolsEnabled } from "@/server/actions/profile";

export function DevToolsSwitch({ enabled }: { enabled: boolean }) {
  const [error, action, pending] = useActionState(
    async (_previous: string | null, form: FormData) => {
      try {
        await setDevToolsEnabled(form);
        return null;
      } catch {
        return "We couldn't update developer tools. Please try again.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-3">
      <div className="flex items-center gap-3">
        <button
          type="submit"
          role="switch"
          aria-label="Developer tools"
          aria-checked={enabled}
          aria-busy={pending}
          disabled={pending}
          name="enabled"
          value={String(!enabled)}
          className="group relative h-6 w-11 shrink-0 rounded-full border bg-muted outline-none transition-colors aria-checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <span aria-hidden="true" className="absolute top-1/2 left-1 size-4 -translate-y-1/2 rounded-full bg-background transition-transform group-aria-checked:translate-x-5" />
        </button>
        <span role="status">{pending ? "Saving…" : enabled ? "On" : "Off"}</span>
      </div>
      {error && <p role="alert" className="text-error">{error}</p>}
    </form>
  );
}
