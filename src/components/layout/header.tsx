import type { CSSProperties } from "react";
import { Show, UserButton } from "@clerk/nextjs";
import { ChevronDownIcon, SearchIcon, ShoppingBagIcon, UserIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
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

// ponytail: fizik's logo morph in CSS — letters fade one by one, then the gap
// closes; both directions reverse for free because they are transitions.
// Fade-out runs nearest-letter-first, fade-in farthest-first, like the original.
const TAIL = [
  { letter: "s", in: 400, out: 0 },
  { letter: "t", in: 325, out: 50 },
  { letter: "o", in: 250, out: 150 },
  { letter: "r", in: 175, out: 250 },
  { letter: "e", in: 100, out: 350 },
];

/** Store name, centered catalog nav, icon cluster — the sticky panel's row. */
export async function SiteHeader() {
  const count = (await getCartLines()).reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="relative flex flex-wrap items-center gap-x-1 gap-y-3 sm:gap-x-2">
      {/* ponytail: an invisible copy holds the full width open, so the morph
          collapses inside its own box and never shifts the nav or the icons */}
      <div className="relative flex min-h-11 items-center text-xl font-semibold tracking-tight">
        <span aria-hidden="true" className="invisible">nstore</span>
        <Link
          href="/"
          className="absolute inset-0 inline-flex items-center rounded-lg outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-card"
        >
          n
          <span className="grid grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out group-data-[stuck]/header:grid-cols-[0fr] group-data-[stuck]/header:delay-300 motion-reduce:transition-none">
            <span className="overflow-hidden">
              {TAIL.map(({ letter, in: fadeIn, out }) => (
                <span
                  key={letter}
                  style={{ "--in": `${fadeIn}ms`, "--out": `${out}ms` } as CSSProperties}
                  className="transition-opacity duration-150 ease-in-out [transition-delay:var(--in)] group-data-[stuck]/header:opacity-0 group-data-[stuck]/header:[transition-delay:var(--out)] motion-reduce:transition-none"
                >
                  {letter}
                </span>
              ))}
            </span>
          </span>
        </Link>
      </div>

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

      {/* ponytail: 40px boxes butted together — 44px ones read as scattered icons */}
      <div className="ml-auto flex items-center gap-0 xl:ml-0">
        {/* ponytail: a checkbox is the whole toggle — no state, no popover lib.
            Unlike <details> the pill stays in the DOM when shut, so it can
            swipe closed as smoothly as it opens. */}
        <div data-search className="relative">
          <input id="site-search" type="checkbox" aria-label="Search" className="peer sr-only" />
          <label
            htmlFor="site-search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              "relative z-30 size-10 cursor-pointer rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-foreground",
            )}
          >
            <SearchIcon aria-hidden="true" data-icon="open" />
            <XIcon aria-hidden="true" data-icon="close" />
          </label>
          <form
            action="/products"
            role="search"
            aria-label="Search products"
            className="search-pill absolute top-1/2 left-[calc((var(--search-width)-2.5rem)*-1)] z-20 flex h-10 w-(--search-width) -translate-y-1/2 items-center gap-3 overflow-hidden rounded-full bg-muted pr-11 pl-4 ring-1 ring-foreground/10"
          >
            <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search"
              aria-label="Search home essentials"
              className="h-10 min-w-0 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        </div>
        <Link
          href="/cart"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "relative size-10 rounded-full focus-visible:ring-foreground")}
        >
          <ShoppingBagIcon aria-hidden="true" />
          {count > 0 && (
            <span className="absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-medium text-primary-foreground tabular-nums">
              {count}
            </span>
          )}
        </Link>
        <ThemeToggle />

        <Show when="signed-out">
          <Link
            href="/sign-in"
            aria-label="Sign in"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "size-10 rounded-full focus-visible:ring-foreground")}
          >
            <UserIcon aria-hidden="true" />
          </Link>
        </Show>
        <Show when="signed-in">
          <span className="flex size-10 items-center justify-center">
            <UserButton />
          </span>
        </Show>
      </div>
    </div>
  );
}
