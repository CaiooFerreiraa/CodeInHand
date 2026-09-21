CREATE TABLE "mao"."tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	"session_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mao"."session" DROP COLUMN "refresh_token";--> statement-breakpoint
ALTER TABLE "mao"."session" DROP COLUMN "revoked_at";--> statement-breakpoint
ALTER TABLE "mao"."tokens" ADD CONSTRAINT "tokens_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "mao"."session"("id") ON DELETE CASCADE ON UPDATE CASCADE;