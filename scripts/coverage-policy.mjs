import { isAbsolute, relative } from "node:path";

const METRICS = ["line", "function", "branch"];
const GLOB_CHARACTERS = /[*?[]/;

const normalizePath = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");

const normalizeSource = (source, repositoryRoot) =>
  normalizePath(isAbsolute(source) ? relative(repositoryRoot, source) : source);

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

const createRecord = () => ({
  lines: new Map(),
  functions: new Map(),
  functionKeys: new Map(),
  branches: new Map(),
});

const parseHits = (rawHits) => {
  if (rawHits === "-") return 0;
  const hits = Number(rawHits);
  if (!Number.isFinite(hits) || hits < 0) {
    throw new Error(`invalid LCOV hit count ${rawHits}`);
  }
  return hits;
};

export const parseLcov = (lcov, { repositoryRoot = process.cwd() } = {}) => {
  if (typeof lcov !== "string") throw new TypeError("LCOV input must be text");

  const records = new Map();
  let record;

  for (const rawLine of lcov.split(/\r?\n/)) {
    if (rawLine.startsWith("SF:")) {
      const source = normalizeSource(rawLine.slice(3), repositoryRoot);
      record = records.get(source) ?? createRecord();
      records.set(source, record);
      continue;
    }
    if (!record || rawLine === "end_of_record") {
      if (rawLine === "end_of_record") record = undefined;
      continue;
    }

    if (rawLine.startsWith("DA:")) {
      const [line, hits] = rawLine.slice(3).split(",");
      mergeHits(record.lines, line, parseHits(hits));
    } else if (rawLine.startsWith("FN:")) {
      const separator = rawLine.indexOf(",", 3);
      const line = rawLine.slice(3, separator);
      const name = rawLine.slice(separator + 1);
      const key = `${line},${name}`;
      record.functionKeys.set(name, key);
      if (!record.functions.has(key)) record.functions.set(key, 0);
    } else if (rawLine.startsWith("FNDA:")) {
      const separator = rawLine.indexOf(",", 5);
      const hits = rawLine.slice(5, separator);
      const name = rawLine.slice(separator + 1);
      const key = record.functionKeys.get(name) ?? `?,${name}`;
      mergeHits(record.functions, key, parseHits(hits));
    } else if (rawLine.startsWith("BRDA:")) {
      const [line, block, branch, hits] = rawLine.slice(5).split(",");
      mergeHits(record.branches, `${line},${block},${branch}`, parseHits(hits));
    }
  }

  return records;
};

const metricSummary = (records, metric) => {
  let covered = 0;
  let total = 0;

  for (const record of records) {
    const entries =
      metric === "line"
        ? record.lines
        : metric === "function"
          ? record.functions
          : record.branches;
    total += entries.size;
    covered += [...entries.values()].filter((hits) => hits > 0).length;
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
  if (!Array.isArray(target.include) || target.include.length === 0) {
    throw new Error(`${name} target must include source paths`);
  }
  if (!Array.isArray(target.exclude ?? [])) {
    throw new Error(`${name} target exclusions must be an array`);
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
      sourceFiles.map((source) => normalizeSource(source, repositoryRoot)),
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

const missingReportResult = (name, target) => ({
  name,
  ok: false,
  files: [],
  metrics: null,
  errors: [`missing LCOV report ${target.lcov}`],
});

export const evaluateCoveragePolicy = (
  policy,
  { repositoryRoot = process.cwd(), reports = {}, sourceFiles = [] } = {},
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
    if (!Object.hasOwn(reports, target.lcov)) {
      return missingReportResult(name, target);
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
