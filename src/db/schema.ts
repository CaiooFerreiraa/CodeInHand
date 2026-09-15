import { integer, pgSchema, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export const maoSchema = pgSchema("mao")

export const usersTable = maoSchema.table('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({length: 255}).notNull(),
  password: varchar({ length: 255 }).notNull()
})

export const sessionTables = maoSchema.table('session', {
  id: uuid().primaryKey(),
  refreshToken: varchar("refresh_token", {length: 255}).notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date' }),
  revokedAt: timestamp("revoked_at", { mode: 'date' }),
  
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade"
  })
})