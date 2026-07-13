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
});
