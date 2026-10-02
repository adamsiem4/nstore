CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "addresses_clerk_user_id_idx" ON "addresses" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_one_default_idx" ON "addresses" USING btree ("clerk_user_id") WHERE "addresses"."is_default";