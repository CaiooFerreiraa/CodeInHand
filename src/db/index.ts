import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { usersTable } from './schema';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const user: typeof usersTable.$inferInsert = {
    password: "123456",
    username: "Caio"
  }

  try {
    await db.insert(usersTable).values(user);
    console.log("Usuário inserido com sucesso")
  } catch (error) {
    console.error("Houve um erro: " + error)
  }
}

main()