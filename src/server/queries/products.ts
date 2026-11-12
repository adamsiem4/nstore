import { asc, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { cache } from "react";
import { getDb } from "@/server/db";
import { products } from "@/server/db/schema";
import type { Product } from "@/types/product";

const columns = {
  id: products.id,
  name: products.name,
  description: products.description,
  category: products.category,
  image: products.image,
  color: products.color,
  price: products.price,
};

/**
 * The whole catalog in grid order, read once and shared by every request. A new
 * deployment starts a fresh cache; without one, a reseed shows up within the hour.
 */
async function getCatalog(): Promise<Product[]> {
  "use cache";
  // Refreshed in the background after 15 minutes, and never served more than an
  // hour old: the built-in "hours" profile would keep a stale entry for a day.
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  return getDb().select(columns).from(products).orderBy(asc(products.position));
}

// React cache dedupes header/page getProducts() calls within one server render.
export const getProducts = cache(
  async (query?: string): Promise<Product[]> => {
    const q = query?.trim().toLowerCase();
    if (!q) return getCatalog();

    // Searches are per-visitor input, so they read Neon directly instead of filling the cache.
    // strpos keeps substring search over name, description, and category; unlike LIKE, bound %/_ stay literal.
    return getDb()
      .select(columns)
      .from(products)
      .where(sql`strpos(lower(concat_ws(' ', ${products.name}, ${products.description}, ${products.category})), ${q}) > 0`)
      .orderBy(asc(products.position));
  },
);

/** One product, from the cached catalog: an unknown id costs no query and no cache entry. */
export const getProduct = cache(
  async (id: string): Promise<Product | undefined> =>
    (await getCatalog()).find((product) => product.id === id),
);
