CREATE TABLE "product_details" (
	"product_id" text PRIMARY KEY NOT NULL,
	"highlights" jsonb NOT NULL,
	"specs" jsonb NOT NULL,
	"materials" text[] NOT NULL,
	"in_box" text[] NOT NULL,
	"care" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"image" text NOT NULL,
	"color" text NOT NULL,
	"price" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_details" ADD CONSTRAINT "product_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;