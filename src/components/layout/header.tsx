import { Show, UserButton } from "@clerk/nextjs";
import { SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const categories = [
  "Outerwear",
  "Knitwear",
  "Bags",
  "Accessories",
  "Socks",
  "Leather",
];

const navLinkClass = buttonVariants({
  variant: "ghost",
  className: "h-9 px-4 text-xs tracking-[0.12em] text-muted-foreground uppercase",
});

/** Store name, centered catalog nav, icon cluster — top row of the panel. */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-3">
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight transition-opacity hover:opacity-70"
      >
        nstore
      </Link>

      <nav
        aria-label="Catalog"
        className="order-3 w-full overflow-x-auto [scrollbar-width:none] md:order-none md:mx-auto md:w-auto md:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex items-center gap-1">
          <li>
            <Link
              href="/products"
              className={cn(navLinkClass, "font-semibold text-foreground")}
            >
              Shop
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`/products?q=${encodeURIComponent(category)}`}
                className={navLinkClass}
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ml-auto flex items-center gap-0.5 md:ml-0">
        <ThemeToggle />

        {/* ponytail: <details> is the whole search toggle — no state, no popover lib */}
        <details className="relative">
          <summary
            aria-label="Search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
            )}
          >
            <SearchIcon />
          </summary>
          <form
            action="/products"
            className="absolute top-full right-0 z-20 mt-2 flex w-[min(18rem,calc(100vw-3rem))] items-center gap-2 rounded-xl border bg-popover p-2 shadow-md"
          >
            <Input
              name="q"
              type="search"
              placeholder="Search the collection"
              aria-label="Search the collection"
              className="h-9"
            />
            <Button type="submit" size="icon-lg" aria-label="Search">
              <SearchIcon />
            </Button>
          </form>
        </details>

        {/* ponytail: no cart yet — a count chip, not a dead link */}
        <span className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-muted-foreground">
          <ShoppingBagIcon className="size-4" />0
        </span>

        <Show when="signed-out">
          <Link
            href="/sign-in"
            aria-label="Sign in"
            className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
          >
            <UserIcon />
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
