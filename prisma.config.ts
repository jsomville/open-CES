import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Tests override the schema via SCHEMA_PATH to target the SQLite variant
  // (see tests/setup.ts). Defaults to the PostgreSQL schema.
  schema: env('SCHEMA_PATH') ?? './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
