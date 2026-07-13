import Elysia from "elysia";
import { getRuntimeMetadata } from "./healthz.js";
import { getRegionLoadMetrics } from "./v1/region/load-region.js";

interface PathMetrics {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  byStatus: Record<string, number>;
}

interface RequestMetricsSnapshot {
  total: number;
  totalMs: number;
  byPath: Record<string, number>;
  routes: Record<string, PathMetrics>;
}

export interface MetricsClock {
  nowMs(): number;
  monotonicMs(): number;
}

export interface RequestCompletionLog {
  event: "api.request.completed";
  service: "api-ground-codes";
  route: string;
  method: string;
  status: string;
  durationMs: number;
  runtimeCommit: string;
}

export interface MetricsOptions {
  clock?: MetricsClock;
  writeLog?: (record: RequestCompletionLog) => void;
}

const systemClock: MetricsClock = {
  nowMs: () => Date.now(),
  monotonicMs: () => performance.now(),
};

const defaultWriteLog = (record: RequestCompletionLog) => {
  console.log(JSON.stringify(record));
};

const getStatusCode = (status: unknown): string => {
  if (typeof status === "number") return String(status);
  if (typeof status === "string" && status.length > 0) return status;
  return "200";
};

const getRouteLabel = (request: Request, matchedRoute: string | undefined) =>
  matchedRoute || (request.method === "OPTIONS" ? "/*" : "<unmatched>");

const getFinalStatus = (response: unknown, setStatus: unknown) =>
  response instanceof Response ? response.status : setStatus;

const recordRequest = (
  requestMetrics: RequestMetricsSnapshot,
  request: Request,
  matchedRoute: string | undefined,
  status: unknown,
  durationMs: number,
  writeLog: (record: RequestCompletionLog) => void,
) => {
  const route = getRouteLabel(request, matchedRoute);
  const roundedDurationMs = Math.max(0, Math.round(durationMs * 100) / 100);
  const statusCode = getStatusCode(status);
  const { runtimeCommit } = getRuntimeMetadata();

  writeLog({
    event: "api.request.completed",
    service: "api-ground-codes",
    route,
    method: request.method,
    status: statusCode,
    durationMs: roundedDurationMs,
    runtimeCommit,
  });

  if (route === "/metrics") return;

  requestMetrics.total += 1;
  requestMetrics.totalMs += roundedDurationMs;
  requestMetrics.byPath[route] = (requestMetrics.byPath[route] ?? 0) + 1;

  const routeMetrics =
    requestMetrics.routes[route] ??
    (requestMetrics.routes[route] = {
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

const serializeRoutes = (requestMetrics: RequestMetricsSnapshot) =>
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

export const createMetricsEndpoint = (options: MetricsOptions = {}) => {
  const clock = options.clock ?? systemClock;
  const writeLog = options.writeLog ?? defaultWriteLog;
  let startedAtMs: number | undefined;
  const requestMetrics: RequestMetricsSnapshot = {
    total: 0,
    totalMs: 0,
    byPath: {},
    routes: {},
  };
  const requestStartTimes = new WeakMap<Request, number>();

  const completeRequest = (
    request: Request,
    matchedRoute: string | undefined,
    status: unknown,
  ) => {
    const startedAt = requestStartTimes.get(request);
    if (startedAt === undefined) return;

    requestStartTimes.delete(request);
    recordRequest(
      requestMetrics,
      request,
      matchedRoute,
      status,
      clock.monotonicMs() - startedAt,
      writeLog,
    );
  };

  return new Elysia()
    .onRequest(({ request }) => {
      startedAtMs ??= clock.nowMs();
      requestStartTimes.set(request, clock.monotonicMs());
    })
    .onAfterResponse({ as: "global" }, ({ request, response, route, set }) => {
      completeRequest(request, route, getFinalStatus(response, set.status));
    })
    .get("/metrics", ({ set }) => {
      set.headers["cache-control"] = "no-store";
      const requestStartedAtMs = startedAtMs ?? clock.nowMs();
      startedAtMs ??= requestStartedAtMs;
      const { runtimeCommit } = getRuntimeMetadata();

      return {
        service: "api-ground-codes",
        scope: "worker-isolate",
        startedAt: new Date(requestStartedAtMs).toISOString(),
        uptimeSeconds: Math.max(
          0,
          Math.round((clock.nowMs() - requestStartedAtMs) / 1000),
        ),
        runtimeCommit,
        requests: {
          total: requestMetrics.total,
          avgMs:
            requestMetrics.total === 0
              ? 0
              : Math.round(
                  (requestMetrics.totalMs / requestMetrics.total) * 100,
                ) / 100,
          byPath: requestMetrics.byPath,
          routes: serializeRoutes(requestMetrics),
        },
        regionLoads: getRegionLoadMetrics(),
      };
    });
};
