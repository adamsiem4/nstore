CREATE TABLE "payments" (
	"stripe_payment_intent_id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"status" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"receipt_email" text,
	"confirmation_email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
