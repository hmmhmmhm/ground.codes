import { appendFileSync } from "node:fs";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  formatSmokeSummary,
  validateMetricsSnapshot,
} from "./production-smoke-helpers.mjs";
import { runAdditionalLatinSmokeChecks } from "./production-smoke-additional-latin.mjs";
import { runAdditionalSmokeChecks } from "./production-smoke-additional.mjs";
import { runCoreSmokeChecks } from "./production-smoke-core.mjs";
import { runExpandedSmokeChecks } from "./production-smoke-expanded.mjs";
import { runOperationsSmokeChecks } from "./production-smoke-operations.mjs";

const apiBaseUrl = (
  process.env.GROUND_CODES_API_URL ?? "https://api.ground.codes"
).replace(/\/+$/, "");
const webBaseUrl = (
  process.env.GROUND_CODES_WEB_URL ?? "https://ground.codes"
).replace(/\/+$/, "");

const smoke = createSmokeRecorder();

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchText = async (url, init) => {
  const response = await fetchWithRetry(url, init);
  const text = await response.text();
  assert(response.ok, `${url} returned ${response.status}: ${text}`);
  return text;
};

const postJson = async (path, body) => {
  const response = await fetchWithRetry(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  assert(response.ok, `${path} returned ${response.status}: ${text}`);
  return text;
};

const postJsonBody = async (path, body) =>
  JSON.parse(await postJson(path, body));

const smokeContext = {
  smoke,
  assert,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  validateMetricsSnapshot,
};

await runCoreSmokeChecks(smokeContext);
await runExpandedSmokeChecks(smokeContext);
await runAdditionalSmokeChecks(smokeContext);
await runAdditionalLatinSmokeChecks(smokeContext);
await runOperationsSmokeChecks(smokeContext);

if (process.env.GROUND_CODES_SMOKE_FORCE_FAILURE === "true") {
  await smoke.check("Forced notification test", async () => {
    throw new Error("Forced failure requested by workflow_dispatch input");
  });
}

console.log("Production smoke timings:");
console.log(formatSmokeSummary(smoke.results));

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    formatGitHubStepSummary(smoke.results),
  );
}

if (smoke.failures.length > 0) {
  console.error(
    `Production smoke failed with ${smoke.failures.length} failure(s):`,
  );
  for (const failure of smoke.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production smoke passed.");
