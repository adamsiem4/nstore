import { getDb } from "@/server/db";
import { products, productDetails } from "@/server/db/schema";
import { catalog } from "./seed/products";
import { sheets } from "./seed/product-details";

const missingSheetIds = catalog
  .filter((product) => !Object.hasOwn(sheets, product.id))
  .map((product) => product.id);

if (missingSheetIds.length > 0) {
  throw new Error(`Missing detail sheets for catalog products: ${missingSheetIds.join(", ")}`);
}

const db = getDb();

// Delete + insert in one batch is an idempotent full sync: seed files are the source of truth, so reruns overwrite catalog tables only; payments stay untouched.
await db.batch([
  db.delete(products),
  db.insert(products).values(
    catalog.map((product, position) => ({ ...product, position })),
  ),
  db.insert(productDetails).values(
    catalog.map((product) => ({ productId: product.id, ...sheets[product.id] })),
  ),
]);

console.log(`seeded ${catalog.length} products and ${catalog.length} detail sheets`);
