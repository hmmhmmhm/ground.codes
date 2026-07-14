import { appendFileSync } from "node:fs";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  formatSmokeSummary,
  validateMetricsSnapshot,
} from "./production-smoke-helpers.mjs";
import {
  resolveSmokeProfile,
  runSmokeProfile,
} from "./production-smoke-profiles.mjs";

const smokeProfile = resolveSmokeProfile(
  process.env.GROUND_CODES_SMOKE_PROFILE,
);

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
  fetchWithRetry,
  fetchText,
  postJson,
  postJsonBody,
  apiBaseUrl,
  webBaseUrl,
  expectedRuntimeCommit: process.env.GROUND_CODES_EXPECTED_RUNTIME_COMMIT,
  validateMetricsSnapshot,
};

console.log(`Production smoke profile: ${smokeProfile}`);
await runSmokeProfile(smokeProfile, smokeContext);

if (process.env.GROUND_CODES_SMOKE_FORCE_FAILURE === "true") {
  await smoke.check(
    { id: "smoke.forced-failure", label: "Forced notification test" },
    async () => {
      throw new Error("Forced failure requested by workflow_dispatch input");
    },
  );
}

console.log("Production smoke timings:");
console.log(formatSmokeSummary(smoke.results));

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `Profile: **${smokeProfile}**`,
      "",
      formatGitHubStepSummary(smoke.results),
    ].join("\n"),
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
