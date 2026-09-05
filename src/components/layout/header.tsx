import { Show, UserButton } from "@clerk/nextjs";
import { SearchIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const controlClass = "h-10 px-4 text-sm";

/** Top row of the full-bleed store panel — no page-wide navbar. */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight transition-opacity hover:opacity-70"
      >
        nstore
      </Link>

      <form
        action="/products"
        className="flex min-w-52 flex-1 items-center gap-2"
      >
        <Input
          name="q"
          type="search"
          placeholder="Search the collection"
          aria-label="Search the collection"
          className="h-10"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon-lg"
          aria-label="Search"
          className="size-10"
        >
          <SearchIcon />
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {/* ponytail: no cart yet — a count chip, not a dead link */}
        <Badge variant="outline" className="h-10 gap-1.5 rounded-lg px-3 text-sm">
          <ShoppingBagIcon />0
        </Badge>
        <Show when="signed-out">
          <Link
            href="/sign-in"
            className={buttonVariants({
              variant: "ghost",
              className: controlClass,
            })}
          >
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants({ className: controlClass })}>
            Sign up
          </Link>
        </Show>
        <Show when="signed-in">
          <Link
            href="/account"
            className={buttonVariants({
              variant: "ghost",
              className: controlClass,
            })}
          >
            Account
          </Link>
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
