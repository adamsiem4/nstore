// ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`)
import assert from "node:assert/strict";
import { catalog } from "@/server/db/seed/products";
import { getProduct, getProducts } from "./products";

const products = await getProducts();
assert.deepEqual(
  products,
  catalog,
  "database catalog must match src/server/db/seed — run bun run db:seed",
);
const ids = products.map((p) => p.id);
assert.equal(new Set(ids).size, ids.length, "catalog ids must be unique");

assert.equal(await getProduct("canvas-tote"), undefined, "retired stock must not resolve");
const kettle = products.find((p) => p.id === "cream-electric-kettle");
assert.ok(kettle);
assert.deepEqual(await getProduct(kettle.id), kettle);
assert.deepEqual(await getProducts("  KETTLE  "), [kettle]);
assert.deepEqual(
  await getProducts("  HOME COMFORT  "),
  products.filter((p) => p.category === "Home comfort"),
  "category navigation must search independently of product names",
);
assert.deepEqual(
  (await getProducts("silicone seals")).map((p) => p.id),
  ["glass-storage-jars"],
  "search must include descriptions",
);
assert.deepEqual(
  await getProducts("%"),
  products.filter((p) => `${p.name} ${p.description} ${p.category}`.includes("%")),
  "search must treat % literally",
);
assert.deepEqual(await getProducts(""), products);
assert.deepEqual(await getProducts("no-such-household-product"), []);
assert.equal(await getProduct("nope"), undefined);

console.log(`ok — ${ids.length} products; seed match, lookup, retirement, and category search`);
