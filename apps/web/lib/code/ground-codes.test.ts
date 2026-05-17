import { afterEach, describe, expect, test } from "bun:test";
import { encode, searchGroundCodes } from "./ground-codes";

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_GROUND_CODES_API_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) {
    delete process.env.NEXT_PUBLIC_GROUND_CODES_API_URL;
  } else {
    process.env.NEXT_PUBLIC_GROUND_CODES_API_URL = originalApiUrl;
  }
});

describe("ground-codes API client", () => {
  test("encodes through the versioned API and configurable base URL", async () => {
    process.env.NEXT_PUBLIC_GROUND_CODES_API_URL = "https://api.example.test/";
    const requests: Array<{ url: string; body: unknown }> = [];
    globalThis.fetch = (async (url, init) => {
      requests.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
      });
      return new Response("Seoul-Example-Code", { status: 200 });
    }) as typeof fetch;

    const code = await encode({
      lat: 37.566,
      lng: 126.978,
      language: "english",
      body: "earth",
    });

    expect(code).toBe("Seoul-Example-Code");
    expect(requests[0]).toEqual({
      url: "https://api.example.test/v1/encode",
      body: {
        lat: 37.566,
        lng: 126.978,
        regionLevel: 2,
        language: "english",
        precisionMeters: 3,
        body: "earth",
      },
    });
  });

  test("searches ground codes and region names through the versioned API", async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    globalThis.fetch = (async (url, init) => {
      requests.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
      });
      return Response.json({
        query: "Seoul-Happy-Tiger",
        results: [
          {
            type: "ground-code",
            label: "Seoul-Happy-Tiger",
            lat: 37.566,
            lng: 126.978,
            body: "earth",
            regionLevel: 2,
          },
        ],
      });
    }) as typeof fetch;

    const result = await searchGroundCodes({
      query: "Seoul-Happy-Tiger",
      language: "english",
      body: "earth",
      maxResults: 5,
    });

    expect(result.results[0]?.type).toBe("ground-code");
    expect(requests[0]).toEqual({
      url: "https://api.ground.codes/v1/search",
      body: {
        query: "Seoul-Happy-Tiger",
        regionLevel: 2,
        language: "english",
        body: "earth",
        maxResults: 5,
      },
    });
  });
});
