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
