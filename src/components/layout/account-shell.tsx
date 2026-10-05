import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// One frame for every account page (and /orders): same column, back link and
// heading. `back={null}` drops the link; no `title` when Clerk draws its own.
export function AccountShell({
  back = { href: "/account", label: "Account" },
  title,
  description,
  children,
}: {
  back?: { href: string; label: string } | null;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      {back && (
        <Link
          href={back.href}
          className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-lg pr-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      {title && <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>}
      {description && <p className="mt-3 text-lg wrap-anywhere text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
