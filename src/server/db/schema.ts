import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ProductDetails } from "@/types/product";

/** Catalog; `bun run db:seed` loads it from src/server/db/seed/. */
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  /** curated grid order */
  position: integer("position").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  color: text("color").notNull(),
  /** whole euros, same as Product["price"] */
  price: integer("price").notNull(),
});

/** One sheet per product, kept apart so grids and carts never load spec tables. */
export const productDetails = pgTable("product_details", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  highlights: jsonb("highlights").$type<ProductDetails["highlights"]>().notNull(),
  specs: jsonb("specs").$type<ProductDetails["specs"]>().notNull(),
  materials: text("materials").array().notNull(),
  inBox: text("in_box").array().notNull(),
  care: text("care").notNull(),
});

export const payments = pgTable("payments", {
  id: text("stripe_payment_intent_id").primaryKey(),
  clerkUserId: text("clerk_user_id"),
  status: text("status").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  receiptEmail: text("receipt_email"),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Saved delivery addresses; the default one pre-fills Stripe Checkout. */
export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clerkUserId: text("clerk_user_id").notNull(),
    name: text("name").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    postalCode: text("postal_code").notNull(),
    /** ISO 3166-1 alpha-2, one of SHIPPING_COUNTRIES */
    country: text("country").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("addresses_clerk_user_id_idx").on(table.clerkUserId),
    // At most one default per user, enforced by the database.
    uniqueIndex("addresses_one_default_idx").on(table.clerkUserId).where(sql`${table.isDefault}`),
  ],
);
