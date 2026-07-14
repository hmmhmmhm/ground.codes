import { runRegisteredSmokeChecks } from "./production-smoke-helpers.mjs";

const createSeoulLanguageCheck = ({
  id,
  label,
  language,
  prefix,
  stateKey,
}) => {
  const definition = { id, label, coverageLanguage: language };
  definition.run = async ({ assert, postJson }, state) => {
    const code = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: definition.coverageLanguage,
      regionLevel: 2,
      body: "earth",
    });
    if (stateKey) state[stateKey] = code;
    assert(
      code.startsWith(`${prefix}-`),
      `expected ${definition.label} code, got ${code}`,
    );
  };
  return definition;
};

const englishEncodeCheck = createSeoulLanguageCheck({
  id: "earth.english.encode",
  label: "Earth Seoul encode",
  language: "english",
  prefix: "Seoul",
  stateKey: "englishCode",
});

const koreanEncodeCheck = createSeoulLanguageCheck({
  id: "earth.korean.encode",
  label: "Korean Seoul encode",
  language: "korean",
  prefix: "서울",
});

export const quickSmokeChecks = [
  {
    id: "api.readiness",
    label: "API readiness",
    async run({ assert, fetchText, apiBaseUrl }) {
      const ready = JSON.parse(await fetchText(`${apiBaseUrl}/readyz`));
      assert(
        ready.status === "ready",
        `unexpected readiness: ${JSON.stringify(ready)}`,
      );
      assert(
        ready.service === "api-ground-codes",
        `unexpected service: ${JSON.stringify(ready)}`,
      );
      assert(
        ready.runtimeTag === "workspace" || ready.runtimeTag === "unknown",
        `missing runtime tag: ${JSON.stringify(ready)}`,
      );
      assert(
        /^[0-9a-f]{40}$/.test(ready.runtimeCommit),
        `missing runtime commit: ${JSON.stringify(ready)}`,
      );
    },
  },
  {
    id: "web.root",
    label: "Web root",
    async run({ assert, fetchText, webBaseUrl }) {
      const html = await fetchText(webBaseUrl);
      assert(html.length > 0, "Web root returned an empty response");
    },
  },
  {
    id: "web.robots",
    label: "Web robots",
    async run({ assert, fetchText, webBaseUrl }) {
      const robots = await fetchText(`${webBaseUrl}/robots.txt`);
      assert(
        robots.includes("Sitemap:"),
        "robots.txt does not include a sitemap",
      );
    },
  },
  {
    id: "web.sitemap",
    label: "Web sitemap",
    async run({ assert, fetchText, webBaseUrl }) {
      const sitemap = await fetchText(`${webBaseUrl}/sitemap.xml`);
      assert(
        sitemap.includes("<loc>https://ground.codes</loc>"),
        "sitemap missing root URL",
      );
    },
  },
  {
    id: "api.metrics",
    label: "API metrics snapshot",
    async run({ assert, fetchText, apiBaseUrl, validateMetricsSnapshot }) {
      const metrics = JSON.parse(await fetchText(`${apiBaseUrl}/metrics`));
      const errors = validateMetricsSnapshot(metrics);
      assert(
        errors.length === 0,
        `invalid metrics snapshot: ${errors.join("; ")}`,
      );
    },
  },
  englishEncodeCheck,
  {
    id: "earth.english.search",
    label: "ASCII region search",
    async run({ assert, postJsonBody }) {
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
    },
  },
  {
    id: "earth.english.decode",
    label: "Earth Seoul decode",
    async run({ assert, postJsonBody }, state) {
      assert(typeof state.englishCode === "string", "encode produced no code");
      const result = await postJsonBody("/v1/decode", {
        code: state.englishCode,
        language: "english",
        regionLevel: 2,
        body: "earth",
      });
      assert(
        Number.isFinite(result.lat) && Number.isFinite(result.lng),
        `unexpected decode result: ${JSON.stringify(result)}`,
      );
    },
  },
  koreanEncodeCheck,
  {
    id: "moon.english.encode",
    label: "Moon encode",
    async run({ assert, postJson }) {
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
    },
  },
  {
    id: "mars.english.encode",
    label: "Mars encode",
    async run({ assert, postJson }) {
      const code = await postJson("/v1/encode", {
        lat: 18.6528,
        lng: -133.8025,
        language: "english",
        regionLevel: 2,
        body: "mars",
      });
      assert(/^Olympus Mons-/.test(code), `expected Mars code, got ${code}`);
    },
  },
];

export const runQuickSmokeChecks = (context) =>
  runRegisteredSmokeChecks(context, quickSmokeChecks);
