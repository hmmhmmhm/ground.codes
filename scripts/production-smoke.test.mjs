import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  validateMetricsSnapshot,
} from "./production-smoke-helpers.mjs";
import { runOperationsSmokeChecks } from "./production-smoke-operations.mjs";

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

  test("reports invalid nested metrics snapshot fields", () => {
    assert.deepEqual(
      validateMetricsSnapshot({
        scope: "worker-isolate",
        uptimeSeconds: 1,
        requests: {
          total: 2,
          avgMs: 1,
          byPath: { "/readyz": -1, "/v1/search": "two" },
          routes: {
            "GET /readyz": {
              count: -1,
              avgMs: "fast",
              minMs: 0,
              maxMs: Number.POSITIVE_INFINITY,
              byStatus: { 200: -1 },
            },
            "POST /v1/search": null,
          },
        },
      }),
      [
        'requests.byPath["/readyz"] must be a non-negative number',
        'requests.byPath["/v1/search"] must be a non-negative number',
        'requests.routes["GET /readyz"].count must be a non-negative number',
        'requests.routes["GET /readyz"].avgMs must be a non-negative number',
        'requests.routes["GET /readyz"].maxMs must be a non-negative number',
        'requests.routes["GET /readyz"].byStatus["200"] must be a non-negative number',
        'requests.routes["POST /v1/search"] must be an object',
      ],
    );
  });

  test("runs the split operations smoke checks with injected HTTP helpers", async () => {
    const recorder = createSmokeRecorder({ logger: {} });
    const requestedUrls = [];
    const assertSmoke = (condition, message) => {
      if (!condition) throw new Error(message);
    };
    const fetchWithRetryStub = async (url) => {
      requestedUrls.push(url);
      if (url.endsWith("/v1/decode")) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_INPUT" } }),
          { status: 400 },
        );
      }
      if (url.endsWith("/v1/region/info")) {
        return new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), {
          status: 404,
        });
      }
      return new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), {
        status: 404,
      });
    };

    await runOperationsSmokeChecks({
      smoke: recorder,
      assert: assertSmoke,
      fetchWithRetry: fetchWithRetryStub,
      fetchText: async (url) => {
        if (url.endsWith("/metrics")) {
          return JSON.stringify({
            service: "api-ground-codes",
            scope: "worker-isolate",
            uptimeSeconds: 0,
            requests: { total: 0, avgMs: 0, byPath: {}, routes: {} },
          });
        }
        if (url.endsWith("/robots.txt")) return "Sitemap: /sitemap.xml";
        return "<loc>https://ground.codes</loc>";
      },
      postJson: async (_path, body) => {
        if (body.body === "moon") return "Mare Tranquillitatis-Alder";
        if (body.body === "mars") return "Olympus Mons-Alder";
        return "Mollereisstrom-Alder";
      },
      postJsonBody: async (_path, body) => ({
        results: [
          {
            label:
              body.query === "Springfield"
                ? "West Springfield"
                : "Mollereisstrom",
          },
        ],
      }),
      apiBaseUrl: "https://api.example.test",
      webBaseUrl: "https://ground.codes",
      validateMetricsSnapshot,
    });

    assert.deepEqual(recorder.failures, []);
    assert.deepEqual(requestedUrls, [
      "https://api.example.test/v1/decode",
      "https://api.example.test/v1/region/info",
      "https://api.example.test/v1/encode",
    ]);
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
