import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  runRegisteredSmokeChecks,
  validateMetricsSnapshot,
} from "./production-smoke-helpers.mjs";
import { runAdditionalLatinSmokeChecks } from "./production-smoke-additional-latin.mjs";
import { runAdditionalSmokeChecks } from "./production-smoke-additional.mjs";
import { runCoreLanguageSmokeChecks } from "./production-smoke-core.mjs";
import { runExpandedSmokeChecks } from "./production-smoke-expanded.mjs";
import { runFullOperationsSmokeChecks } from "./production-smoke-operations.mjs";
import {
  resolveSmokeProfile,
  runSmokeProfile,
  smokeProfileCheckMetadata,
  smokeProfiles,
} from "./production-smoke-profiles.mjs";
import { runQuickSmokeChecks } from "./production-smoke-quick.mjs";

const nowMs = Date.parse("2026-07-13T00:00:10.000Z");
const runtimeCommit = "0123456789abcdef0123456789abcdef01234567";

const createValidMetricsSnapshot = (overrides = {}) => ({
  service: "api-ground-codes",
  scope: "worker-isolate",
  startedAt: "2026-07-13T00:00:00.000Z",
  uptimeSeconds: 10,
  runtimeCommit,
  requests: { total: 0, avgMs: 0, byPath: {}, routes: {} },
  ...overrides,
});

describe("production smoke monitoring helpers", () => {
  test("resolves the default and explicit smoke profiles", () => {
    assert.equal(resolveSmokeProfile(), "full");
    assert.equal(resolveSmokeProfile("quick"), "quick");
    assert.equal(resolveSmokeProfile("full"), "full");
    assert.throws(
      () => resolveSmokeProfile("weekly"),
      /Unknown production smoke profile: weekly/,
    );
  });

  test("selects the exact runner sequence for each smoke profile", () => {
    assert.deepEqual(smokeProfiles.quick, [runQuickSmokeChecks]);
    assert.deepEqual(smokeProfiles.full, [
      runQuickSmokeChecks,
      runCoreLanguageSmokeChecks,
      runExpandedSmokeChecks,
      runAdditionalSmokeChecks,
      runAdditionalLatinSmokeChecks,
      runFullOperationsSmokeChecks,
    ]);
  });

  test("keeps stable machine check IDs unique and separate from labels", () => {
    const fullChecks = smokeProfileCheckMetadata.full;
    const fullIds = fullChecks.map(({ id }) => id);
    const quickIds = smokeProfileCheckMetadata.quick.map(({ id }) => id);

    assert.equal(new Set(fullIds).size, fullIds.length);
    assert.ok(fullIds.every((id) => /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)));
    assert.ok(fullChecks.every(({ id, label }) => id !== label));
    assert.deepEqual(fullIds.slice(0, quickIds.length), quickIds);
    assert.deepEqual(quickIds, [
      "api.readiness",
      "web.root",
      "web.robots",
      "web.sitemap",
      "api.metrics",
      "earth.english.encode",
      "earth.english.search",
      "earth.english.decode",
      "earth.korean.encode",
      "moon.english.encode",
      "mars.english.encode",
    ]);
  });

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

  test("keeps reordered check IDs, labels, and behavior semantically bound", async () => {
    const recorder = createSmokeRecorder({ logger: {} });
    const executed = [];
    const checks = ["b", "a"].map((key) => ({
      id: `check.${key}`,
      label: `Check ${key.toUpperCase()}`,
      run: async () => executed.push(key),
    }));

    await runRegisteredSmokeChecks({ smoke: recorder }, checks);

    assert.deepEqual(executed, ["b", "a"]);
    assert.deepEqual(
      recorder.results.map(({ id, name }) => ({ id, name })),
      checks.map(({ id, label: name }) => ({ id, name })),
    );
    await assert.rejects(
      runRegisteredSmokeChecks({ smoke: recorder }, [checks[0], checks[0]]),
      /Duplicate smoke check ID/,
    );
    await assert.rejects(
      runRegisteredSmokeChecks({ smoke: recorder }, [
        { id: "missing.run", label: "Missing" },
      ]),
      /must define an id, label, and run/,
    );
  });

  test("accepts valid runtime metadata with empty route maps", () => {
    assert.deepEqual(
      validateMetricsSnapshot(createValidMetricsSnapshot(), { nowMs }),
      [],
    );
  });

  test("rejects missing and incorrect service names", () => {
    for (const service of [undefined, "ground-codes-api"]) {
      assert.deepEqual(
        validateMetricsSnapshot(createValidMetricsSnapshot({ service }), {
          nowMs,
        }),
        ['service must be "api-ground-codes"'],
      );
    }
  });

  test("rejects an invalid startedAt timestamp", () => {
    assert.deepEqual(
      validateMetricsSnapshot(
        createValidMetricsSnapshot({ startedAt: "not-an-iso-timestamp" }),
        { nowMs },
      ),
      ["startedAt must be a valid ISO-8601 timestamp"],
    );
  });

  test("rejects a startedAt timestamp before 2020", () => {
    const pre2020StartedAt = Date.parse("2019-12-31T23:59:59.000Z");
    assert.deepEqual(
      validateMetricsSnapshot(
        createValidMetricsSnapshot({
          startedAt: new Date(pre2020StartedAt).toISOString(),
          uptimeSeconds: (nowMs - pre2020StartedAt) / 1000,
        }),
        { nowMs },
      ),
      ["startedAt must be on or after 2020-01-01T00:00:00.000Z"],
    );
  });

  test("rejects a startedAt timestamp more than three seconds ahead", () => {
    assert.deepEqual(
      validateMetricsSnapshot(
        createValidMetricsSnapshot({
          startedAt: new Date(nowMs + 3_001).toISOString(),
          uptimeSeconds: 0,
        }),
        { nowMs },
      ),
      ["startedAt must not be more than 3 seconds in the future"],
    );
  });

  test("keeps the future bound fixed when uptime tolerance is wider", () => {
    assert.deepEqual(
      validateMetricsSnapshot(
        createValidMetricsSnapshot({
          startedAt: new Date(nowMs + 3_001).toISOString(),
          uptimeSeconds: 0,
        }),
        { nowMs, uptimeToleranceSeconds: 10 },
      ),
      ["startedAt must not be more than 3 seconds in the future"],
    );
  });

  test("rejects uptime inconsistent with startedAt", () => {
    assert.deepEqual(
      validateMetricsSnapshot(
        createValidMetricsSnapshot({ uptimeSeconds: 2 }),
        { nowMs },
      ),
      [
        "uptimeSeconds must be within 3 seconds of elapsed time since startedAt",
      ],
    );
  });

  test("rejects missing and malformed runtime commits", () => {
    for (const invalidCommit of [
      undefined,
      "0123456789abcdef0123456789abcdef0123456",
      "0123456789ABCDEF0123456789ABCDEF01234567",
    ]) {
      assert.deepEqual(
        validateMetricsSnapshot(
          createValidMetricsSnapshot({ runtimeCommit: invalidCommit }),
          { nowMs },
        ),
        [
          "runtimeCommit must be a 40-character lowercase hexadecimal commit SHA",
        ],
      );
    }
  });

  for (const [description, invalidCommit] of [
    ["an array", [runtimeCommit]],
    ["a coercible object", { toString: () => runtimeCommit }],
    ["a number", 42],
  ]) {
    test(`rejects runtimeCommit supplied as ${description}`, () => {
      assert.deepEqual(
        validateMetricsSnapshot(
          createValidMetricsSnapshot({ runtimeCommit: invalidCommit }),
          { nowMs },
        ),
        [
          "runtimeCommit must be a 40-character lowercase hexadecimal commit SHA",
        ],
      );
    });
  }

  test("reports invalid metrics snapshot fields", () => {
    assert.deepEqual(
      validateMetricsSnapshot(
        createValidMetricsSnapshot({
          scope: "global",
          uptimeSeconds: -1,
          requests: { total: -1, avgMs: "fast", byPath: [], routes: null },
        }),
        { nowMs },
      ),
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
      validateMetricsSnapshot(
        createValidMetricsSnapshot({
          requests: {
            total: 2,
            avgMs: 1,
            byPath: {
              "/negative": -1,
              "/nan": Number.NaN,
              "/infinite": Number.POSITIVE_INFINITY,
            },
            routes: {
              "GET /readyz": {
                count: -1,
                avgMs: Number.NaN,
                minMs: 0,
                maxMs: Number.POSITIVE_INFINITY,
                byStatus: { 200: Number.NEGATIVE_INFINITY },
              },
              "POST /v1/search": null,
            },
          },
        }),
        { nowMs },
      ),
      [
        'requests.byPath["/negative"] must be a non-negative number',
        'requests.byPath["/nan"] must be a non-negative number',
        'requests.byPath["/infinite"] must be a non-negative number',
        'requests.routes["GET /readyz"].count must be a non-negative number',
        'requests.routes["GET /readyz"].avgMs must be a non-negative number',
        'requests.routes["GET /readyz"].maxMs must be a non-negative number',
        'requests.routes["GET /readyz"].byStatus["200"] must be a non-negative number',
        'requests.routes["POST /v1/search"] must be an object',
      ],
    );
  });

  test("runs the full-only operations checks with registered machine IDs", async () => {
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

    await runFullOperationsSmokeChecks({
      smoke: recorder,
      assert: assertSmoke,
      fetchWithRetry: fetchWithRetryStub,
      fetchText: async (url) => {
        assert.equal(url, "https://api.example.test/");
        return "Ground Codes API /v1/encode";
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
      validateMetricsSnapshot: (metrics) =>
        validateMetricsSnapshot(metrics, { nowMs }),
    });

    assert.deepEqual(recorder.failures, []);
    assert.deepEqual(
      recorder.results.map(({ id }) => id),
      smokeProfileCheckMetadata.full.slice(-6).map(({ id }) => id),
    );
    assert.deepEqual(requestedUrls, [
      "https://api.example.test/v1/decode",
      "https://api.example.test/v1/region/info",
      "https://api.example.test/v1/encode",
    ]);
  });

  test("executes every full-profile registry entry exactly once", async () => {
    const recorder = createSmokeRecorder({ logger: {} });
    const runtime = {
      smoke: recorder,
      assert: () => {},
      fetchWithRetry: async () =>
        new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), {
          status: 404,
        }),
      fetchText: async (url) => {
        if (url.endsWith("/readyz")) {
          return JSON.stringify({
            status: "ready",
            service: "api-ground-codes",
            runtimeTag: "workspace",
            runtimeCommit,
          });
        }
        if (url.endsWith("/metrics")) {
          return JSON.stringify(createValidMetricsSnapshot());
        }
        return "Ground Codes API /v1/encode Sitemap: <loc>https://ground.codes</loc>";
      },
      postJson: async (_path, body) => {
        if (body.language === "korean") return "서울-code";
        if (body.body === "moon") return "Mare Tranquillitatis-code";
        if (body.body === "mars") return "Olympus Mons-code";
        if (body.lat === -82) return "Mollereisstrom-Alder";
        return "Seoul-code";
      },
      postJsonBody: async () => ({
        lat: 37.566,
        lng: 126.978,
        results: [{ label: "West Springfield" }],
      }),
      apiBaseUrl: "https://api.example.test",
      webBaseUrl: "https://ground.codes",
      validateMetricsSnapshot: () => [],
    };

    await runSmokeProfile("full", runtime);

    assert.deepEqual(recorder.failures, []);
    assert.deepEqual(
      recorder.results.map(({ id, name }) => ({ id, name })),
      smokeProfileCheckMetadata.full.map(({ id, label: name }) => ({
        id,
        name,
      })),
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
