import { asc, eq, sql } from "drizzle-orm";
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

// React cache dedupes header/page getProducts() calls within one server render.
// ponytail: no cross-request cache—every render reads Neon; add unstable_cache with a catalog tag if traffic matters.
export const getProducts = cache(
  async (query?: string): Promise<Product[]> => {
    const q = query?.trim().toLowerCase();

    // strpos keeps substring search over name, description, and category; unlike LIKE, bound %/_ stay literal.
    return getDb()
      .select(columns)
      .from(products)
      .where(
        q
          ? sql`strpos(lower(concat_ws(' ', ${products.name}, ${products.description}, ${products.category})), ${q}) > 0`
          : undefined,
      )
      .orderBy(asc(products.position));
  },
);

export const getProduct = cache(
  async (id: string): Promise<Product | undefined> => {
    const [product] = await getDb()
      .select(columns)
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return product;
  },
);
