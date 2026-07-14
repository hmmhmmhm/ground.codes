export const createSmokeRecorder = ({ logger = console } = {}) => {
  const failures = [];
  const results = [];

  return {
    failures,
    results,
    async check(definition, run) {
      const id = typeof definition === "string" ? undefined : definition.id;
      const name =
        typeof definition === "string" ? definition : definition.label;
      const startedAt = performance.now();
      try {
        await run();
        const durationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;
        results.push({ id, name, ok: true, durationMs });
        logger.log?.(`ok ${name} ${durationMs}ms`);
      } catch (error) {
        const durationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${name}: ${message}`);
        results.push({ id, name, ok: false, durationMs });
        logger.error?.(`not ok ${name} ${durationMs}ms`);
        logger.error?.(error);
      }
    },
  };
};

export const assertSmokeCheckDefinitions = (definitions) => {
  const ids = new Set();
  const coverageLanguages = new Set();

  for (const definition of definitions) {
    if (
      typeof definition.id !== "string" ||
      typeof definition.label !== "string" ||
      typeof definition.run !== "function"
    ) {
      throw new Error("Every smoke check must define an id, label, and run");
    }
    if (ids.has(definition.id)) {
      throw new Error(`Duplicate smoke check ID: ${definition.id}`);
    }
    ids.add(definition.id);

    if (definition.coverageLanguage) {
      if (coverageLanguages.has(definition.coverageLanguage)) {
        throw new Error(
          `Duplicate smoke coverage language: ${definition.coverageLanguage}`,
        );
      }
      coverageLanguages.add(definition.coverageLanguage);
    }
  }
};

export const runRegisteredSmokeChecks = async (context, definitions) => {
  assertSmokeCheckDefinitions(definitions);
  const state = {};
  for (const definition of definitions) {
    await context.smoke.check(definition, () => definition.run(context, state));
  }
};

export const createLanguageSmokeCheck = ({
  language,
  label,
  lat,
  lng,
  prefix,
}) => {
  const definition = {
    id: `earth.${language.replaceAll("_", "-")}.encode`,
    label,
    coverageLanguage: language,
  };

  definition.run = async ({ assert, postJson }) => {
    const code = await postJson("/v1/encode", {
      lat,
      lng,
      language: definition.coverageLanguage,
      regionLevel: 2,
      body: "earth",
    });
    assert(
      code.startsWith(`${prefix}-`),
      `expected ${definition.label} code, got ${code}`,
    );
  };

  return definition;
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

const minimumStartedAtMs = Date.parse("2020-01-01T00:00:00.000Z");
const maximumFutureOffsetMs = 3_000;

const parseIsoTimestamp = (value) => {
  if (typeof value !== "string") return undefined;

  const timestampMs = Date.parse(value);
  if (!Number.isFinite(timestampMs)) return undefined;

  return new Date(timestampMs).toISOString() === value
    ? timestampMs
    : undefined;
};

const validateCounterRecord = (value, path, errors) => {
  for (const [key, count] of Object.entries(value)) {
    if (!isNonNegativeNumber(count)) {
      errors.push(
        `${path}[${JSON.stringify(key)}] must be a non-negative number`,
      );
    }
  }
};

const validateRouteMetrics = (routes, errors) => {
  for (const [route, metrics] of Object.entries(routes)) {
    const path = `requests.routes[${JSON.stringify(route)}]`;
    if (!isRecord(metrics)) {
      errors.push(`${path} must be an object`);
      continue;
    }

    for (const field of ["count", "avgMs", "minMs", "maxMs"]) {
      if (!isNonNegativeNumber(metrics[field])) {
        errors.push(`${path}.${field} must be a non-negative number`);
      }
    }

    if (!isRecord(metrics.byStatus)) {
      errors.push(`${path}.byStatus must be an object`);
    } else {
      validateCounterRecord(metrics.byStatus, `${path}.byStatus`, errors);
    }
  }
};

export const validateMetricsSnapshot = (
  metrics,
  { nowMs = Date.now(), uptimeToleranceSeconds = 3 } = {},
) => {
  const errors = [];

  if (metrics?.service !== "api-ground-codes") {
    errors.push('service must be "api-ground-codes"');
  }
  if (metrics?.scope !== "worker-isolate") {
    errors.push('scope must be "worker-isolate"');
  }

  const startedAtMs = parseIsoTimestamp(metrics?.startedAt);
  const maximumStartedAtMs = nowMs + maximumFutureOffsetMs;
  if (startedAtMs === undefined) {
    errors.push("startedAt must be a valid ISO-8601 timestamp");
  } else if (startedAtMs < minimumStartedAtMs) {
    errors.push("startedAt must be on or after 2020-01-01T00:00:00.000Z");
  } else if (startedAtMs > maximumStartedAtMs) {
    errors.push("startedAt must not be more than 3 seconds in the future");
  }

  if (!isNonNegativeNumber(metrics?.uptimeSeconds)) {
    errors.push("uptimeSeconds must be a non-negative number");
  } else if (
    startedAtMs !== undefined &&
    startedAtMs >= minimumStartedAtMs &&
    startedAtMs <= maximumStartedAtMs &&
    Math.abs((nowMs - startedAtMs) / 1000 - metrics.uptimeSeconds) >
      uptimeToleranceSeconds
  ) {
    errors.push(
      `uptimeSeconds must be within ${uptimeToleranceSeconds} seconds of elapsed time since startedAt`,
    );
  }
  if (
    typeof metrics?.runtimeCommit !== "string" ||
    !/^[0-9a-f]{40}$/.test(metrics.runtimeCommit)
  ) {
    errors.push(
      "runtimeCommit must be a 40-character lowercase hexadecimal commit SHA",
    );
  }
  if (!isNonNegativeNumber(metrics?.requests?.total)) {
    errors.push("requests.total must be a non-negative number");
  }
  if (!isNonNegativeNumber(metrics?.requests?.avgMs)) {
    errors.push("requests.avgMs must be a non-negative number");
  }
  if (!isRecord(metrics?.requests?.byPath)) {
    errors.push("requests.byPath must be an object");
  } else {
    validateCounterRecord(metrics.requests.byPath, "requests.byPath", errors);
  }
  if (!isRecord(metrics?.requests?.routes)) {
    errors.push("requests.routes must be an object");
  } else {
    validateRouteMetrics(metrics.requests.routes, errors);
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
