import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { payments, products } from "@/server/db/schema";
import { getStripe } from "@/server/stripe";

export type Order = Awaited<ReturnType<typeof getOrders>>[number];

/** What customers see and type: the payment id's last 8 characters, uppercased. */
export const orderNumber = (id: string) => id.slice(-8).toUpperCase();

/** The user's 20 latest paid orders, or just the one whose order number is `number`. */
export async function getOrders(userId: string, number?: string) {
  // Also keeps LIKE wildcards out of the suffix match below.
  if (number !== undefined && !/^[a-z0-9]{8}$/i.test(number)) return [];

  // The Stripe webhook records every payment with the Clerk id it was made under.
  // shortcut: the 8-character suffix is unique per user in practice, not by
  // constraint; store an order number in the webhook if collisions ever matter.
  const orders = await getDb()
    .select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(
      and(
        eq(payments.clerkUserId, userId),
        eq(payments.status, "succeeded"),
        number ? ilike(payments.id, `%${number}`) : undefined,
      ),
    )
    .orderBy(desc(payments.createdAt))
    .limit(number ? 1 : 20);

  // ponytail: line items stay in Stripe — one session lookup per order, capped
  // at the 20 latest; persist them in the webhook if this page gets slow.
  const stripe = getStripe();
  const sessions = await Promise.all(
    orders.map((order) =>
      stripe.checkout.sessions
        .list({ payment_intent: order.id, limit: 1, expand: ["data.line_items", "data.payment_intent.latest_charge"] })
        .then(({ data }) => data[0] ?? null)
        .catch(() => null),
    ),
  );
  const items = sessions.map((session) => session?.line_items?.data ?? []);

  // Stripe line items only carry the product name; match it back to the
  // catalog for the photo and link. Renamed or removed products show text only.
  const names = [...new Set(items.flat().map((item) => item.description).filter((name) => name !== null))];
  const catalog = names.length
    ? await getDb()
        .select({ id: products.id, name: products.name, image: products.image })
        .from(products)
        .where(inArray(products.name, names))
    : [];
  const byName = new Map(catalog.map((product) => [product.name, product]));

  return orders.map((order, index) => {
    const session = sessions[index];
    const intent = typeof session?.payment_intent === "object" ? session.payment_intent : null;
    const charge = typeof intent?.latest_charge === "object" ? intent.latest_charge : null;
    const returnStatus: "available" | "requested" | "refunded" | "unavailable" = !intent ? "unavailable"
      : charge?.refunded ? "refunded"
      : intent.metadata.returnStatus === "requested" ? "requested" : "available";

    return {
      ...order,
      number: orderNumber(order.id),
      returnStatus,
      // Everything below is null when the Stripe lookup failed; the page says so.
      subtotal: session?.amount_subtotal ?? null,
      shipping: session?.shipping_cost?.amount_total ?? null,
      tax: session?.total_details?.amount_tax ?? 0,
      discount: session?.total_details?.amount_discount ?? 0,
      email: session?.customer_details?.email ?? null,
      shipTo: session?.collected_information?.shipping_details ?? null,
      card: charge?.payment_method_details?.card ?? null,
      receiptUrl: charge?.receipt_url ?? null,
      items: items[index].map((item) => ({
        id: item.id,
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
        currency: item.currency,
        product: item.description ? byName.get(item.description) : undefined,
      })),
    };
  });
}
