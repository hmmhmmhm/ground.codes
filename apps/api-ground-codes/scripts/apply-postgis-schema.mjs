import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "../supabase/001_ground_code_regions.sql");

const connectionString =
  process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set SUPABASE_DB_URL or DATABASE_URL before applying schema.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "require"
      ? { rejectUnauthorized: process.env.PGSSLREJECTUNAUTHORIZED !== "0" }
      : undefined,
});

await client.connect();
try {
  await client.query(await readFile(schemaPath, "utf8"));
  console.log("Applied Supabase PostGIS schema.");
} finally {
  await client.end();
}
