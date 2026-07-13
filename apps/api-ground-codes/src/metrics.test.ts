import { describe, expect, test } from "bun:test";
import { createApp } from "./app.js";

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
