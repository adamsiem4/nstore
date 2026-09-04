import { Show, UserButton } from "@clerk/nextjs";
import { SearchIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Pill row that lives inside the dashboard panel — no page-wide navbar. */
export function SiteHeader() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/"
        className="inline-flex h-14 shrink-0 items-center rounded-full bg-card px-6 text-lg font-semibold tracking-tight shadow-sm transition-colors hover:bg-accent"
      >
        nstore
      </Link>

      <form
        action="/products"
        className="flex h-14 min-w-56 flex-1 items-center gap-2 rounded-full bg-card pr-2 pl-5 shadow-sm"
      >
        <input
          name="q"
          type="search"
          placeholder="Search the collection"
          aria-label="Search the collection"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Search"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-80"
        >
          <SearchIcon className="size-4" />
        </button>
      </form>

      <div className="flex h-14 items-center gap-2 rounded-full bg-card px-3 shadow-sm">
        <ThemeToggle />
        {/* ponytail: no cart yet — a count chip, not a dead link */}
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-sm">
          <ShoppingBagIcon className="size-4" />0
        </span>
        <Show when="signed-out">
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
          >
            Sign up
          </Link>
        </Show>
        <Show when="signed-in">
          <Link
            href="/account"
            className="inline-flex h-9 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Account
          </Link>
          <UserButton />
        </Show>
      </div>
    </div>
  );
}
