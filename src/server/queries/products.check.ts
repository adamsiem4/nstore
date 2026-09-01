// ponytail: assert script, not a test framework — run with `bun run test`
import assert from "node:assert/strict";
import { getProduct, getProducts } from "./products";

const ids = (await getProducts()).map((p) => p.id);
assert.equal(new Set(ids).size, ids.length, "catalog ids must be unique");

assert.equal((await getProduct("canvas-tote"))?.name, "Canvas Tote");
assert.equal(await getProduct("nope"), undefined);

console.log(`ok — ${ids.length} products`);
