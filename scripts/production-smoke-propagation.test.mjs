import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { validateMetricsSnapshot } from "./production-smoke-helpers.mjs";
import { quickSmokeChecks } from "./production-smoke-quick.mjs";

const nowMs = Date.parse("2026-07-13T00:00:10.000Z");
const runtimeCommit = "0123456789abcdef0123456789abcdef01234567";
const expectedRuntimeCommit = "89abcdef0123456789abcdef0123456789abcdef";

const createValidMetricsSnapshot = (overrides = {}) => ({
  service: "api-ground-codes",
  scope: "worker-isolate",
  startedAt: "2026-07-13T00:00:00.000Z",
  uptimeSeconds: 10,
  runtimeCommit,
  requests: { total: 0, avgMs: 0, byPath: {}, routes: {} },
  ...overrides,
});

const metricsCheck = quickSmokeChecks.find(({ id }) => id === "api.metrics");
const assertSmoke = (condition, message) => assert.ok(condition, message);
const validateAtTestTime = (metrics, options) =>
  validateMetricsSnapshot(metrics, { nowMs, ...options });

describe("post-deploy metrics propagation", () => {
  test("rejects a valid snapshot from a different deployment commit", () => {
    assert.deepEqual(
      validateMetricsSnapshot(createValidMetricsSnapshot(), {
        nowMs,
        expectedRuntimeCommit,
      }),
      [
        `runtimeCommit must match expected deployment commit ${expectedRuntimeCommit}`,
      ],
    );
  });

  test("rejects a malformed expected commit before making a request", async () => {
    const unsafeExpectedCommit = "not-a-sha?request_secret=private";
    let fetchCalls = 0;
    let sleeps = 0;

    assert.deepEqual(
      validateMetricsSnapshot(createValidMetricsSnapshot(), {
        nowMs,
        expectedRuntimeCommit: unsafeExpectedCommit,
      }),
      [
        "expectedRuntimeCommit must be a 40-character lowercase hexadecimal commit SHA",
      ],
    );

    await assert.rejects(
      metricsCheck.run({
        assert: assertSmoke,
        fetchText: async () => {
          fetchCalls += 1;
          return JSON.stringify(createValidMetricsSnapshot());
        },
        apiBaseUrl: "https://api.example.test",
        expectedRuntimeCommit: unsafeExpectedCommit,
        metricsRetryOptions: {
          maxAttempts: 3,
          retryDelayMs: 1,
          sleep: async () => {
            sleeps += 1;
          },
        },
        validateMetricsSnapshot: validateAtTestTime,
      }),
      (error) => {
        assert.match(error.message, /expectedRuntimeCommit must be/);
        assert.doesNotMatch(error.message, /request_secret|private/);
        return true;
      },
    );

    assert.equal(fetchCalls, 0);
    assert.equal(sleeps, 0);
  });

  for (const [failureName, firstResponse] of [
    ["network exhaustion", new TypeError("fetch failed")],
    [
      "HTTP failure",
      new Error("https://api.example.test/metrics returned 503: private body"),
    ],
    ["malformed JSON", "{not-json"],
  ]) {
    test(`retries ${failureName} until valid metrics arrive`, async () => {
      let attempts = 0;
      const delays = [];

      await metricsCheck.run({
        assert: assertSmoke,
        fetchText: async () => {
          attempts += 1;
          if (attempts === 1) {
            if (firstResponse instanceof Error) throw firstResponse;
            return firstResponse;
          }
          return JSON.stringify(
            createValidMetricsSnapshot({
              runtimeCommit: expectedRuntimeCommit,
            }),
          );
        },
        apiBaseUrl: "https://api.example.test",
        expectedRuntimeCommit,
        metricsRetryOptions: {
          maxAttempts: 2,
          retryDelayMs: 7,
          sleep: async (delayMs) => delays.push(delayMs),
        },
        validateMetricsSnapshot: validateAtTestTime,
      });

      assert.equal(attempts, 2);
      assert.deepEqual(delays, [7]);
    });
  }

  test("does not expose response details after transient retries are exhausted", async () => {
    const responseSecret = "private-response-body";

    await assert.rejects(
      metricsCheck.run({
        assert: assertSmoke,
        fetchText: async () => {
          throw new Error(`metrics returned 503: ${responseSecret}`);
        },
        apiBaseUrl: "https://api.example.test",
        expectedRuntimeCommit,
        metricsRetryOptions: {
          maxAttempts: 2,
          retryDelayMs: 1,
          sleep: async () => {},
        },
        validateMetricsSnapshot: validateAtTestTime,
      }),
      (error) => {
        assert.match(error.message, /metrics endpoint request failed/);
        assert.doesNotMatch(error.message, new RegExp(responseSecret));
        return true;
      },
    );
  });

  test("retries stale and invalid snapshots until the deployed commit is active", async () => {
    const snapshots = [
      createValidMetricsSnapshot(),
      createValidMetricsSnapshot({
        startedAt: "1970-01-01T00:00:00.000Z",
        uptimeSeconds: 0,
        runtimeCommit: expectedRuntimeCommit,
      }),
      createValidMetricsSnapshot({ runtimeCommit: expectedRuntimeCommit }),
    ];
    const delays = [];

    await metricsCheck.run({
      assert: assertSmoke,
      fetchText: async () => JSON.stringify(snapshots.shift()),
      apiBaseUrl: "https://api.example.test",
      expectedRuntimeCommit,
      metricsRetryOptions: {
        maxAttempts: 3,
        retryDelayMs: 7,
        maximumRetryDelayMs: 20,
        sleep: async (delayMs) => delays.push(delayMs),
      },
      validateMetricsSnapshot: validateAtTestTime,
    });

    assert.equal(snapshots.length, 0);
    assert.deepEqual(delays, [7, 14]);
  });

  test("stops after the configured number of propagation attempts", async () => {
    let attempts = 0;
    const delays = [];

    await assert.rejects(
      metricsCheck.run({
        assert: assertSmoke,
        fetchText: async () => {
          attempts += 1;
          return JSON.stringify(createValidMetricsSnapshot());
        },
        apiBaseUrl: "https://api.example.test",
        expectedRuntimeCommit,
        metricsRetryOptions: {
          maxAttempts: 3,
          retryDelayMs: 7,
          maximumRetryDelayMs: 20,
          sleep: async (delayMs) => delays.push(delayMs),
        },
        validateMetricsSnapshot: validateAtTestTime,
      }),
      /runtimeCommit must match expected deployment commit/,
    );

    assert.equal(attempts, 3);
    assert.deepEqual(delays, [7, 14]);
  });

  test("does not delay standalone smoke without an expected commit", async () => {
    let attempts = 0;
    let sleeps = 0;

    await assert.rejects(
      metricsCheck.run({
        assert: assertSmoke,
        fetchText: async () => {
          attempts += 1;
          return JSON.stringify(
            createValidMetricsSnapshot({
              startedAt: "1970-01-01T00:00:00.000Z",
            }),
          );
        },
        apiBaseUrl: "https://api.example.test",
        metricsRetryOptions: {
          maxAttempts: 5,
          retryDelayMs: 1,
          sleep: async () => {
            sleeps += 1;
          },
        },
        validateMetricsSnapshot: validateAtTestTime,
      }),
      /startedAt must be on or after 2020/,
    );

    assert.equal(attempts, 1);
    assert.equal(sleeps, 0);
  });
});
