import { isAbsolute, posix, relative } from "node:path";

const METRICS = ["line", "function", "branch"];
const GLOB_CHARACTERS = /[*?]/;

const normalizePath = (path) =>
  posix.normalize(path.replaceAll("\\", "/")).replace(/^\.\//, "");

const normalizeSource = (source, repositoryRoot) =>
  normalizePath(isAbsolute(source) ? relative(repositoryRoot, source) : source);

const isContainedSource = (source) =>
  source !== "." &&
  !isAbsolute(source) &&
  !/^[A-Za-z]:\//.test(source) &&
  source !== ".." &&
  !source.startsWith("../");

const isSafeRelativePath = (path) =>
  typeof path === "string" &&
  path.length > 0 &&
  !isAbsolute(path) &&
  !/^[A-Za-z]:[\\/]/.test(path) &&
  isContainedSource(normalizePath(path));

const globToRegExp = (pattern) => {
  const normalized = normalizePath(pattern);
  let expression = "^";

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character === "*" && normalized[index + 1] === "*") {
      index += 1;
      if (normalized[index + 1] === "/") {
        index += 1;
        expression += "(?:.*/)?";
      } else {
        expression += ".*";
      }
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }

  return new RegExp(`${expression}$`);
};

const matches = (path, pattern) => globToRegExp(pattern).test(path);

const mergeHits = (metrics, key, hits) => {
  const previous = metrics.get(key) ?? 0;
  metrics.set(key, Math.max(previous, hits));
};

const COVERAGE_FIELDS = ["lines", "functions", "branches"];

const createMetrics = () => ({
  lines: new Map(),
  functions: new Map(),
  branches: new Map(),
});

const createRecord = () => ({
  ...createMetrics(),
  summaryOnly: { lines: null, functions: null, branches: null },
});

const parseInteger = (value, { positive = false } = {}) => {
  const pattern = positive ? /^[1-9]\d*$/ : /^\d+$/;
  if (!pattern.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const parseFields = (value, count, type) => {
  const fields = value.split(",");
  if (fields.length !== count) throw new Error(`invalid ${type} record`);
  return fields;
};

const requireActiveRecord = (active, type) => {
  if (!active) throw new Error(`${type} record before SF`);
};

const SUMMARY_PAIRS = [
  ["FNF", "FNH", "functions"],
  ["LF", "LH", "lines"],
  ["BRF", "BRH", "branches"],
];

const metricLabel = (metric) =>
  metric === "branches" ? "branch" : metric.slice(0, -1);

const unsafeSummaryMerge = (metric) =>
  new Error(`cannot safely merge summary-only ${metricLabel(metric)} coverage`);

const commitBlock = (active) => {
  for (const [totalType, hitType, metric] of SUMMARY_PAIRS) {
    const hasTotal = active.summaries.has(totalType);
    const hasHit = active.summaries.has(hitType);
    if (hasTotal !== hasHit) {
      throw new Error(`incomplete ${totalType}/${hitType} summary pair`);
    }
    if (!hasTotal) continue;

    const total = active.summaries.get(totalType);
    const covered = active.summaries.get(hitType);
    if (covered > total)
      throw new Error(`${hitType} summary hits exceed total`);
    const details = active.details[metric];
    if (details.size > 0) {
      const detailHits = [...details.values()].filter(
        (hits) => hits > 0,
      ).length;
      if (total !== details.size) {
        throw new Error(`${totalType} summary does not match detailed records`);
      }
      if (covered !== detailHits) {
        throw new Error(`${hitType} summary does not match detailed records`);
      }
      if (active.record.summaryOnly[metric]) throw unsafeSummaryMerge(metric);
    } else {
      if (active.record[metric].size > 0) throw unsafeSummaryMerge(metric);
      const previous = active.record.summaryOnly[metric];
      if (previous && previous.total !== total)
        throw unsafeSummaryMerge(metric);
      active.record.summaryOnly[metric] = {
        total,
        covered: Math.max(previous?.covered ?? 0, covered),
      };
    }
  }

  for (const metric of COVERAGE_FIELDS) {
    if (active.details[metric].size > 0 && active.record.summaryOnly[metric]) {
      throw unsafeSummaryMerge(metric);
    }
    for (const [key, hits] of active.details[metric]) {
      mergeHits(active.record[metric], key, hits);
    }
  }
};

export const parseLcov = (lcov, { repositoryRoot = process.cwd() } = {}) => {
  if (typeof lcov !== "string") throw new TypeError("LCOV input must be text");

  const records = new Map();
  let active;

  for (const rawLine of lcov.split(/\r?\n/)) {
    if (rawLine === "") continue;
    if (rawLine === "end_of_record") {
      if (!active) throw new Error("end_of_record without SF");
      commitBlock(active);
      active = undefined;
      continue;
    }
    if (rawLine.startsWith("TN:")) {
      if (active) throw new Error("TN record before end_of_record");
      continue;
    }
    if (rawLine.startsWith("SF:")) {
      if (active) throw new Error("SF record before end_of_record");
      const rawSource = rawLine.slice(3);
      if (rawSource.trim().length === 0) throw new Error("invalid SF source");
      const source = normalizeSource(rawSource, repositoryRoot);
      if (!isContainedSource(source)) {
        throw new Error(`SF source is outside repository: ${rawSource}`);
      }
      const record = records.get(source) ?? createRecord();
      records.set(source, record);
      active = {
        record,
        details: createMetrics(),
        functionKeys: new Map(),
        functionOccurrences: new Map(),
        summaries: new Map(),
      };
      continue;
    }

    if (rawLine.startsWith("DA:")) {
      requireActiveRecord(active, "DA");
      const [line, hits] = parseFields(rawLine.slice(3), 2, "DA");
      const parsedLine = parseInteger(line, { positive: true });
      const parsedHits = parseInteger(hits);
      if (parsedLine === null || parsedHits === null) {
        throw new Error("invalid DA record");
      }
      mergeHits(active.details.lines, line, parsedHits);
    } else if (rawLine.startsWith("FN:")) {
      requireActiveRecord(active, "FN");
      const [line, name] = parseFields(rawLine.slice(3), 2, "FN");
      if (parseInteger(line, { positive: true }) === null || !name.trim()) {
        throw new Error("invalid FN record");
      }
      const key = `${line},${name}`;
      const keys = active.functionKeys.get(name) ?? [];
      keys.push(key);
      active.functionKeys.set(name, keys);
      if (!active.details.functions.has(key))
        active.details.functions.set(key, 0);
    } else if (rawLine.startsWith("FNDA:")) {
      requireActiveRecord(active, "FNDA");
      const [hits, name] = parseFields(rawLine.slice(5), 2, "FNDA");
      const parsedHits = parseInteger(hits);
      const occurrence = active.functionOccurrences.get(name) ?? 0;
      const key = active.functionKeys.get(name)?.[occurrence];
      if (parsedHits === null || !name.trim() || !key) {
        throw new Error("FNDA has no matching FN occurrence");
      }
      active.functionOccurrences.set(name, occurrence + 1);
      mergeHits(active.details.functions, key, parsedHits);
    } else if (rawLine.startsWith("BRDA:")) {
      requireActiveRecord(active, "BRDA");
      const [line, block, branch, hits] = parseFields(
        rawLine.slice(5),
        4,
        "BRDA",
      );
      const parsedHits = hits === "-" ? 0 : parseInteger(hits);
      if (
        parseInteger(line, { positive: true }) === null ||
        parseInteger(block) === null ||
        parseInteger(branch) === null ||
        parsedHits === null
      ) {
        throw new Error("invalid BRDA record");
      }
      mergeHits(
        active.details.branches,
        `${line},${block},${branch}`,
        parsedHits,
      );
    } else if (/^(?:FNF|FNH|LF|LH|BRF|BRH):/.test(rawLine)) {
      const [type, value, ...rest] = rawLine.split(":");
      requireActiveRecord(active, type);
      if (rest.length > 0 || parseInteger(value) === null) {
        throw new Error(`invalid ${type} record`);
      }
      if (active.summaries.has(type)) {
        throw new Error(`duplicate ${type} summary`);
      }
      active.summaries.set(type, Number(value));
    } else {
      throw new Error(`unknown LCOV record: ${rawLine}`);
    }
  }

  if (active) throw new Error("LCOV record missing end_of_record");

  return records;
};

const metricSummary = (records, metric) => {
  let covered = 0;
  let total = 0;

  for (const record of records) {
    const field = `${metric}${metric === "branch" ? "es" : "s"}`;
    const entries = record[field];
    total += entries.size;
    covered += [...entries.values()].filter((hits) => hits > 0).length;
    total += record.summaryOnly[field]?.total ?? 0;
    covered += record.summaryOnly[field]?.covered ?? 0;
  }

  return { covered, total, ratio: total === 0 ? null : covered / total };
};

const validateTarget = (name, target) => {
  if (!target || typeof target !== "object") {
    throw new Error(`${name} target must be an object`);
  }
  if (typeof target.lcov !== "string" || target.lcov.length === 0) {
    throw new Error(`${name} target must declare an LCOV report`);
  }
  if (!isSafeRelativePath(target.lcov)) {
    throw new Error(`${name} target has an unsafe LCOV report path`);
  }
  if (!Array.isArray(target.include) || target.include.length === 0) {
    throw new Error(`${name} target must include source paths`);
  }
  if (!Array.isArray(target.exclude ?? [])) {
    throw new Error(`${name} target exclusions must be an array`);
  }
  const patterns = [...target.include, ...(target.exclude ?? [])];
  if (
    patterns.some(
      (pattern) => typeof pattern !== "string" || pattern.length === 0,
    )
  ) {
    throw new Error(`${name} target has an invalid source pattern`);
  }
  if (patterns.some((pattern) => /[\[\]]/.test(pattern))) {
    throw new Error(`${name} target has an unsupported bracket glob pattern`);
  }
  for (const metric of METRICS) {
    const minimum = target.minimum?.[metric];
    if (typeof minimum !== "number" || minimum < 0 || minimum > 1) {
      throw new Error(`${name} target has an invalid ${metric} minimum`);
    }
  }
};

export const collectTargetCoverage = ({
  name,
  target,
  records,
  sourceFiles,
  repositoryRoot = process.cwd(),
}) => {
  validateTarget(name, target);
  const exclusions = target.exclude ?? [];
  const inventory = [
    ...new Set(
      sourceFiles
        .map((source) => normalizeSource(source, repositoryRoot))
        .filter(isContainedSource),
    ),
  ].sort();
  const files = new Set();
  const errors = [];
  const isExcluded = (path) =>
    exclusions.some((pattern) => matches(path, pattern));

  for (const rawPattern of target.include) {
    const pattern = normalizePath(rawPattern);
    const matchedFiles = inventory.filter(
      (path) => matches(path, pattern) && !isExcluded(path),
    );

    if (matchedFiles.length === 0) {
      const description = GLOB_CHARACTERS.test(pattern)
        ? `include pattern ${pattern} matched no source files`
        : `declared source file does not exist ${pattern}`;
      errors.push(description);
    }
    for (const path of matchedFiles) files.add(path);
  }

  const selectedFiles = [...files].sort();
  const selectedRecords = [];
  for (const path of selectedFiles) {
    const record = records.get(path);
    if (!record) errors.push(`missing LCOV source ${path}`);
    else selectedRecords.push(record);
  }

  const metrics = Object.fromEntries(
    METRICS.map((metric) => [metric, metricSummary(selectedRecords, metric)]),
  );
  for (const metric of METRICS) {
    const value = metrics[metric];
    if (value.ratio === null) {
      errors.push(`${metric} metric has no records`);
    } else if (value.ratio < target.minimum[metric]) {
      errors.push(
        `${metric} ${value.ratio.toFixed(6)} is below ${target.minimum[
          metric
        ].toFixed(6)}`,
      );
    }
  }

  return {
    name,
    ok: errors.length === 0,
    files: selectedFiles,
    metrics,
    errors,
  };
};

const reportFailureResult = (name, error) => ({
  name,
  ok: false,
  files: [],
  metrics: null,
  errors: [error],
});

export const evaluateCoveragePolicy = (
  policy,
  {
    repositoryRoot = process.cwd(),
    reports = {},
    reportErrors = {},
    sourceFiles = [],
  } = {},
) => {
  if (policy?.schemaVersion !== 1) {
    throw new Error("coverage policy schemaVersion must be 1");
  }
  if (
    !policy.targets ||
    Object.getPrototypeOf(policy.targets) !== Object.prototype ||
    Object.keys(policy.targets).length === 0
  ) {
    throw new Error("coverage policy targets must be a non-empty plain object");
  }

  const targets = Object.entries(policy.targets).map(([name, target]) => {
    validateTarget(name, target);
    if (Object.hasOwn(reportErrors, target.lcov)) {
      return reportFailureResult(name, reportErrors[target.lcov]);
    }
    if (!Object.hasOwn(reports, target.lcov)) {
      return reportFailureResult(name, `missing LCOV report ${target.lcov}`);
    }

    try {
      return collectTargetCoverage({
        name,
        target,
        records: parseLcov(reports[target.lcov], { repositoryRoot }),
        sourceFiles,
        repositoryRoot,
      });
    } catch (error) {
      return {
        name,
        ok: false,
        files: [],
        metrics: null,
        errors: [`unreadable LCOV report ${target.lcov}: ${error.message}`],
      };
    }
  });

  return { ok: targets.every((target) => target.ok), targets };
};
