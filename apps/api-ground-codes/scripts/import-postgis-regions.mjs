import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

import { assertMaterializedRegionData } from "../../../scripts/region-data/materialization.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const defaultRegionDist = resolve(repoRoot, "packages/geoint/region-dist");
const schemaPath = resolve(here, "../supabase/001_ground_code_regions.sql");

const connectionString =
  process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
const regionDist = process.env.REGION_DIST_DIR ?? defaultRegionDist;
if (!connectionString) {
  console.error(
    "Set SUPABASE_DB_URL or DATABASE_URL before importing regions.",
  );
  process.exit(1);
}

assertMaterializedRegionData({
  directories: { "region-dist": regionDist },
  groups: ["region-dist"],
});
const batchSize = Number(process.env.REGION_IMPORT_BATCH_SIZE ?? 1000);
const importMode = process.env.REGION_IMPORT_MODE ?? "missing";

const normalizeLookupKey = (value) =>
  value
    .replace(/Æ/g, "Ae")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "Oe")
    .replace(/œ/g, "oe")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/Ð/g, "D")
    .replace(/ð/g, "d")
    .replace(/Þ/g, "Th")
    .replace(/þ/g, "th")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseDatasetName = (datasetName) => {
  const parts = datasetName.split("-");
  if (parts[0] !== "region" || !parts[1]) {
    throw new Error(`Unsupported dataset name: ${datasetName}`);
  }

  const regionLevel = Number(parts[1]);
  let body = "earth";
  let language = "english";
  const rest = parts.slice(2);

  if (rest[0] === "moon" || rest[0] === "mars") {
    body = rest[0];
    language = rest.slice(1).join("_") || "english";
  } else {
    language = rest.join("_") || "english";
  }

  return { body, regionLevel, language };
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const getDatasets = async () => {
  const explicitDatasets = process.env.REGION_DATASETS;
  if (explicitDatasets) {
    return explicitDatasets
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return (await readdir(regionDist))
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => fileName.replace(/\.json$/, ""))
    .sort();
};

const importDataset = async (client, datasetName) => {
  const { body, regionLevel, language } = parseDatasetName(datasetName);
  const datasetPath = resolve(regionDist, `${datasetName}.json`);
  const rows = JSON.parse(await readFile(datasetPath, "utf8"));
  console.log(
    `Importing ${datasetName}: ${rows.length} rows (${body}/${regionLevel}/${language})`,
  );

  if (importMode === "missing") {
    const existing = await client.query(
      "select count(*)::int as rows from ground_code_regions where dataset_name = $1",
      [datasetName],
    );
    if (existing.rows[0]?.rows === rows.length) {
      console.log(
        `Skipping ${datasetName}: ${rows.length} rows already present`,
      );
      return;
    }
  }

  await client.query("begin");
  try {
    await client.query(
      "delete from ground_code_regions where dataset_name = $1",
      [datasetName],
    );

    let imported = 0;
    for (const batch of chunk(
      rows.map((row, index) => ({ row, sourceIndex: index })),
      batchSize,
    )) {
      const values = [];
      const placeholders = batch.map(({ row, sourceIndex }, index) => {
        const offset = index * 16;
        values.push(
          datasetName,
          sourceIndex,
          body,
          regionLevel,
          language,
          row.code,
          row.name,
          normalizeLookupKey(row.code),
          normalizeLookupKey(row.name),
          row.lat,
          row.long,
          row.population ?? null,
          row.countryCode ?? null,
          row.featureType ?? null,
          row.diameterKm ?? null,
          row.source ?? null,
        );

        return `(${Array.from({ length: 16 }, (_, valueIndex) => `$${offset + valueIndex + 1}`).join(", ")}, ST_SetSRID(ST_MakePoint($${offset + 11}, $${offset + 10}), 4326))`;
      });

      await client.query(
        `
          insert into ground_code_regions (
            dataset_name,
            source_index,
            body,
            region_level,
            language,
            code,
            name,
            search_code,
            search_name,
            lat,
            lng,
            population,
            country_code,
            feature_type,
            diameter_km,
            source,
            geom
          )
          values ${placeholders.join(", ")}
        `,
        values,
      );
      imported += batch.length;
      if (imported % (batchSize * 10) === 0 || imported === rows.length) {
        console.log(`  ${datasetName}: ${imported}/${rows.length}`);
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
};

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
  for (const datasetName of await getDatasets()) {
    await importDataset(client, datasetName);
  }
} finally {
  await client.end();
}
