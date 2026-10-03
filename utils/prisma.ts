import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// Database provider selection:
// - Tests inject DB_PROVIDER=sqlite + DATABASE_URL="file:./test.db" (see tests/setup.ts)
// - Everything else keeps using the PostgreSQL connection from .env
const isSqlite = (process.env.DB_PROVIDER ?? "").toLowerCase() === "sqlite" ||
  (process.env.DATABASE_URL ?? "").startsWith("file:");

let prisma;

if (isSqlite) {
  // Keep the imports lazy so the pg adapter/client are never loaded in sqlite mode.
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const SqliteClient = (await import("../generated/prisma-sqlite/client.ts")).PrismaClient;

  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  prisma = new SqliteClient({ adapter });
} else {
  const { PrismaClient } = await import("../generated/prisma/client.ts");
  //import { PrismaClient }  from "@prisma/client";

  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaPg({ connectionString });
  prisma = new PrismaClient({ adapter });
}

export { prisma };
