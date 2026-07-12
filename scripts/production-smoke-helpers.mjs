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
        const durationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;
        results.push({ name, ok: true, durationMs });
        logger.log?.(`ok ${name} ${durationMs}ms`);
      } catch (error) {
        const durationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;
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
  { fetchImpl = fetch, retries = 2, retryDelayMs = 500, ...init } = {},
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

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const validateMetricsSnapshot = (metrics) => {
  const errors = [];

  if (metrics?.scope !== "worker-isolate") {
    errors.push('scope must be "worker-isolate"');
  }
  if (!isNonNegativeNumber(metrics?.uptimeSeconds)) {
    errors.push("uptimeSeconds must be a non-negative number");
  }
  if (!isNonNegativeNumber(metrics?.requests?.total)) {
    errors.push("requests.total must be a non-negative number");
  }
  if (!isNonNegativeNumber(metrics?.requests?.avgMs)) {
    errors.push("requests.avgMs must be a non-negative number");
  }
  if (!isRecord(metrics?.requests?.byPath)) {
    errors.push("requests.byPath must be an object");
  }
  if (!isRecord(metrics?.requests?.routes)) {
    errors.push("requests.routes must be an object");
  }

  return errors;
};

export const formatSmokeSummary = (results) =>
  results
    .map(
      ({ name, ok, durationMs }) =>
        `${ok ? "ok" : "not ok"} ${name}: ${durationMs}ms`,
    )
    .join("\n");

export const formatGitHubStepSummary = (results) => {
  const rows = results
    .map(
      ({ name, ok, durationMs }) =>
        `| ${name} | ${ok ? "ok" : "failed"} | ${durationMs}ms |`,
    )
    .join("\n");

  return [
    "## Production Smoke",
    "",
    "| Check | Status | Duration |",
    "| --- | --- | ---: |",
    rows,
    "",
  ].join("\n");
};
