import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createApp } from "../../apps/api-ground-codes/src/app.ts";
import { getRuntimeMetadata } from "../../apps/api-ground-codes/src/endpoints/healthz.ts";
import { getDefaultRateLimit } from "../../apps/api-ground-codes/src/endpoints/rate-limit.ts";
import {
  ApiInputError,
  ApiNotFoundError,
  formatApiError,
} from "../../apps/api-ground-codes/src/endpoints/v1/api-error.ts";
import { getRegionDatasetName } from "../../apps/api-ground-codes/src/endpoints/v1/language.ts";
import {
  validateBody,
  validateCoordinates,
  validateLanguage,
  validateMaxResults,
  validatePrecisionMeters,
  validateRegionLevel,
  validateSearchBiasCoordinates,
  validateSearchQuery,
} from "../../apps/api-ground-codes/src/endpoints/v1/validation.ts";
import { startServer } from "../../apps/api-ground-codes/src/index.ts";
import {
  getDatasetName,
  getFallbackSearchLevels,
  normalizeLookupKey,
  selectProminentRegionRow,
  toRegionSearchResult,
} from "../../apps/api-ground-codes/src/postgis-region-selection.ts";
import { createWorker } from "../../apps/api-ground-codes/src/worker.ts";

const originalRateLimit = process.env.API_RATE_LIMIT_PER_MINUTE;

afterEach(() => {
  if (originalRateLimit === undefined)
    delete process.env.API_RATE_LIMIT_PER_MINUTE;
  else process.env.API_RATE_LIMIT_PER_MINUTE = originalRateLimit;
});

test("API app exercises operational, documentation, CORS, and error behavior", async () => {
  const records: object[] = [];
  const app = createApp({
    rateLimit: null,
    corsOrigins: ["https://ground.codes"],
    metrics: { writeLog: (record) => records.push(record) },
  });

  const ready = await app.handle(new Request("http://localhost/readyz"));
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).status, "ready");

  const docs = await app.handle(new Request("http://localhost/docs"));
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /Ground Codes API/);

  const preflight = await app.handle(
    new Request("http://localhost/healthz", {
      method: "OPTIONS",
      headers: {
        origin: "https://ground.codes",
        "access-control-request-headers": "content-type, x-probe",
      },
    }),
  );
  assert.equal(preflight.status, 204);

  const invalid = await app.handle(
    new Request("http://localhost/v1/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "", maxResults: 0 }),
    }),
  );
  assert.equal(invalid.status, 400);
  await new Promise<void>((resolve) => setImmediate(resolve));

  const metrics = await app.handle(new Request("http://localhost/metrics"));
  assert.equal(metrics.status, 200);
  assert.ok((await metrics.json()).requests.total >= 1);
  assert.ok(records.length >= 1);
});

test("API validation and runtime helpers cover accepted and rejected inputs", () => {
  assert.equal(validateLanguage("korean"), "korean");
  assert.equal(validateBody("mars"), "mars");
  assert.equal(validateCoordinates({ lat: 37.5, lng: 127 }), undefined);
  assert.equal(validatePrecisionMeters(3), undefined);
  assert.equal(
    validateRegionLevel({ body: "moon", regionLevel: 2 }),
    undefined,
  );
  assert.equal(validateMaxResults(5), undefined);
  assert.deepEqual(validateSearchBiasCoordinates({ biasLat: 1, biasLng: 2 }), {
    biasLat: 1,
    biasLng: 2,
  });
  assert.equal(validateSearchQuery(" Seoul "), "Seoul");

  for (const call of [
    () => validateLanguage("unknown"),
    () => validateBody("venus"),
    () => validateCoordinates({ lat: 91, lng: 0 }),
    () => validatePrecisionMeters(0),
    () => validateRegionLevel({ body: "moon", regionLevel: 1 }),
    () => validateMaxResults(0),
    () => validateSearchBiasCoordinates({ biasLat: 1 }),
    () => validateSearchQuery(" "),
  ]) {
    assert.throws(call, ApiInputError);
  }

  assert.equal(
    getRegionDatasetName({
      body: "earth",
      language: "english",
      regionLevel: 1,
    }),
    "region-1",
  );
  assert.equal(
    getRegionDatasetName({
      body: "mars",
      regionLevel: 3,
      language: "korean",
    }),
    "region-3-mars-korean",
  );

  const set = { status: 200 as number | string };
  assert.deepEqual(
    formatApiError(new ApiInputError("bad input"), "UNKNOWN", set),
    { error: { code: "INVALID_INPUT", message: "bad input" } },
  );
  assert.equal(set.status, 400);
  assert.equal(
    formatApiError(new ApiNotFoundError("missing"), "UNKNOWN", set).error.code,
    "NOT_FOUND",
  );

  process.env.API_RATE_LIMIT_PER_MINUTE = "0";
  assert.equal(getDefaultRateLimit(), null);
  process.env.API_RATE_LIMIT_PER_MINUTE = "4";
  assert.deepEqual(getDefaultRateLimit(), { max: 4, windowMs: 60_000 });
  assert.match(getRuntimeMetadata().runtimeCommit, /^[0-9a-f]{40}$/);
});

test("region selection, server startup, and Worker initialization are behaviorally exercised", async () => {
  assert.equal(normalizeLookupKey("  Ærøskøbing  "), "aeroskobing");
  assert.equal(getDatasetName("earth", 1, "english"), "region-1");
  assert.equal(getDatasetName("mars", 3, "korean"), "region-3-mars-korean");
  assert.deepEqual(getFallbackSearchLevels("earth", 2), [1, 3]);
  assert.deepEqual(getFallbackSearchLevels("moon", 2), []);
  assert.deepEqual(
    toRegionSearchResult({
      source_index: 1,
      name: "Seoul",
      code: "SEO",
      lat: "37.5",
      lng: "127",
      body: "earth",
      region_level: 2,
      population: "100",
      distance_km: "1.5",
    }),
    {
      name: "Seoul",
      code: "SEO",
      lat: 37.5,
      lng: 127,
      body: "earth",
      regionLevel: 2,
      population: 100,
      distanceKm: 1.5,
    },
  );
  assert.equal(selectProminentRegionRow([], { lat: 0, lng: 0 }, "earth"), null);

  const logs: string[] = [];
  const server = startServer({
    port: 4000,
    clearConsole: () => logs.push("clear"),
    writeLog: (message) => logs.push(message),
    createApplication: (port) => ({ server: { hostname: "localhost", port } }),
  });
  assert.equal(server.server?.port, 4000);
  assert.equal(logs.length, 3);

  const events: string[] = [];
  const worker = createWorker({
    createApplication: () => ({
      handle: async () => new Response("ok"),
    }),
    installRegionStore: (connection) => events.push(connection),
    installRuntimeMetadata: () => events.push("metadata"),
  });
  const env = { HYPERDRIVE: { connectionString: "postgres://probe" } };
  assert.equal(
    await (
      await worker.fetch(new Request("http://localhost/readyz"), env)
    ).text(),
    "ok",
  );
  assert.equal(
    await (
      await worker.fetch(new Request("http://localhost/healthz"), env)
    ).text(),
    "ok",
  );
  assert.deepEqual(events, ["metadata", "postgres://probe", "metadata"]);
});
