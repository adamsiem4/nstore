import { Show, UserButton } from "@clerk/nextjs";
import { ChevronDownIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
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

const navLinkClass = cn(
  buttonVariants({ variant: "ghost" }),
  "h-11 rounded-full px-3 text-xs tracking-[0.08em] text-muted-foreground uppercase focus-visible:ring-foreground",
);

/** Store name, centered catalog nav, icon cluster — top row of the panel. */
export async function SiteHeader() {
  const count = (await getCartLines()).reduce((sum, line) => sum + line.quantity, 0);

  return (
    <header className="relative flex flex-wrap items-center gap-x-1 gap-y-3 sm:gap-x-2">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg text-xl font-semibold tracking-tight outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-card"
      >
        nstore
      </Link>

      <nav
        aria-label="Catalog"
        className="order-3 w-full xl:order-none xl:mx-auto xl:w-auto"
      >
        <ul className="hidden items-center gap-1 p-1 xl:flex">
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
        <details name="store-tools" className="group/catalog relative xl:hidden">
          <summary
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full cursor-pointer list-none justify-between rounded-full px-4 focus-visible:ring-foreground [&::-webkit-details-marker]:hidden",
            )}
          >
            Browse the shop
            <ChevronDownIcon aria-hidden="true" className="transition-transform group-open/catalog:rotate-180" />
          </summary>
          <ul className="absolute inset-x-0 top-full z-20 mt-2 grid gap-1 rounded-xl border bg-popover p-2 shadow-md sm:grid-cols-2">
            <li>
              <Link href="/products" className={cn(navLinkClass, "w-full justify-start font-semibold text-foreground")}>
                Shop all essentials
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category}>
                <Link
                  href={`/products?q=${encodeURIComponent(category)}`}
                  className={cn(navLinkClass, "w-full justify-start")}
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </nav>

      <div className="ml-auto flex items-center gap-0 sm:gap-0.5 xl:ml-0">
        <ThemeToggle />

        {/* ponytail: <details> is the whole search toggle — no state, no popover lib */}
        <details name="store-tools">
          <summary
            aria-label="Search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              "size-11 cursor-pointer list-none rounded-full focus-visible:ring-foreground [&::-webkit-details-marker]:hidden",
            )}
          >
            <SearchIcon aria-hidden="true" />
          </summary>
          <form
            action="/products"
            role="search"
            aria-label="Search products"
            className="absolute top-full right-0 z-20 mt-2 flex w-[min(20rem,calc(100vw-4rem))] items-center gap-2 rounded-xl border bg-popover p-2 shadow-md"
          >
            <Input
              name="q"
              type="search"
              placeholder="Search home essentials"
              aria-label="Search home essentials"
              className="h-11 min-w-0"
            />
            <Button type="submit" size="icon-lg" aria-label="Search" className="size-11 rounded-lg focus-visible:ring-foreground">
              <SearchIcon aria-hidden="true" />
            </Button>
          </form>
        </details>

        <Link
          href="/cart"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "relative size-11 rounded-full focus-visible:ring-foreground")}
        >
          <ShoppingBagIcon aria-hidden="true" />
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
            className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "size-11 rounded-full focus-visible:ring-foreground")}
          >
            <UserIcon aria-hidden="true" />
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
