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
  test("serves a readiness endpoint for deployment checks", async () => {
    const response = await get("/readyz");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ready",
      service: "api-ground-codes",
      apiVersion: "1.0.79",
      runtimeTag: "workspace",
      runtimeCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
  });

  test("serves deployment runtime metadata from environment", async () => {
    const previousRuntimeTag = process.env.API_RUNTIME_TAG;
    const previousGitCommitSha = process.env.GIT_COMMIT_SHA;
    process.env.API_RUNTIME_TAG = "workspace";
    process.env.GIT_COMMIT_SHA = "8ec0c2b6703a179c3be99edb57ac3f3f94322598";

    try {
      const response = await get("/readyz");

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        runtimeTag: "workspace",
        runtimeCommit: "8ec0c2b6703a179c3be99edb57ac3f3f94322598",
      });
    } finally {
      if (previousRuntimeTag === undefined) {
        delete process.env.API_RUNTIME_TAG;
      } else {
        process.env.API_RUNTIME_TAG = previousRuntimeTag;
      }
      if (previousGitCommitSha === undefined) {
        delete process.env.GIT_COMMIT_SHA;
      } else {
        process.env.GIT_COMMIT_SHA = previousGitCommitSha;
      }
    }
  });

  test("serves lightweight operational metrics", async () => {
    const firstApp = createApp({ metrics: silentMetrics, rateLimit: null });
    const secondApp = createApp({ metrics: silentMetrics, rateLimit: null });

    await firstApp.handle(new Request("http://localhost/healthz"));
    await new Promise<void>((resolve) => setImmediate(resolve));

    const firstResponse = await firstApp.handle(
      new Request("http://localhost/metrics"),
    );
    const secondResponse = await secondApp.handle(
      new Request("http://localhost/metrics"),
    );

    expect(firstResponse.status).toBe(200);
    const first = await firstResponse.json();
    expect(first.service).toBe("api-ground-codes");
    expect(first.scope).toBe("worker-isolate");
    expect(first.runtimeCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(first.requests.total).toBe(1);

    expect(secondResponse.status).toBe(200);
    const second = await secondResponse.json();
    expect(second.requests.total).toBe(0);
  });

  test("serves public API documentation without exposing legacy routes", async () => {
    const docsResponse = await createApp({ metrics: silentMetrics }).handle(
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
    expect(firstPartyDocs).toContain("Worker-isolate metrics");
    expect(firstPartyDocs).toContain("180 automated-stable language sets");
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
    expect(firstPartyDocs).toContain("<code>swahili</code>");
    expect(firstPartyDocs).toContain("<code>filipino</code>");
    expect(firstPartyDocs).toContain("<code>hausa</code>");
    expect(firstPartyDocs).toContain("<code>bengali</code>");
    expect(firstPartyDocs).toContain("<code>urdu</code>");
    expect(firstPartyDocs).toContain("<code>amharic</code>");
    expect(firstPartyDocs).toContain("<code>burmese</code>");
    expect(firstPartyDocs).toContain("<code>khmer</code>");
    expect(firstPartyDocs).toContain("<code>nepali</code>");
    expect(firstPartyDocs).toContain("<code>somali</code>");
    expect(firstPartyDocs).toContain("<code>pashto</code>");
    expect(firstPartyDocs).toContain("<code>lingala</code>");
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

    const referenceResponse = await createApp({
      metrics: silentMetrics,
    }).handle(new Request("http://localhost/reference"));
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
});
