import { runRegisteredSmokeChecks } from "./production-smoke-helpers.mjs";

export const fullOperationsSmokeChecks = [
  {
    id: "api.docs",
    label: "API docs root",
    async run({ assert, fetchText, apiBaseUrl }) {
      const text = await fetchText(`${apiBaseUrl}/`);
      assert(
        text.includes("Ground Codes API") && text.includes("/v1/encode"),
        `unexpected API docs root: ${text.slice(0, 120)}`,
      );
    },
  },
  {
    id: "earth.ascii.encode",
    label: "ASCII earth region data",
    async run({ assert, postJson }) {
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
    },
  },
  {
    id: "earth.biased.search",
    label: "Biased region search",
    async run({ assert, postJsonBody }) {
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
    },
  },
  {
    id: "error.invalid-code",
    label: "Undecodable code is a client error",
    async run({ assert, fetchWithRetry, apiBaseUrl }) {
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
    },
  },
  {
    id: "error.missing-region",
    label: "Missing region info is not a server error",
    async run({ assert, fetchWithRetry, apiBaseUrl }) {
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
    },
  },
  {
    id: "error.unsupported-route",
    label: "Unsupported route is not a server error",
    async run({ assert, fetchWithRetry, apiBaseUrl }) {
      const response = await fetchWithRetry(`${apiBaseUrl}/v1/encode`);
      const body = await response.json();
      assert(response.status === 404, `expected 404, got ${response.status}`);
      assert(
        body.error?.code === "NOT_FOUND",
        `unexpected body: ${JSON.stringify(body)}`,
      );
    },
  },
];

export const runFullOperationsSmokeChecks = (context) =>
  runRegisteredSmokeChecks(context, fullOperationsSmokeChecks);
