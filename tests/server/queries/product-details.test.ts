// ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`)
import assert from "node:assert/strict";
import { test } from "bun:test";
import { getProductDetails } from "@/server/queries/product-details";
import { getProducts } from "@/server/queries/products";

// A product page renders the whole sheet, so a missing or thin one is a hole in
// the page, not a degraded section.
test("every product has a complete detail sheet", async () => {
  for (const product of await getProducts()) {
    const sheet = await getProductDetails(product.id);
    assert.ok(sheet, `${product.id} has no detail sheet`);
    assert.equal(sheet.highlights.length, 3, `${product.id}: three highlights`);
    assert.ok(sheet.specs.length >= 5, `${product.id}: at least five spec rows`);
    assert.ok(sheet.materials.length >= 2, `${product.id}: at least two materials`);
    assert.ok(sheet.inBox.length >= 2, `${product.id}: at least two box contents`);
    assert.ok(sheet.care.length > 0, `${product.id}: care line`);

    const filled = [
      ...sheet.highlights.flatMap((h) => [h.title, h.body]),
      ...sheet.specs.flatMap((s) => [s.label, s.value]),
      ...sheet.materials,
      ...sheet.inBox,
    ];
    assert.ok(filled.every((value) => value.trim().length > 0), `${product.id}: no blank fields`);
  }
});

// The sheet is keyed by id, so a retired product must not leave one behind.
test("retired stock has no sheet", async () => {
  assert.equal(await getProductDetails("canvas-tote"), undefined, "retired stock must not resolve");
});

// Numbers quoted in the catalog description must reappear in the sheet: the two
// are shown on the same page and may not disagree.
test("sheet figures match the catalog description", async () => {
  const measurement = /\d[\d.,]*\s?(?:L\b|ml\b|cm\b|mm\b|W\b|m²|°C|bar\b)/gi;
  for (const product of await getProducts()) {
    const sheet = await getProductDetails(product.id);
    assert.ok(sheet);
    const flat = JSON.stringify(sheet).replace(/\s+/g, "").toLowerCase();
    for (const fact of product.description.match(measurement) ?? []) {
      const needle = fact.replace(/\s+/g, "").toLowerCase();
      assert.ok(flat.includes(needle), `${product.id}: sheet drops "${fact}" from the description`);
    }
  }
});
