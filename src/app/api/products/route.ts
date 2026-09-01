import { getProducts } from "@/server/queries/products";

export async function GET() {
  return Response.json(await getProducts());
}
