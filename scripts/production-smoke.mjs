import { appendFileSync } from "node:fs";

import {
  createSmokeRecorder,
  fetchWithRetry,
  formatGitHubStepSummary,
  formatSmokeSummary,
  getMissingMetricRoutes,
} from "./production-smoke-helpers.mjs";

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

await smoke.check("API readiness", async () => {
  const text = await fetchText(`${apiBaseUrl}/readyz`);
  const ready = JSON.parse(text);
  assert(
    ready.status === "ready",
    `unexpected readiness: ${JSON.stringify(ready)}`,
  );
  assert(
    typeof ready.runtimeTag === "string" &&
      ready.runtimeTag.startsWith("railway-api-runtime-"),
    `missing runtime tag: ${JSON.stringify(ready)}`,
  );
  assert(
    /^[0-9a-f]{40}$/.test(ready.runtimeCommit),
    `missing runtime commit: ${JSON.stringify(ready)}`,
  );
});

await smoke.check("API docs root", async () => {
  const text = await fetchText(`${apiBaseUrl}/`);
  assert(
    text.includes("Ground Codes API") && text.includes("/v1/encode"),
    `unexpected API docs root: ${text.slice(0, 120)}`,
  );
});

await smoke.check("Earth Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "english",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Seoul-/.test(code), `expected Seoul code, got ${code}`);
});

await smoke.check("Korean Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "korean",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^서울-/.test(code), `expected Korean Seoul code, got ${code}`);
});

await smoke.check("Chinese Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "chinese",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^首尔-/.test(code), `expected Chinese Seoul code, got ${code}`);
});

await smoke.check("Japanese Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "japanese",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^セオウル-/.test(code), `expected Japanese Seoul code, got ${code}`);
});

await smoke.check("Spanish Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "spanish",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Seul-/.test(code), `expected Spanish Seoul code, got ${code}`);
});

await smoke.check("French Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "french",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Seoul-/.test(code), `expected French Seoul code, got ${code}`);
});

await smoke.check("German Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "german",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Seoul-/.test(code), `expected German Seoul code, got ${code}`);
});

await smoke.check("Portuguese Seoul encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 37.566,
    lng: 126.978,
    language: "portuguese",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Seul-/.test(code), `expected Portuguese Seoul code, got ${code}`);
});

await smoke.check("Indonesian Jakarta encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: -6.1751,
    lng: 106.865,
    language: "indonesian",
    regionLevel: 2,
    body: "earth",
  });
  assert(
    /^Jakarta-/.test(code),
    `expected Indonesian Jakarta code, got ${code}`,
  );
});

await smoke.check("Thai Bangkok encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 13.7563,
    lng: 100.5018,
    language: "thai",
    regionLevel: 2,
    body: "earth",
  });
  assert(
    /^กรุงเทพมหานคร-/.test(code),
    `expected Thai Bangkok code, got ${code}`,
  );
});

await smoke.check("Vietnamese Hanoi encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 21.0278,
    lng: 105.8342,
    language: "vietnamese",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^Hà Nội-/.test(code), `expected Vietnamese Hanoi code, got ${code}`);
});

await smoke.check("Hindi Delhi encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 28.65195,
    lng: 77.23149,
    language: "hindi",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^दिल्ली-/.test(code), `expected Hindi Delhi code, got ${code}`);
});

await smoke.check("Arabic Cairo encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 30.0444,
    lng: 31.2357,
    language: "arabic",
    regionLevel: 2,
    body: "earth",
  });
  assert(/^القاهرة-/.test(code), `expected Arabic Cairo code, got ${code}`);
});

await smoke.check("ASCII earth region data", async () => {
  const code = await postJson("/v1/encode", {
    lat: -82,
    lng: -63,
    language: "english",
    regionLevel: 2,
    body: "earth",
  });
  assert(
    code === "Mollereisstrom-Alder",
    `expected Mollereisstrom-Alder, got ${code}`,
  );
});

await smoke.check("ASCII region search", async () => {
  const result = await postJsonBody("/v1/search", {
    query: "Mollereisstrom",
    language: "english",
    regionLevel: 3,
    body: "earth",
    maxResults: 1,
  });
  assert(
    result.results?.[0]?.label === "Mollereisstrom",
    `unexpected search result: ${JSON.stringify(result)}`,
  );
});

await smoke.check("Biased region search", async () => {
  const result = await postJsonBody("/v1/search", {
    query: "Springfield",
    language: "english",
    regionLevel: 2,
    body: "earth",
    maxResults: 1,
    biasLat: 42.1,
    biasLng: -72.6,
  });
  assert(
    result.results?.[0]?.label === "West Springfield",
    `unexpected biased search result: ${JSON.stringify(result)}`,
  );
});

await smoke.check("Moon encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 8.35,
    lng: 30.84,
    language: "english",
    regionLevel: 2,
    body: "moon",
  });
  assert(
    /^Mare Tranquillitatis-/.test(code),
    `expected Moon code, got ${code}`,
  );
});

await smoke.check("Mars encode", async () => {
  const code = await postJson("/v1/encode", {
    lat: 18.6528,
    lng: -133.8025,
    language: "english",
    regionLevel: 2,
    body: "mars",
  });
  assert(/^Olympus Mons-/.test(code), `expected Mars code, got ${code}`);
});

await smoke.check("Undecodable code is a client error", async () => {
  const response = await fetchWithRetry(`${apiBaseUrl}/v1/decode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "Seoul-notrealcode",
      language: "english",
      regionLevel: 2,
    }),
  });
  const body = await response.json();
  assert(response.status === 400, `expected 400, got ${response.status}`);
  assert(
    body.error?.code === "INVALID_INPUT",
    `unexpected body: ${JSON.stringify(body)}`,
  );
});

await smoke.check("Missing region info is not a server error", async () => {
  const response = await fetchWithRetry(`${apiBaseUrl}/v1/region/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "not-a-real-region",
      language: "english",
      regionLevel: 2,
      body: "earth",
    }),
  });
  const body = await response.json();
  assert(response.status === 404, `expected 404, got ${response.status}`);
  assert(
    body.error?.code === "NOT_FOUND",
    `unexpected body: ${JSON.stringify(body)}`,
  );
});

await smoke.check("Unsupported route is not a server error", async () => {
  const response = await fetchWithRetry(`${apiBaseUrl}/v1/encode`);
  const body = await response.json();
  assert(response.status === 404, `expected 404, got ${response.status}`);
  assert(
    body.error?.code === "NOT_FOUND",
    `unexpected body: ${JSON.stringify(body)}`,
  );
});

await smoke.check("API route metrics cover smoke paths", async () => {
  const metrics = JSON.parse(await fetchText(`${apiBaseUrl}/metrics`));
  const missingRoutes = getMissingMetricRoutes(metrics, [
    "/readyz",
    "/v1/encode",
    "/v1/search",
  ]);
  assert(
    missingRoutes.length === 0,
    `metrics missing route samples: ${missingRoutes.join(", ")}`,
  );
});

await smoke.check("Web robots", async () => {
  const robots = await fetchText(`${webBaseUrl}/robots.txt`);
  assert(robots.includes("Sitemap:"), "robots.txt does not include a sitemap");
});

await smoke.check("Web sitemap", async () => {
  const sitemap = await fetchText(`${webBaseUrl}/sitemap.xml`);
  assert(
    sitemap.includes("<loc>https://ground.codes</loc>"),
    "sitemap missing root URL",
  );
});

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
