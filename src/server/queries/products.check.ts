// ponytail: assert script, not a test framework — run with `bun run test`
import assert from "node:assert/strict";
import { getProduct, getProducts } from "./products";

const products = await getProducts();
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
assert.deepEqual(await getProducts(""), products);
assert.deepEqual(await getProducts("no-such-household-product"), []);
assert.equal(await getProduct("nope"), undefined);

console.log(`ok — ${ids.length} products; lookup, retirement, and category search`);
