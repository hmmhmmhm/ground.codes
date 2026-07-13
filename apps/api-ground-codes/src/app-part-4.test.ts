import { describe, expect, test } from "bun:test";
import { createApp } from "./app.js";

const app = createApp();
const rateLimitedApp = createApp({
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
  test("loads Portuguese region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 37.566,
      lng: 126.978,
      language: "portuguese",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "Seul",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "Lisboa",
      language: "portuguese",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "Lisboa",
    });
  });

  test("loads Indonesian region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: -6.1751,
      lng: 106.865,
      language: "indonesian",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "Jakarta",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "Jakarta",
      language: "indonesian",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "Jakarta",
    });
  });

  test("loads Thai region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 13.7563,
      lng: 100.5018,
      language: "thai",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "กรุงเทพมหานคร",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "กรุงเทพมหานคร",
      language: "thai",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "กรุงเทพมหานคร",
    });
  });

  test("loads Vietnamese region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 21.0278,
      lng: 105.8342,
      language: "vietnamese",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "Hà Nội",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "Hà Nội",
      language: "vietnamese",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "Hà Nội",
    });
  });

  test("loads Hindi region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 28.65195,
      lng: 77.23149,
      language: "hindi",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "दिल्ली",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "दिल्ली",
      language: "hindi",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "दिल्ली",
    });
  });

  test("loads Arabic region lookup data on demand for region endpoints", async () => {
    const aroundResponse = await postJson("/v1/region/around", {
      lat: 30.0444,
      lng: 31.2357,
      language: "arabic",
      regionLevel: 2,
      maxResults: 1,
    });

    expect(aroundResponse.status).toBe(200);
    const around = await aroundResponse.json();
    expect(around[0]).toMatchObject({
      name: "القاهرة",
    });

    const infoResponse = await postJson("/v1/region/info", {
      name: "القاهرة",
      language: "arabic",
      regionLevel: 2,
      body: "earth",
    });
    expect(infoResponse.status).toBe(200);
    expect(await infoResponse.json()).toMatchObject({
      name: "القاهرة",
    });
  });

  test.each([
    {
      name: "Burmese",
      language: "burmese",
      lat: -6.1751,
      lng: 106.865,
      region: "ဂျာကာတာ",
    },
    {
      name: "Khmer",
      language: "khmer",
      lat: -6.1751,
      lng: 106.865,
      region: "ចាការតា",
    },
    {
      name: "Nepali",
      language: "nepali",
      lat: 28.65195,
      lng: 77.23149,
      region: "दिल्ली",
    },
    {
      name: "Somali",
      language: "somali",
      lat: 30.0444,
      lng: 31.2357,
      region: "Qaahira",
    },
    {
      name: "Pashto",
      language: "pashto",
      lat: 28.65195,
      lng: 77.23149,
      region: "ډیلي",
    },
    {
      name: "Lingala",
      language: "lingala",
      lat: -6.1751,
      lng: 106.865,
      region: "Jakarta",
    },
  ])(
    "loads $name region lookup data on demand for region endpoints",
    async ({ language, lat, lng, region }) => {
      const aroundResponse = await postJson("/v1/region/around", {
        lat,
        lng,
        language,
        regionLevel: 2,
        maxResults: 1,
      });

      expect(aroundResponse.status).toBe(200);
      const around = await aroundResponse.json();
      expect(around[0]).toMatchObject({
        name: region,
      });

      const infoResponse = await postJson("/v1/region/info", {
        name: region,
        language,
        regionLevel: 2,
        body: "earth",
      });
      expect(infoResponse.status).toBe(200);
      expect(await infoResponse.json()).toMatchObject({
        name: region,
      });
    },
  );

  test("returns a structured not found error for missing region info", async () => {
    const response = await postJson("/v1/region/info", {
      name: "not-a-real-region",
      language: "english",
      regionLevel: 2,
      body: "earth",
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: {
        code: "NOT_FOUND",
      },
    });
  });

  test("returns a structured client error for invalid coordinates", async () => {
    const response = await postJson("/v1/encode", {
      lat: 120,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "INVALID_INPUT",
      },
    });
  });

  test("returns a structured client error for incomplete search bias", async () => {
    const response = await postJson("/v1/search", {
      query: "Springfield",
      language: "english",
      regionLevel: 2,
      biasLat: 42.1,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "INVALID_INPUT",
      },
    });
  });

  test("returns a structured client error for undecodable codes", async () => {
    const response = await postJson("/v1/decode", {
      code: "Seoul-notrealcode",
      language: "english",
      regionLevel: 2,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "INVALID_INPUT",
      },
    });
  });

  test("returns a structured rate-limit error when the limit is exceeded", async () => {
    const requestBody = {
      lat: 120,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
    };
    await rateLimitedApp.handle(
      new Request("http://localhost/v1/encode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      }),
    );

    const response = await rateLimitedApp.handle(
      new Request("http://localhost/v1/encode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      error: {
        code: "RATE_LIMITED",
      },
    });
  });
});
