ALTER TABLE "mao"."session" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mao"."session" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "mao"."session" ADD COLUMN "revoked_at" timestamp;