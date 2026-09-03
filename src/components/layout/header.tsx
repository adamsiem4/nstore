import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          nstore
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/products"
            className="hidden rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            Shop
          </Link>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Sign up
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/account"
              className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Account
            </Link>
            <UserButton />
          </Show>
          <ThemeToggle />
          {/* ponytail: no cart yet — a span, not a dead link */}
          <span className="hidden h-9 items-center rounded-full bg-primary px-4 font-medium text-primary-foreground sm:inline-flex">
            Cart (0)
          </span>
        </nav>
      </div>
    </header>
  );
}
