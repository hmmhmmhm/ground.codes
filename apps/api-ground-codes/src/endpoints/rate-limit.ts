import Elysia from "elysia";

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const getClientKey = (request: Request) =>
  request.headers.get("cf-connecting-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "local";

export const getDefaultRateLimit = (): RateLimitOptions | null => {
  const rawLimit = process.env.API_RATE_LIMIT_PER_MINUTE;
  const max = rawLimit === undefined ? 600 : Number(rawLimit);

  if (!Number.isFinite(max) || max <= 0) return null;
  return {
    max,
    windowMs: 60_000,
  };
};

export const createRateLimitEndpoint = (
  options: RateLimitOptions | null = getDefaultRateLimit(),
) => {
  const buckets = new Map<string, Bucket>();

  return new Elysia().onBeforeHandle({ as: "global" }, ({ request, set }) => {
    if (!options || request.method === "OPTIONS") return;

    const pathname = new URL(request.url).pathname;
    if (pathname === "/healthz") return;

    const now = Date.now();
    const key = getClientKey(request);
    const current = buckets.get(key);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + options.windowMs }
        : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000),
    );
    set.headers["X-RateLimit-Limit"] = String(options.max);
    set.headers["X-RateLimit-Remaining"] = String(
      Math.max(0, options.max - bucket.count),
    );
    set.headers["X-RateLimit-Reset"] = String(bucket.resetAt);

    if (bucket.count > options.max) {
      set.status = 429;
      set.headers["Retry-After"] = String(retryAfterSeconds);
      return {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again later.",
        },
      };
    }
  });
};
