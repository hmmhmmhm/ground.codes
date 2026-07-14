import { describe, expect, test } from "bun:test";
import { createApp } from "./app.js";
import type { RequestCompletionLog } from "./endpoints/metrics.js";

const assertFiniteNumbers = (value: unknown): void => {
  if (typeof value === "number") {
    expect(Number.isFinite(value)).toBe(true);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(assertFiniteNumbers);
    return;
  }

  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(assertFiniteNumbers);
  }
};

describe("operational metrics clock", () => {
  test("starts on the first request and keeps finite request counters", async () => {
    let wallMs = 0;
    let monotonicMs = 0;
    const app = createApp({
      rateLimit: null,
      metrics: {
        clock: {
          nowMs: () => wallMs,
          monotonicMs: () => monotonicMs,
        },
        writeLog: () => undefined,
      },
    });

    const firstRequestAtMs = Date.parse("2026-07-13T00:00:00.000Z");
    wallMs = firstRequestAtMs;
    monotonicMs = 1_000;
    await app.handle(new Request("http://localhost/healthz"));

    wallMs = firstRequestAtMs + 600;
    const firstResponse = await app.handle(
      new Request("http://localhost/metrics"),
    );
    const first = await firstResponse.json();

    expect(first.startedAt).toBe("2026-07-13T00:00:00.000Z");
    expect(first.uptimeSeconds).toBe(1);
    expect(first.requests.total).toBe(1);
    expect(first.requests.byPath).toEqual({ "/healthz": 1 });
    expect(first.runtimeCommit).toMatch(/^[0-9a-f]{40}$/);
    assertFiniteNumbers(first.requests);

    wallMs = firstRequestAtMs + 5_400;
    monotonicMs += 5_400;
    await app.handle(new Request("http://localhost/readyz"));

    const secondResponse = await app.handle(
      new Request("http://localhost/metrics"),
    );
    const second = await secondResponse.json();

    expect(second.startedAt).toBe(first.startedAt);
    expect(second.uptimeSeconds).toBe(5);
    expect(second.requests.total).toBe(2);
    expect(second.requests.byPath).toEqual({
      "/healthz": 1,
      "/readyz": 1,
    });
    assertFiniteNumbers(second.requests);
  });
});

describe("request completion logs", () => {
  test("completes requests through both server and Worker entrypoints", async () => {
    const records: RequestCompletionLog[] = [];
    const app = createApp({
      rateLimit: null,
      metrics: { writeLog: (record) => records.push(record) },
    });

    await app.fetch(new Request("http://localhost/healthz"));
    await app.handle(new Request("http://localhost/readyz"));

    expect(records.map(({ route }) => route)).toEqual(["/healthz", "/readyz"]);
  });

  test("writes the structured record before the Worker response resolves", async () => {
    const originalConsoleLog = console.log;
    const consoleCalls: unknown[][] = [];
    console.log = (...args: unknown[]) => {
      consoleCalls.push(args);
    };

    try {
      const app = createApp({ rateLimit: null });
      const response = await app.handle(
        new Request("http://localhost/healthz"),
      );

      expect(response.status).toBe(200);
      expect(consoleCalls).toHaveLength(1);
      expect(consoleCalls[0]).toEqual([
        {
          event: "api.request.completed",
          service: "api-ground-codes",
          route: "/healthz",
          method: "GET",
          status: "200",
          durationMs: expect.any(Number),
          runtimeCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
        },
      ]);
      expect(typeof consoleCalls[0][0]).toBe("object");
    } finally {
      console.log = originalConsoleLog;
    }
  });

  test("emits one privacy-safe record for each encode and search error", async () => {
    const encodedLogs: string[] = [];
    let monotonicMs = 10_000;
    const app = createApp({
      rateLimit: null,
      metrics: {
        clock: {
          nowMs: () => Date.parse("2026-07-13T00:00:00.000Z"),
          monotonicMs: () => monotonicMs,
        },
        writeLog: (record: RequestCompletionLog) => {
          encodedLogs.push(JSON.stringify(record));
        },
      },
    });

    const sentinels = [
      "91.1234567",
      "-181.7654321",
      "encode-query-private-code",
      "198.51.100.73",
      "Bearer encode-private-authorization",
      "search-private-query-code",
      "42.7654321",
      "203.0.113.91",
      "Bearer search-private-authorization",
    ];

    monotonicMs = 10_125.25;
    const encodeResponse = await app.handle(
      new Request("http://localhost/v1/encode?code=encode-query-private-code", {
        method: "POST",
        headers: {
          authorization: "Bearer encode-private-authorization",
          "content-type": "application/json",
          "x-forwarded-for": "198.51.100.73",
        },
        body: JSON.stringify({ lat: 91.1234567, lng: -181.7654321 }),
      }),
    );

    monotonicMs = 10_250.75;
    const searchResponse = await app.handle(
      new Request("http://localhost/v1/search", {
        method: "POST",
        headers: {
          authorization: "Bearer search-private-authorization",
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.91",
        },
        body: JSON.stringify({
          query: "search-private-query-code",
          biasLat: 42.7654321,
        }),
      }),
    );
    expect(encodeResponse.status).toBe(400);
    expect(searchResponse.status).toBe(400);
    expect(encodedLogs).toHaveLength(2);

    const records = encodedLogs.map(
      (encodedLog) => JSON.parse(encodedLog) as RequestCompletionLog,
    );
    expect(records).toEqual([
      {
        event: "api.request.completed",
        service: "api-ground-codes",
        route: "/v1/encode",
        method: "POST",
        status: "400",
        durationMs: expect.any(Number),
        runtimeCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      },
      {
        event: "api.request.completed",
        service: "api-ground-codes",
        route: "/v1/search",
        method: "POST",
        status: "400",
        durationMs: expect.any(Number),
        runtimeCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      },
    ]);
    records.forEach((record) => {
      expect(Object.keys(record).sort()).toEqual(
        [
          "durationMs",
          "event",
          "method",
          "route",
          "runtimeCommit",
          "service",
          "status",
        ].sort(),
      );
      expect(Number.isFinite(record.durationMs)).toBe(true);
      expect(record.durationMs).toBeGreaterThanOrEqual(0);
    });

    const serializedLogs = encodedLogs.join("\n");
    sentinels.forEach((sentinel) => {
      expect(serializedLogs).not.toContain(sentinel);
    });
  });

  test("uses the route template for the legacy dynamic ground-code path", async () => {
    const encodedLogs: string[] = [];
    const app = createApp({
      rateLimit: null,
      metrics: {
        writeLog: (record: RequestCompletionLog) => {
          encodedLogs.push(JSON.stringify(record));
        },
      },
    });
    const pathSentinel = "legacyPrivatePathSentinel";

    const response = await app.handle(
      new Request(`http://localhost/${pathSentinel}`),
    );
    expect(encodedLogs).toHaveLength(1);
    expect(encodedLogs[0]).not.toContain(pathSentinel);
    expect(JSON.parse(encodedLogs[0])).toEqual({
      event: "api.request.completed",
      service: "api-ground-codes",
      route: "/:path",
      method: "GET",
      status: String(response.status),
      durationMs: expect.any(Number),
      runtimeCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
  });

  test("records CORS preflight responses that short-circuit the app", async () => {
    const records: RequestCompletionLog[] = [];
    const app = createApp({
      rateLimit: null,
      corsOrigins: ["https://allowed.example"],
      metrics: {
        writeLog: (record) => records.push(record),
      },
    });

    const response = await app.handle(
      new Request("http://localhost/v1/encode", {
        method: "OPTIONS",
        headers: {
          origin: "https://allowed.example",
          "access-control-request-method": "POST",
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://allowed.example",
    );
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      route: "/*",
      method: "OPTIONS",
      status: "204",
    });

    const metricsResponse = await app.handle(
      new Request("http://localhost/metrics"),
    );
    const metrics = await metricsResponse.json();
    expect(metrics.requests.total).toBe(1);
    expect(metrics.requests.byPath).toEqual({ "/*": 1 });
    expect(metrics.requests.routes["/*"].byStatus).toEqual({ "204": 1 });
  });

  test("records rate-limit responses that short-circuit the route", async () => {
    const records: RequestCompletionLog[] = [];
    const app = createApp({
      rateLimit: { max: 1, windowMs: 60_000 },
      metrics: {
        writeLog: (record) => records.push(record),
      },
    });
    const request = () =>
      new Request("http://localhost/readyz", {
        headers: { "x-forwarded-for": "192.0.2.99" },
      });

    const firstResponse = await app.handle(request());
    const limitedResponse = await app.handle(request());
    expect(firstResponse.status).toBe(200);
    expect(limitedResponse.status).toBe(429);
    expect(records).toHaveLength(2);
    expect(records.map(({ route, status }) => ({ route, status }))).toEqual([
      { route: "/readyz", status: "200" },
      { route: "/readyz", status: "429" },
    ]);

    const metricsResponse = await app.handle(
      new Request("http://localhost/metrics", {
        headers: { "x-forwarded-for": "192.0.2.100" },
      }),
    );
    const metrics = await metricsResponse.json();
    expect(metrics.requests.total).toBe(2);
    expect(metrics.requests.routes["/readyz"].byStatus).toEqual({
      "200": 1,
      "429": 1,
    });
  });

  test("records the final response status for redirects", async () => {
    const records: RequestCompletionLog[] = [];
    const app = createApp({
      rateLimit: null,
      metrics: {
        writeLog: (record) => records.push(record),
      },
    });

    const response = await app.handle(
      new Request("http://localhost/openapi/json"),
    );
    expect(response.status).toBe(302);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      route: "/openapi/json",
      method: "GET",
      status: "302",
    });

    const metricsResponse = await app.handle(
      new Request("http://localhost/metrics"),
    );
    const metrics = await metricsResponse.json();
    expect(metrics.requests.total).toBe(1);
    expect(metrics.requests.routes["/openapi/json"].byStatus).toEqual({
      "302": 1,
    });
  });
});
