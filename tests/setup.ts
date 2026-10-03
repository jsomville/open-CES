/**
 * Test database setup.
 *
 * Loaded as the FIRST mocha spec file (see "test" script in package.json) so the
 * process.env config below is injected before any other test file (and therefore
 * before utils/prisma.ts) is imported.
 *
 * Responsibilities:
 *  1. Inject database configs into process.env (SQLite file DB: test.db)
 *  2. Re-create the local SQLite database (test.db) from scratch on every run
 *  3. Seed it with base data
 */
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// 1. Inject configs (must happen BEFORE importing utils/prisma.ts)
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const testDbFile = path.join(projectRoot, "test.db");
const testDbUrl = `file:${testDbFile}`;

process.env.NODE_ENV = "test";
process.env.IS_TESTING = "true";
process.env.DB_PROVIDER = "sqlite";
// Absolute path so both the Prisma CLI and the better-sqlite3 adapter resolve it identically
process.env.DATABASE_URL = testDbUrl;
// Point the Prisma CLI at the SQLite variant of the schema
process.env.SCHEMA_PATH = path.join(projectRoot, "prisma", "schema.sqlite.prisma");

console.log("[tests/setup.ts] DB config injected:");
console.log(`  DB_PROVIDER  = ${process.env.DB_PROVIDER}`);
console.log(`  DATABASE_URL = ${process.env.DATABASE_URL}`);

// ---------------------------------------------------------------------------
// 2. Re-create the database from scratch (delete -> schema push -> seed)
// ---------------------------------------------------------------------------
console.log(`[tests/setup.ts] Re-creating test database: ${testDbFile}`);

// Remove previous database files (main db + WAL/SHM journal files)
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${testDbFile}${suffix}`;
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.log(`  deleted: ${path.basename(file)}`);
  }
}

// Create the schema using the SQLite Prisma schema (no migrations needed for tests)
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "db", "push", "--schema", process.env.SCHEMA_PATH],
  { cwd: projectRoot, stdio: "inherit", env: process.env },
);

if (result.status !== 0) {
  throw new Error(`[tests/setup.ts] Failed to create test database schema (exit code ${result.status})`);
}

// ---------------------------------------------------------------------------
// 3. Seed the database with base data
// ---------------------------------------------------------------------------
const { prisma } = await import("../utils/prisma.ts");
const { connectRedis, redisClient } = await import("../utils/redisClient.ts");
const { createCurrency, getCurrencyBySymbol } = await import("../services/currency_service.ts");
const { createCurrencyMainAccount } = await import("../services/account_service.ts");
const { createUser } = await import("../services/user_service.ts");
const argon2 = (await import("argon2")).default;

async function seed() {
  console.log("[tests/setup.ts] Seeding test database...");

  // Services invalidate caches via Redis while seeding
  await connectRedis();

  // Admin user (mirrors prisma/initdb.ts)
  const adminPassword = process.env.ADMIN_PASSWORD || "1234";
  const adminEmail = "admin@opences.org";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await createUser(
      adminEmail,
      "+32488040204",
      await argon2.hash(adminPassword),
      "admin",
      "admin",
      "admin",
    );
    console.log(`  - Admin user created: ${admin.email}`);
  }

  // Base currency "CES" (mirrors prisma/initdb.ts)
  let currency = await getCurrencyBySymbol("CES");
  if (!currency) {
    currency = await createCurrency({
      symbol: "CES",
      name: "Open CES",
      country: "EU",
      logoURL: "ces.png",
      webSiteURL: "https://open-ces.org",
      regionList: '[1000, 2000, 3000, 4000]',
      newAccountWizardURL: "https:/google.com",
      topOffWizardURL: "https:/google.com",
      androidAppURL: "https://google.com",
      iphoneAppURL: "https://google.com",
      androidAppLatestVersion: "1.0.0",
      iphoneAppLatestVersion: "1.0.0",
    });
    await createCurrencyMainAccount(currency);
    console.log("  - Currency 'CES' created with main account");
  }

  console.log("[tests/setup.ts] Seeding completed");
}

await seed();

// When run standalone (not inside mocha), disconnect so the process can exit.
// Inside mocha, the shared prisma client from utils/prisma.ts is reused by the
// tests, so it must stay connected.
const isStandalone = process.argv[1] === fileURLToPath(import.meta.url);
if (isStandalone) {
  await prisma.$disconnect();
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}
