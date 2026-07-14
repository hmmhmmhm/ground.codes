import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  MOSHI_WEBHOOK_URL,
  notifySmokeFailure,
  runNotificationCli,
} from "./production-smoke-notify.mjs";

const githubEnvironment = {
  GITHUB_REF_NAME: "main",
  GITHUB_REPOSITORY: "hmmhmmhm/ground.codes",
  GITHUB_RUN_ID: "12345",
  GITHUB_SERVER_URL: "https://github.com",
  GROUND_CODES_SMOKE_REQUEST_DATA: "private coordinates must not leak",
  MOSHI_WEBHOOK_TOKEN: "notification-secret",
};

describe("production smoke failure notifier", () => {
  test("delivers an exact privacy-safe payload", async () => {
    const requests = [];
    const result = await notifySmokeFailure({
      env: githubEnvironment,
      fetchImpl: async (...request) => {
        requests.push(request);
        return { ok: true, status: 200 };
      },
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(requests.length, 1);
    const [[url, options]] = requests;
    assert.equal(url, MOSHI_WEBHOOK_URL);
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, { "Content-Type": "application/json" });
    assert.deepEqual(JSON.parse(options.body), {
      token: "notification-secret",
      title: "ground.codes smoke failed",
      message:
        "Production smoke failed on main. Run: https://github.com/hmmhmmhm/ground.codes/actions/runs/12345",
    });
    assert.doesNotMatch(options.body, /private coordinates/);
  });

  test("returns a safe error when the token is missing", async () => {
    let fetchCalled = false;
    const result = await notifySmokeFailure({
      env: { ...githubEnvironment, MOSHI_WEBHOOK_TOKEN: "" },
      fetchImpl: async () => {
        fetchCalled = true;
        return { ok: true, status: 200 };
      },
    });

    assert.deepEqual(result, {
      ok: false,
      error: "MOSHI_WEBHOOK_TOKEN is not configured",
    });
    assert.equal(fetchCalled, false);
  });

  test("returns a safe error for a non-success HTTP response", async () => {
    const result = await notifySmokeFailure({
      env: githubEnvironment,
      fetchImpl: async () => ({ ok: false, status: 503 }),
    });

    assert.deepEqual(result, {
      ok: false,
      error: "Moshi notification failed with HTTP 503",
    });
    assert.doesNotMatch(result.error, /notification-secret/);
  });

  test("returns a safe error when delivery throws", async () => {
    const result = await notifySmokeFailure({
      env: githubEnvironment,
      fetchImpl: async () => {
        throw new Error("request included notification-secret");
      },
    });

    assert.deepEqual(result, {
      ok: false,
      error: "Moshi notification request failed",
    });
    assert.doesNotMatch(result.error, /notification-secret/);
  });

  test("the CLI reports a safe error and a nonzero exit code", async () => {
    const errors = [];
    const exitCode = await runNotificationCli({
      env: githubEnvironment,
      fetchImpl: async () => {
        throw new Error("request included notification-secret");
      },
      writeError: (message) => errors.push(message),
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(errors, ["Moshi notification request failed"]);
    assert.doesNotMatch(errors.join("\n"), /notification-secret/);
  });
});
