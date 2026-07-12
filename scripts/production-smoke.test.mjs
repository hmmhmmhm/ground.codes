import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  validateMetricsSnapshot,
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

  test("accepts an empty Worker-isolate metrics snapshot", () => {
    assert.deepEqual(
      validateMetricsSnapshot({
        service: "api-ground-codes",
        scope: "worker-isolate",
        uptimeSeconds: 0,
        requests: { total: 0, avgMs: 0, byPath: {}, routes: {} },
      }),
      [],
    );
  });

  test("reports invalid metrics snapshot fields", () => {
    assert.deepEqual(
      validateMetricsSnapshot({
        service: "api-ground-codes",
        scope: "global",
        uptimeSeconds: -1,
        requests: { total: -1, avgMs: "fast", byPath: [], routes: null },
      }),
      [
        'scope must be "worker-isolate"',
        "uptimeSeconds must be a non-negative number",
        "requests.total must be a non-negative number",
        "requests.avgMs must be a non-negative number",
        "requests.byPath must be an object",
        "requests.routes must be an object",
      ],
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

  test("formats a GitHub step summary with check timings", () => {
    const markdown = formatGitHubStepSummary([
      { name: "API readiness", ok: true, durationMs: 122.4 },
      { name: "Web sitemap", ok: false, durationMs: 508.9 },
    ]);

    assert.match(markdown, /^## Production Smoke/);
    assert.match(markdown, /\| API readiness \| ok \| 122.4ms \|/);
    assert.match(markdown, /\| Web sitemap \| failed \| 508.9ms \|/);
  });
});
