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
  test("serves a readiness endpoint for deployment checks", async () => {
    const response = await get("/readyz");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ready",
      service: "api-ground-codes",
      apiVersion: "1.0.73",
      runtimeTag: "railway-api-runtime-20260524-russian-v1",
      runtimeCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
  });

  test("serves lightweight operational metrics", async () => {
    await get("/healthz");

    const response = await get("/metrics");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.service).toBe("api-ground-codes");
    expect(body.requests.total).toBeGreaterThan(0);
  });

  test("serves public API documentation without exposing legacy routes", async () => {
    const docsResponse = await createApp().handle(
      new Request("http://localhost/"),
    );
    expect(docsResponse.status).toBe(200);
    const rootDocs = await docsResponse.text();
    expect(rootDocs).toContain("Ground Codes API");
    expect(rootDocs).toContain("Copy-ready Examples");
    expect(rootDocs).toContain("https://api.ground.codes/v1/encode");
    expect(rootDocs).toContain('href="/openapi/"');
    expect(rootDocs).toContain('href="/openapi/json"');

    const firstPartyDocsResponse = await get("/docs");
    expect(firstPartyDocsResponse.status).toBe(200);
    const firstPartyDocs = await firstPartyDocsResponse.text();
    expect(firstPartyDocs).toContain("https://api.ground.codes/v1/encode");
    expect(firstPartyDocs).toContain("https://ground.codes/moon/");
    expect(firstPartyDocs).toContain("curl https://api.ground.codes/metrics");
    expect(firstPartyDocs).toContain("biasLat");
    expect(firstPartyDocs).toContain("Copy-ready Examples");
    expect(firstPartyDocs).toContain("https://api.ground.codes/v1/decode");
    expect(firstPartyDocs).toContain("HTTP Status");
    expect(firstPartyDocs).toContain("Body Constraints");
    expect(firstPartyDocs).toContain("Earth defaults to");
    expect(firstPartyDocs).toContain("Moon supports regionLevel 2");
    expect(firstPartyDocs).toContain("Mars supports regionLevel 2 and 3");
    expect(firstPartyDocs).toContain("<code>german</code>");
    expect(firstPartyDocs).toContain("<code>portuguese</code>");
    expect(firstPartyDocs).toContain("<code>indonesian</code>");
    expect(firstPartyDocs).toContain("<code>thai</code>");
    expect(firstPartyDocs).toContain("<code>vietnamese</code>");
    expect(firstPartyDocs).toContain("<code>hindi</code>");
    expect(firstPartyDocs).toContain("<code>arabic</code>");
    expect(firstPartyDocs).toContain("<code>russian</code>");
    expect(firstPartyDocs).toContain("Share URL Rules");
    expect(firstPartyDocs).toContain("Status Code Reference");

    const referenceResponse = await get("/openapi/");
    expect(referenceResponse.status).toBe(200);
    const referenceDocs = await referenceResponse.text();
    expect(referenceDocs).toContain('data-url="/openapi-json/json"');

    const schemaResponse = await get("/openapi-json/json");
    expect(schemaResponse.status).toBe(200);
    const schema = await schemaResponse.json();
    expect(schema.paths["/v1/encode"]).toBeDefined();
    expect(schema.paths["/v1/search"]).toBeDefined();
    expect(
      schema.paths["/v1/search"].post.requestBody.content["application/json"]
        .schema.properties.biasLat,
    ).toBeDefined();
    expect(schema.paths["/encode"]).toBeUndefined();
    expect(schema.paths["/search"]).toBeUndefined();
    expect(schema.paths["/docs"]).toBeUndefined();
    expect(schema.paths["/{path}"]).toBeUndefined();
  });

  test("redirects legacy swagger documentation URLs to the public docs", async () => {
    const docsResponse = await get("/swagger");
    expect(docsResponse.status).toBe(302);
    expect(docsResponse.headers.get("location")).toBe("/openapi/");

    const referenceResponse = await createApp().handle(
      new Request("http://localhost/reference"),
    );
    expect(referenceResponse.status).toBe(302);
    expect(referenceResponse.headers.get("location")).toBe("/openapi/");

    const schemaResponse = await get("/swagger/json");
    expect(schemaResponse.status).toBe(302);
    expect(schemaResponse.headers.get("location")).toBe("/openapi-json/json");

    const jsonResponse = await get("/json");
    expect(jsonResponse.status).toBe(302);
    expect(jsonResponse.headers.get("location")).toBe("/openapi-json/json");

    const openApiJsonResponse = await get("/openapi/json");
    expect(openApiJsonResponse.status).toBe(302);
    expect(openApiJsonResponse.headers.get("location")).toBe(
      "/openapi-json/json",
    );
  });

  test("returns a structured not found error for unsupported routes", async () => {
    const response = await get("/v1/encode");

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: {
        code: "NOT_FOUND",
      },
    });
  });

  test("serves encode through the versioned v1 route", async () => {
    const response = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toMatch(/^Seoul-/);
  }, 90_000);

  test("search resolves an encoded ground code", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "english",
      regionLevel: 2,
    });
    const code = await encodedResponse.text();

    const response = await postJson("/v1/search", {
      query: code,
      language: "english",
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
    expect(body.results[0].lat).toBeNumber();
    expect(body.results[0].lng).toBeNumber();
  });

  test("search resolves a region name", async () => {
    const response = await postJson("/v1/search", {
      query: "Seoul",
      language: "english",
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
  });

  test("encodes and searches Spanish ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "spanish",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Seul-[A-Z][A-Za-z]+/);

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
      query: "Seul",
      language: "spanish",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Seul",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches French ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "french",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Seoul-[A-Z][A-Za-z]+/);

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
      query: "Seoul",
      language: "french",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Seoul",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches German ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "german",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Seoul-[A-Z][A-Za-z]+/);

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
      query: "Berlin",
      language: "german",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Berlin",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches Portuguese ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 37.566,
      lng: 126.978,
      language: "portuguese",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Seul-[A-Z][A-Za-z]+/);

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
      query: "Lisboa",
      language: "portuguese",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Lisboa",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches Indonesian ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: -6.1751,
      lng: 106.865,
      language: "indonesian",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Jakarta-[A-Z][A-Za-z]+/);

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
      query: "Jakarta",
      language: "indonesian",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Jakarta",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches Thai ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 13.7563,
      lng: 100.5018,
      language: "thai",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^กรุงเทพมหานคร-[\p{Script=Thai}]+/u);

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
      query: "กรุงเทพ",
      language: "thai",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "กรุงเทพมหานคร",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches Vietnamese ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 21.0278,
      lng: 105.8342,
      language: "vietnamese",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^Hà Nội-[\p{Script=Latin}\p{Mark}]+/u);

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
      query: "Hà Nội",
      language: "vietnamese",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "Hà Nội",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches Hindi ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 28.65195,
      lng: 77.23149,
      language: "hindi",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^दिल्ली-[\p{Script=Devanagari}\p{Mark}]+/u);

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
      query: "दिल्ली",
      language: "hindi",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "दिल्ली",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

  test("encodes and searches Arabic ground codes and region labels", async () => {
    const encodedResponse = await postJson("/v1/encode", {
      lat: 30.0444,
      lng: 31.2357,
      language: "arabic",
      regionLevel: 2,
    });
    expect(encodedResponse.status).toBe(200);
    const code = await encodedResponse.text();
    expect(code).toMatch(/^القاهرة-[\p{Script=Arabic}\p{Mark}]+/u);

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
      query: "القاهرة",
      language: "arabic",
      regionLevel: 2,
    });
    expect(regionSearchResponse.status).toBe(200);
    const regionSearch = await regionSearchResponse.json();
    expect(regionSearch.results[0]).toMatchObject({
      type: "region",
      label: "القاهرة",
      body: "earth",
      regionLevel: 2,
    });
  }, 90_000);

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
