CREATE SCHEMA IF NOT EXISTS  "mao";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mao"."users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mao"."users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL
);
