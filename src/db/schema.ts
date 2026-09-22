import { integer, pgSchema, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export const maoSchema = pgSchema("mao")

export const usersTable = maoSchema.table('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({length: 255}).notNull(),
  password: varchar({ length: 255 }).notNull()
})

export const sessionTable = maoSchema.table('session', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date' }),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),
  
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade"
  })
})

export const tokensTable = maoSchema.table('tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', {mode: 'date'}).defaultNow(),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),

  sessionId: uuid('session_id').references(() => sessionTable.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade'
  }).notNull()
})