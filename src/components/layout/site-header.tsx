import type { CSSProperties } from "react";
import { Show, UserButton } from "@clerk/nextjs";
import { SearchIcon, ShoppingBagIcon, UserIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { CartSheet } from "@/components/store/cart";
import { CartDrawer, CartLink } from "@/components/store/cart-drawer";
import { Input } from "@/components/ui/input";
import { PillButton, pillButtonVariants } from "@/components/ui/pill-button";
import { suggest, totals } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { getCartLines } from "@/server/cart-lines";
import { getProducts } from "@/server/queries/products";

const categories = [
  "Kitchen appliances",
  "Cookware",
  "Cleaning",
  "Laundry",
  "Storage",
  "Home comfort",
];

const navLinkClass = pillButtonVariants({
  variant: "ghost",
  className: "h-11 px-3 text-xs tracking-[0.08em] text-muted-foreground uppercase focus-visible:ring-foreground",
});

// ponytail: the catalog row as data — the fold needs an index to stagger on,
// and the hidden width-holder has to render the exact same labels.
const CATALOG = [
  { href: "/products", label: "Shop", lead: true },
  ...categories.map((category) => ({
    href: `/products?q=${encodeURIComponent(category)}`,
    label: category,
    lead: false,
  })),
];

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
  const [lines, catalog] = await Promise.all([getCartLines(), getProducts()]);
  const { count } = totals(lines);
  const cartLabel = `Cart, ${count} item${count === 1 ? "" : "s"}`;
  const badge = count > 0 ? (
    <span aria-hidden="true" className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-medium text-primary-foreground tabular-nums">
      {count > 9 ? "9+" : count}
    </span>
  ) : null;

  return (
    <div className="flex items-center gap-x-1 sm:gap-x-2">
      {/* ponytail: the wordmark is its own zero-basis side, so the tail can
          collapse without moving anything: the nav sits between two equal
          flex-1 sides and therefore on the panel's centre line, and no
          invisible copy is left holding a gap open where "store" used to be.
          aria-label, because split letters are announced as "n store". */}
      <div className="flex min-h-11 flex-1 items-center text-xl font-semibold tracking-tight">
        <Link
          href="/"
          aria-label="nstore"
          className="inline-flex min-h-11 items-center rounded-lg outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-card"
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

      {/* ponytail: when the search pill unrolls it used to slide over the last
          two labels and leave them half-eaten, so each label now folds down to
          its initial ahead of the glass — right to left, one 45ms beat apart,
          and back the other way when the pill retreats. The invisible copy
          holds the closed width: without it the row would re-centre as it
          shrinks and carry the initials rightwards into the pill. Same
          aria-label reason as the wordmark: "K" plus "itchen appliances" is
          announced as two words without it. */}
      <nav aria-label="Catalog" className="relative hidden shrink-0 xl:block">
        <ul aria-hidden="true" className="invisible flex items-center gap-1 p-1">
          {CATALOG.map(({ href, label, lead }) => (
            <li key={href} className={cn(navLinkClass, "shrink-0", lead && "font-semibold")}>
              {label}
            </li>
          ))}
        </ul>
        <ul className="absolute inset-0 flex items-center gap-1 p-1">
          {CATALOG.map(({ href, label, lead }, index) => (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-label={label}
                className={cn(
                  navLinkClass,
                  // the initial and its tail are one word, not two flex items
                  "gap-0",
                  lead && "font-semibold text-foreground",
                )}
              >
                {label.slice(0, 1)}
                <span
                  style={{
                    "--fold": `${(CATALOG.length - 1 - index) * 45}ms`,
                    "--unfold": `${index * 45}ms`,
                  } as CSSProperties}
                  className="catalog-tail"
                >
                  <span>{label.slice(1)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ponytail: 40px boxes butted together — 44px ones read as scattered icons */}
      <div className="hidden flex-1 items-center justify-end gap-0 xl:flex">
        {/* ponytail: a checkbox is the whole toggle — no state, no popover lib.
            Unlike <details> the pill stays in the DOM when shut, so it can
            swipe closed as smoothly as it opens. */}
        <div data-search className="relative">
          <input id="site-search" type="checkbox" aria-label="Search" className="peer sr-only" />
          <label
            htmlFor="site-search"
            className={pillButtonVariants({
              variant: "ghost",
              size: "icon-lg",
              className: "relative z-30 size-10 cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-foreground",
            })}
          >
            <SearchIcon aria-hidden="true" data-icon="open" />
            <XIcon aria-hidden="true" data-icon="close" />
          </label>
          <form
            action="/products"
            role="search"
            aria-label="Search products"
            className="search-pill absolute top-1/2 left-[calc((var(--search-width)-2.5rem)*-1)] z-20 flex h-10 w-(--search-width) -translate-y-1/2 items-center gap-3 overflow-hidden rounded-full bg-foreground/5 pr-11 pl-4 ring-1 ring-foreground/10 backdrop-blur-md"
          >
            <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search"
              aria-label="Search home essentials"
              className="h-10 min-w-0 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:hidden"
            />
            <PillButton type="submit" className="sr-only">
              Search
            </PillButton>
          </form>
        </div>

        <CartLink
          aria-label={cartLabel}
          className={pillButtonVariants({ variant: "ghost", size: "icon-lg", className: "relative size-10 focus-visible:ring-foreground" })}
        >
          <ShoppingBagIcon aria-hidden="true" />
          {badge && <span className="absolute right-0 bottom-0.5">{badge}</span>}
        </CartLink>
        <Show when="signed-out">
          <Link
            href="/sign-in"
            aria-label="Sign in"
            className={pillButtonVariants({ variant: "ghost", size: "icon-lg", className: "size-10 focus-visible:ring-foreground" })}
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

      {/* ponytail: same checkbox trick as the search pill — the drawer animates
          both ways because it never leaves the DOM, and the bars travel first,
          then rotate into the cross. */}
      <div data-menu className="ml-auto xl:hidden">
        <input id="site-menu" type="checkbox" aria-label="Menu" className="peer sr-only" />
        <label
          htmlFor="site-menu"
          className={pillButtonVariants({
            variant: "ghost",
            size: "icon-lg",
            className: "size-10 cursor-pointer flex-col gap-[5px] peer-focus-visible:ring-2 peer-focus-visible:ring-foreground",
          })}
        >
          <span aria-hidden="true" className="burger-line" />
          <span aria-hidden="true" className="burger-line" />
          <span aria-hidden="true" className="burger-line" />
        </label>

        {/* The header panel is the containing block, so the drawer spans it
            exactly; the extra pixel is its border, and the top margin is that
            pixel plus the layout gap, so the drawer sits in the panel rhythm.
            ponytail: opaque, not glass — Chromium drops backdrop-filter on an
            element that transitions transform, so the drawer shipped as 60%
            tint with the product grid legible straight through it. */}
        <div className="site-menu absolute top-full -right-px -left-px z-30 mt-[9px] grid gap-2 rounded-xl border border-foreground/10 bg-card p-3 shadow-xl sm:mt-[13px]">
          <form
            action="/products"
            role="search"
            aria-label="Search products"
            className="flex h-11 items-center gap-3 rounded-full bg-foreground/5 px-4 ring-1 ring-foreground/10"
          >
            <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search"
              aria-label="Search home essentials"
              className="h-11 min-w-0 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:hidden"
            />
            <PillButton type="submit" className="sr-only">
              Search
            </PillButton>
          </form>

          <nav aria-label="Catalog">
            <ul className="grid gap-1 sm:grid-cols-2">
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
          </nav>

          <div className="flex items-center gap-1 border-t pt-2">
            <CartLink
              aria-label={cartLabel}
              className={cn(navLinkClass, "gap-2 normal-case tracking-normal text-foreground")}
            >
              <ShoppingBagIcon aria-hidden="true" />
              Cart
              {badge}
            </CartLink>
            <div className="ml-auto flex items-center gap-1">
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  aria-label="Sign in"
                  className={pillButtonVariants({ variant: "ghost", size: "icon-lg", className: "size-10 focus-visible:ring-foreground" })}
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
        </div>
      </div>

      <CartDrawer count={count}>
        <CartSheet lines={lines} picks={suggest(lines, catalog)} />
      </CartDrawer>
    </div>
  );
}
