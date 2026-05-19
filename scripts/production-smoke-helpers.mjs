export const createSmokeRecorder = ({ logger = console } = {}) => {
  const failures = [];
  const results = [];

  return {
    failures,
    results,
    async check(name, run) {
      const startedAt = performance.now();
      try {
        await run();
        const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
        results.push({ name, ok: true, durationMs });
        logger.log?.(`ok ${name} ${durationMs}ms`);
      } catch (error) {
        const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${name}: ${message}`);
        results.push({ name, ok: false, durationMs });
        logger.error?.(`not ok ${name} ${durationMs}ms`);
        logger.error?.(error);
      }
    },
  };
};

const sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

export const fetchWithRetry = async (
  url,
  {
    fetchImpl = fetch,
    retries = 2,
    retryDelayMs = 500,
    ...init
  } = {},
) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchImpl(url, init);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
};

export const getMissingMetricRoutes = (metrics, requiredRoutes) => {
  const routes = metrics?.requests?.routes ?? {};
  return requiredRoutes.filter((route) => {
    const count = routes[route]?.count;
    return typeof count !== "number" || count < 1;
  });
};

export const formatSmokeSummary = (results) =>
  results
    .map(
      ({ name, ok, durationMs }) =>
        `${ok ? "ok" : "not ok"} ${name}: ${durationMs}ms`,
    )
    .join("\n");
