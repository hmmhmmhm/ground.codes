import Elysia from "elysia";
import { getRegionLoadMetrics } from "./v1/region/load-region.js";

interface PathMetrics {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  byStatus: Record<string, number>;
}

interface RequestMetricsSnapshot {
  startedAt: string;
  total: number;
  totalMs: number;
  byPath: Record<string, number>;
  routes: Record<string, PathMetrics>;
}

const requestMetrics: RequestMetricsSnapshot = {
  startedAt: new Date().toISOString(),
  total: 0,
  totalMs: 0,
  byPath: {},
  routes: {},
};

const requestStartTimes = new WeakMap<Request, number>();

const getStatusCode = (status: unknown): string => {
  if (typeof status === "number") return String(status);
  if (typeof status === "string" && status.length > 0) return status;
  return "200";
};

const recordRequest = (
  request: Request,
  status: unknown,
  durationMs: number,
) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/metrics") return;

  const roundedDurationMs = Math.max(0, Math.round(durationMs * 100) / 100);
  const statusCode = getStatusCode(status);

  requestMetrics.total += 1;
  requestMetrics.totalMs += roundedDurationMs;
  requestMetrics.byPath[pathname] = (requestMetrics.byPath[pathname] ?? 0) + 1;

  const routeMetrics =
    requestMetrics.routes[pathname] ??
    (requestMetrics.routes[pathname] = {
      count: 0,
      totalMs: 0,
      minMs: Number.POSITIVE_INFINITY,
      maxMs: 0,
      byStatus: {},
    });

  routeMetrics.count += 1;
  routeMetrics.totalMs += roundedDurationMs;
  routeMetrics.minMs = Math.min(routeMetrics.minMs, roundedDurationMs);
  routeMetrics.maxMs = Math.max(routeMetrics.maxMs, roundedDurationMs);
  routeMetrics.byStatus[statusCode] =
    (routeMetrics.byStatus[statusCode] ?? 0) + 1;
};

const serializeRoutes = () =>
  Object.fromEntries(
    Object.entries(requestMetrics.routes).map(([path, routeMetrics]) => [
      path,
      {
        count: routeMetrics.count,
        avgMs:
          routeMetrics.count === 0
            ? 0
            : Math.round((routeMetrics.totalMs / routeMetrics.count) * 100) /
              100,
        minMs:
          routeMetrics.minMs === Number.POSITIVE_INFINITY
            ? 0
            : routeMetrics.minMs,
        maxMs: routeMetrics.maxMs,
        byStatus: routeMetrics.byStatus,
      },
    ]),
  );

export const metricsEndpoint = new Elysia()
  .onRequest(({ request }) => {
    requestStartTimes.set(request, performance.now());
  })
  .onAfterHandle({ as: "global" }, ({ request, set }) => {
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    recordRequest(request, set.status, performance.now() - startedAt);
  })
  .onError({ as: "global" }, ({ request, set, code }) => {
    const startedAt = requestStartTimes.get(request) ?? performance.now();
    recordRequest(request, set.status ?? code, performance.now() - startedAt);
  })
  .get("/metrics", ({ set }) => {
    set.headers["cache-control"] = "no-store";

    return {
      service: "api-ground-codes",
      startedAt: requestMetrics.startedAt,
      uptimeSeconds: Math.round(
        (Date.now() - Date.parse(requestMetrics.startedAt)) / 1000,
      ),
      requests: {
        total: requestMetrics.total,
        avgMs:
          requestMetrics.total === 0
            ? 0
            : Math.round((requestMetrics.totalMs / requestMetrics.total) * 100) /
              100,
        byPath: requestMetrics.byPath,
        routes: serializeRoutes(),
      },
      regionLoads: getRegionLoadMetrics(),
    };
  });
