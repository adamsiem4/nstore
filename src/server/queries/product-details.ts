import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/server/db";
import { productDetails } from "@/server/db/schema";
import type { ProductDetails } from "@/types/product";

// The sheet lives in its own table so grid and cart queries never load it.
export const getProductDetails = cache(
  async (id: string): Promise<ProductDetails | undefined> => {
    const [details] = await getDb()
      .select({
        highlights: productDetails.highlights,
        specs: productDetails.specs,
        materials: productDetails.materials,
        inBox: productDetails.inBox,
        care: productDetails.care,
      })
      .from(productDetails)
      .where(eq(productDetails.productId, id))
      .limit(1);

    return details;
  },
);
