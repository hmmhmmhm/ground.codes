import { describe, expect, test } from "bun:test";
import { createApp } from "./app.js";

const silentMetrics = { writeLog: () => undefined };
const app = createApp({ metrics: silentMetrics });
const rateLimitedApp = createApp({
  metrics: silentMetrics,
  rateLimit: {
    max: 1,
    windowMs: 60_000,
  },
});

const postJson = (path: string, body: unknown) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const get = (path: string) =>
  app.handle(new Request(`http://localhost${path}`));

describe("Ground Codes API contract", () => {
  test("encodes and searches Russian ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 55.7558,
      lng: 37.6173,
      language: "russian",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Москва-[\p{Script=Cyrillic}\p{Mark}]+/u);

    const codeSearchResponse = await postJson("/v1/search", {
      query: code,
      language: "english",
      regionLevel: 2,
    });
    expect(codeSearchResponse.status).toBe(200);
    const codeSearch = await codeSearchResponse.json();
    expect(codeSearch.results[0]).toMatchObject({
      type: "ground-code",
      label: code,
      body: "earth",
      regionLevel: 2,
    });

    const regionSearchResponse = await postJson("/v1/search", {
      query: "Москва",
      language: "russian",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Москва",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test.each([
    {
      name: "Swahili",
      language: "swahili",
      lat: -6.1751,
      lng: 106.865,
      region: "Jakarta",
      codePattern: /^Jakarta-[A-Z][A-Za-z]+/u,
    },
    {
      name: "Filipino",
      language: "filipino",
      lat: -6.1751,
      lng: 106.865,
      region: "Jakarta",
      codePattern: /^Jakarta-[A-Z][A-Za-z]+/u,
    },
    {
      name: "Hausa",
      language: "hausa",
      lat: 30.0444,
      lng: 31.2357,
      region: "Alkahira",
      codePattern: /^Alkahira-[A-Z][A-Za-z]+/u,
    },
    {
      name: "Bengali",
      language: "bengali",
      lat: 28.65195,
      lng: 77.23149,
      region: "দিল্লি",
      codePattern: /^দিল্লি-[\p{Script=Bengali}\p{Mark}]+/u,
    },
    {
      name: "Urdu",
      language: "urdu",
      lat: 28.65195,
      lng: 77.23149,
      region: "دہلی",
      codePattern: /^دہلی-[\p{Script=Arabic}\p{Mark}]+/u,
    },
    {
      name: "Amharic",
      language: "amharic",
      lat: 30.0444,
      lng: 31.2357,
      region: "ካይሮ",
      codePattern: /^ካይሮ-[\p{Script=Ethiopic}\p{Mark}]+/u,
    },
    {
      name: "Burmese",
      language: "burmese",
      lat: -6.1751,
      lng: 106.865,
      region: "ဂျာကာတာ",
      codePattern: /^ဂျာကာတာ-[\p{Script=Myanmar}\p{Mark}]+/u,
    },
    {
      name: "Khmer",
      language: "khmer",
      lat: -6.1751,
      lng: 106.865,
      region: "ចាការតា",
      codePattern: /^ចាការតា-[\p{Script=Khmer}\p{Mark}]+/u,
    },
    {
      name: "Nepali",
      language: "nepali",
      lat: 28.65195,
      lng: 77.23149,
      region: "दिल्ली",
      codePattern: /^दिल्ली-[\p{Script=Devanagari}\p{Mark}]+/u,
    },
    {
      name: "Somali",
      language: "somali",
      lat: 30.0444,
      lng: 31.2357,
      region: "Qaahira",
      codePattern: /^Qaahira-[A-Z][A-Za-z]+/u,
    },
    {
      name: "Pashto",
      language: "pashto",
      lat: 28.65195,
      lng: 77.23149,
      region: "ډیلي",
      codePattern: /^ډیلي-[\p{Script=Arabic}\p{Mark}]+/u,
    },
    {
      name: "Lingala",
      language: "lingala",
      lat: -6.1751,
      lng: 106.865,
      region: "Jakarta",
      codePattern: /^Jakarta-[A-Z][A-Za-z]+/u,
    },
  ])(
    "encodes and searches $name address-gap ground codes and region labels",
    async ({ language, lat, lng, region, codePattern }) => {
      const encodedResponse = await postJson("/v1/encode", {
        lat,
        lng,
        language,
        regionLevel: 2,
      });
      expect(encodedResponse.status).toBe(200);
      const code = await encodedResponse.text();
      expect(code).toMatch(codePattern);

      const codeSearchResponse = await postJson("/v1/search", {
        query: code,
        language: "english",
        regionLevel: 2,
      });
      expect(codeSearchResponse.status).toBe(200);
      const codeSearch = await codeSearchResponse.json();
      expect(codeSearch.results[0]).toMatchObject({
        type: "ground-code",
        label: code,
        body: "earth",
        regionLevel: 2,
      });

      const regionSearchResponse = await postJson("/v1/search", {
        query: region,
        language,
        regionLevel: 2,
      });
      expect(regionSearchResponse.status).toBe(200);
      const regionSearch = await regionSearchResponse.json();
      expect(regionSearch.results[0]).toMatchObject({
        type: "region",
        label: region,
        body: "earth",
        regionLevel: 2,
      });
    },
    90_000,
  );

  test("search returns multiple partial region matches with cache headers", async () => {
    const response = await postJson("/v1/search", {
      query: "Seo",
      language: "english",
      regionLevel: 2,
      maxResults: 3,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage");
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(1);
    expect(body.results.length).toBeLessThanOrEqual(3);
    expect(body.results.some((result: any) => result.label === "Seoul")).toBe(
      true,
    );
  });

  test("search ranks ambiguous region names by the supplied map-center bias", async () => {
    const response = await postJson("/v1/search", {
      query: "Springfield",
      language: "english",
      regionLevel: 2,
      maxResults: 1,
      biasLat: 42.1,
      biasLng: -72.6,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results[0]).toMatchObject({
      type: "region",
      label: "West Springfield",
      body: "earth",
      regionLevel: 2,
    });
  });

  test("search resolves common city aliases", async () => {
    const response = await postJson("/v1/search", {
      query: "nyc",
      language: "english",
      regionLevel: 2,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results[0]).toMatchObject({
      type: "region",
      label: "New York City",
    });
  });

  test("search falls back to English region names from a localized request", async () => {
    const response = await postJson("/v1/search", {
      query: "Seoul",
      language: "korean",
      regionLevel: 2,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results[0]).toMatchObject({
      type: "region",
      label: "Seoul",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("search detects an English encoded code from a localized request", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
    });
    const code = await encodedResponse.text();

    const response = await postJson("/v1/search", {
      query: code,
      language: "korean",
      regionLevel: 2,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results[0]).toMatchObject({
      type: "ground-code",
      label: code,
      body: "earth",
      regionLevel: 2,
    });
  });

  test("search resolves longer localized Moon and Mars ground codes", async () => {
    for (const sample of [
      {
        query: "고요의 바다-안방-구두솔가방",
        body: "moon",
      },
      {
        query: "보하르 크레이터 2-달력장-메밀-카스테라",
        body: "mars",
      },
    ]) {
      const response = await postJson("/v1/search", {
        query: sample.query,
        language: "korean",
        body: sample.body,
        regionLevel: 2,
        maxResults: 1,
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.results[0]).toMatchObject({
        type: "ground-code",
        label: sample.query,
        body: sample.body,
        regionLevel: 2,
      });
      expect(body.results[0].lat).toBeNumber();
      expect(body.results[0].lng).toBeNumber();
    }
  }, 90_000);

  test("loads region lookup data on demand for region endpoints", async () => {
    const response = await postJson("/v1/region/around", {
      lat: 37.566,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0]).toMatchObject({
      name: "Seoul",
    });
  });

  test("loads Spanish region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 37.566,
      lng: 126.978,
      language: "spanish",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "Seul",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "Seul",
      language: "spanish",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "Seul",
    });
  });

  test("loads French region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 37.566,
      lng: 126.978,
      language: "french",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "Seoul",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "Seoul",
      language: "french",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "Seoul",
    });
  });
});
