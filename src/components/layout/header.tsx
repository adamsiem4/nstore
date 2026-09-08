import { Show, UserButton } from "@clerk/nextjs";
import { SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCartLines } from "@/server/cart-lines";

const categories = [
  "Kitchen appliances",
  "Cookware",
  "Cleaning",
  "Laundry",
  "Storage",
  "Home comfort",
];

const navLinkClass = buttonVariants({
  variant: "ghost",
  className: "h-9 px-3 text-xs tracking-[0.08em] text-muted-foreground uppercase",
});

/** Store name, centered catalog nav, icon cluster — top row of the panel. */
export async function SiteHeader() {
  const count = (await getCartLines()).reduce((sum, line) => sum + line.quantity, 0);

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
        className="order-3 w-full overflow-x-auto [scrollbar-width:none] xl:order-none xl:mx-auto xl:w-auto [&::-webkit-scrollbar]:hidden"
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

      <div className="ml-auto flex items-center gap-0.5 xl:ml-0">
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
              placeholder="Search home essentials"
              aria-label="Search home essentials"
              className="h-9"
            />
            <Button type="submit" size="icon-lg" aria-label="Search">
              <SearchIcon />
            </Button>
          </form>
        </details>

        <Link
          href="/cart"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "relative")}
        >
          <ShoppingBagIcon />
          {count > 0 && (
            <span className="absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-medium text-primary-foreground tabular-nums">
              {count}
            </span>
          )}
        </Link>

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
