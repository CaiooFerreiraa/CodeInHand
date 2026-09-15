CREATE TABLE "mao"."session" (
	"id" uuid PRIMARY KEY,
	"refresh_token" varchar(255) NOT NULL,
	"access_token" varchar(255) NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
ALTER TABLE "mao"."session" ADD CONSTRAINT "session_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mao"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;