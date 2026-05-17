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
    const firstPartyDocsResponse = await get("/docs");
    expect(firstPartyDocsResponse.status).toBe(200);
    expect(await firstPartyDocsResponse.text()).toContain(
      "https://api.ground.codes/v1/encode",
    );

    const docsResponse = await get("/");
    expect(docsResponse.status).toBe(200);
    expect(await docsResponse.text()).toContain(
      "Ground Codes API Documentation",
    );

    const schemaResponse = await get("/json");
    expect(schemaResponse.status).toBe(200);
    const schema = await schemaResponse.json();
    expect(schema.paths["/v1/encode"]).toBeDefined();
    expect(schema.paths["/v1/search"]).toBeDefined();
    expect(schema.paths["/encode"]).toBeUndefined();
    expect(schema.paths["/search"]).toBeUndefined();
    expect(schema.paths["/docs"]).toBeUndefined();
    expect(schema.paths["/{path}"]).toBeUndefined();
  });

  test("redirects legacy swagger documentation URLs to the public docs", async () => {
    const docsResponse = await get("/swagger");
    expect(docsResponse.status).toBe(302);
    expect(docsResponse.headers.get("location")).toBe("/");

    const schemaResponse = await get("/swagger/json");
    expect(schemaResponse.status).toBe(302);
    expect(schemaResponse.headers.get("location")).toBe("/json");
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

  test(
    "serves encode through the versioned v1 route",
    async () => {
      const response = await postJson("/v1/encode", {
        lat: 37.566,
        lng: 126.978,
        language: "english",
        regionLevel: 2,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toMatch(/^Seoul-/);
    },
    90_000,
  );

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

  test(
    "search falls back to English region names from a localized request",
    async () => {
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
    },
    90_000,
  );

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
