import type { Product } from "@/types/product";

// ponytail: in-memory catalog behind an async API — replace these two bodies
// with DB queries and nothing upstream changes.
const catalog: Product[] = [
  {
    id: "aero-hoodie",
    name: "Aero Hoodie",
    description: "Heavyweight brushed fleece, boxy fit, no logo.",
    price: 68,
  },
  {
    id: "canvas-tote",
    name: "Canvas Tote",
    description: "18oz cotton canvas with reinforced base and inner pocket.",
    price: 24,
  },
  {
    id: "merino-beanie",
    name: "Merino Beanie",
    description: "Fine-gauge merino, ribbed cuff, holds shape when wet.",
    price: 32,
  },
  {
    id: "field-jacket",
    name: "Field Jacket",
    description: "Waxed cotton shell, four pockets, corduroy collar.",
    price: 140,
  },
  {
    id: "runner-socks",
    name: "Runner Socks",
    description: "Merino blend, cushioned heel, sold as a three pack.",
    price: 12,
  },
  {
    id: "leather-belt",
    name: "Leather Belt",
    description: "Full-grain vegetable-tanned leather, solid brass buckle.",
    price: 45,
  },
];

export async function getProducts(query?: string): Promise<Product[]> {
  const q = query?.trim().toLowerCase();

  if (!q) return catalog;

  return catalog.filter((p) =>
    `${p.name} ${p.description}`.toLowerCase().includes(q),
  );
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return catalog.find((p) => p.id === id);
}
