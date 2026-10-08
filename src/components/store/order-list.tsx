"use client";

import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * First two items always show; the rest slide open above the arrow, which
 * rides down with them. Starts open while searching so matches are visible.
 */
function OrderItems({ items, searching }: { items: ReactNode[]; searching: boolean }) {
  const [open, setOpen] = useState(searching);
  const hidden = items.length - 2;

  return (
    <>
      {items.length > 0 && <ul className="divide-y px-5">{items.slice(0, 2)}</ul>}
      {hidden > 0 && (
        <>
          {/* 0fr → 1fr animates to the content's natural height; inert keeps folded links out of tab order. */}
          <div
            inert={!open}
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <ul className="divide-y border-t px-5">{items.slice(2)}</ul>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex w-full cursor-pointer justify-center border-t py-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset"
          >
            <span className="sr-only">{open ? "Show fewer items" : `${hidden} more item${hidden === 1 ? "" : "s"}`}</span>
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("size-5 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")}
            />
          </button>
        </>
      )}
    </>
  );
}

/** Live search over server-rendered orders; `text` is what a query matches against. */
export function OrderList({
  orders,
}: {
  orders: { id: string; text: string; header: ReactNode; items: ReactNode[]; footer: ReactNode }[];
}) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = orders.filter(({ text }) => words.every((word) => text.includes(word)));

  return (
    <>
      <div
        role="search"
        className="mt-8 flex h-12 items-center gap-3 rounded-full bg-foreground/5 px-4 ring-1 ring-foreground/10 focus-within:ring-2 focus-within:ring-foreground"
      >
        <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by product, order # or date"
          aria-label="Search orders"
          className="h-12 min-w-0 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <p role="status" className="sr-only">
        {words.length > 0 && `${shown.length} matching order${shown.length === 1 ? "" : "s"}`}
      </p>
      {shown.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed p-8 text-muted-foreground">
          No orders match “{query.trim()}”.
        </p>
      )}
      <ol className="mt-8 flex flex-col gap-4 empty:hidden">
        {shown.map(({ id, header, items, footer }) => (
          <li key={id} className="overflow-hidden rounded-xl border">
            {header}
            {/* Remount when a search starts or ends so the fold resets to match. */}
            <OrderItems key={String(words.length > 0)} items={items} searching={words.length > 0} />
            {footer}
          </li>
        ))}
      </ol>
    </>
  );
}
