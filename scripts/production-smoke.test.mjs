import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createSmokeRecorder,
  fetchWithRetry,
  getMissingMetricRoutes,
} from "./production-smoke-helpers.mjs";

describe("production smoke monitoring helpers", () => {
  test("records pass/fail status and elapsed time for each check", async () => {
    const recorder = createSmokeRecorder({ logger: {} });

    await recorder.check("fast check", async () => {});
    await recorder.check("failing check", async () => {
      throw new Error("network unavailable");
    });

    assert.equal(recorder.failures.length, 1);
    assert.match(recorder.failures[0], /^failing check: network unavailable/);
    assert.deepEqual(
      recorder.results.map(({ name, ok }) => ({ name, ok })),
      [
        { name: "fast check", ok: true },
        { name: "failing check", ok: false },
      ],
    );
    assert.ok(recorder.results.every((result) => result.durationMs >= 0));
  });

  test("identifies required API routes missing from metrics", () => {
    const metrics = {
      requests: {
        routes: {
          "/readyz": { count: 1 },
          "/v1/encode": { count: 2 },
        },
      },
    };

    assert.deepEqual(
      getMissingMetricRoutes(metrics, ["/readyz", "/v1/encode", "/v1/search"]),
      ["/v1/search"],
    );
  });

  test("retries transient fetch failures before returning a response", async () => {
    let attempts = 0;
    const response = await fetchWithRetry("https://api.example.test/readyz", {
      fetchImpl: async () => {
        attempts += 1;
        if (attempts < 2) throw new TypeError("fetch failed");
        return new Response("OK", { status: 200 });
      },
      retries: 2,
      retryDelayMs: 1,
    });

    assert.equal(attempts, 2);
    assert.equal(response.status, 200);
  });
});
