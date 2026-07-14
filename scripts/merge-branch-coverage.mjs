import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { isAbsolute, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseLcov } from "./coverage-policy.mjs";

const API_SOURCES = [
  "apps/api-ground-codes/src/app.ts",
  "apps/api-ground-codes/src/endpoints/code.ts",
  "apps/api-ground-codes/src/endpoints/cors.ts",
  "apps/api-ground-codes/src/endpoints/docs.ts",
  "apps/api-ground-codes/src/endpoints/healthz.ts",
  "apps/api-ground-codes/src/endpoints/metrics.ts",
  "apps/api-ground-codes/src/endpoints/rate-limit.ts",
  "apps/api-ground-codes/src/endpoints/swagger.ts",
  "apps/api-ground-codes/src/endpoints/v1/api-error.ts",
  "apps/api-ground-codes/src/endpoints/v1/decode.ts",
  "apps/api-ground-codes/src/endpoints/v1/encode.ts",
  "apps/api-ground-codes/src/endpoints/v1/language.ts",
  "apps/api-ground-codes/src/endpoints/v1/region/around.ts",
  "apps/api-ground-codes/src/endpoints/v1/region/info.ts",
  "apps/api-ground-codes/src/endpoints/v1/region/load-region.ts",
  "apps/api-ground-codes/src/endpoints/v1/search.ts",
  "apps/api-ground-codes/src/endpoints/v1/v1-endpoints.ts",
  "apps/api-ground-codes/src/endpoints/v1/validation.ts",
  "apps/api-ground-codes/src/index.ts",
  "apps/api-ground-codes/src/postgis-region-selection.ts",
  "apps/api-ground-codes/src/postgis-region-store.ts",
  "apps/api-ground-codes/src/worker.ts",
];

const WEB_SOURCES = [
  "apps/web/lib/code/ground-codes.ts",
  "apps/web/lib/code/share-url.ts",
  "apps/web/lib/i18n/ground-code-language.ts",
  "apps/web/lib/map/celestial-bodies.ts",
  "apps/web/lib/map/google-maps-availability.ts",
  "apps/web/hooks/use-disable-zoom.ts",
];

export const COVERAGE_BRANCH_TARGETS = {
  api: {
    bunReport: "coverage/api/lcov.info",
    branchReport: "coverage/api-branches/lcov.info",
    sources: API_SOURCES,
  },
  web: {
    bunReport: "coverage/web/lcov.info",
    branchReport: "coverage/web-branches/lcov.info",
    sources: WEB_SOURCES,
  },
};

const normalizeSource = (source, repositoryRoot) =>
  posix
    .normalize(
      (isAbsolute(source)
        ? relative(repositoryRoot, source)
        : source
      ).replaceAll("\\", "/"),
    )
    .replace(/^\.\//, "");

const validateLcov = (label, lcov, repositoryRoot) => {
  try {
    return parseLcov(lcov, { repositoryRoot });
  } catch (error) {
    throw new Error(`${label} LCOV is invalid: ${error.message}`);
  }
};

const validateBranchLcov = (lcov, repositoryRoot) => {
  const projected = [];
  for (const line of lcov.split(/\r?\n/)) {
    if (
      line.startsWith("SF:") ||
      line.startsWith("BRDA:") ||
      line.startsWith("BRF:") ||
      line.startsWith("BRH:") ||
      line === "end_of_record"
    ) {
      projected.push(line);
    }
  }
  return validateLcov("branch", projected.join("\n"), repositoryRoot);
};

const assertExpectedSources = ({
  bunRecords,
  branchRecords,
  expectedSources,
}) => {
  const expected = new Set(expectedSources);
  let detailedBranchCount = 0;
  for (const source of expected) {
    if (!bunRecords.has(source)) {
      throw new Error(`Bun LCOV missing source ${source}`);
    }
    const branchRecord = branchRecords.get(source);
    if (!branchRecord) {
      throw new Error(`branch LCOV missing source ${source}`);
    }
    if (
      branchRecord.branches.size === 0 &&
      branchRecord.summaryOnly.branches === null
    ) {
      throw new Error(`branch LCOV has no branch summary for ${source}`);
    }
    detailedBranchCount += branchRecord.branches.size;
  }
  for (const source of branchRecords.keys()) {
    if (!expected.has(source)) {
      throw new Error(`branch LCOV source mismatch: ${source}`);
    }
  }
  if (detailedBranchCount === 0) {
    throw new Error("branch LCOV target has no detailed branches");
  }
};

const branchLines = (record) => {
  const details = [...record.branches.entries()].map(
    ([key, hits]) => `BRDA:${key},${hits}`,
  );
  const covered = [...record.branches.values()].filter(
    (hits) => hits > 0,
  ).length;
  const summary = record.summaryOnly.branches;
  return [
    ...details,
    `BRF:${summary?.total ?? details.length}`,
    `BRH:${summary?.covered ?? covered}`,
  ];
};

export const mergeBranchCoverage = ({
  bunLcov,
  branchLcov,
  expectedSources,
  repositoryRoot = process.cwd(),
}) => {
  const normalizedExpected = expectedSources.map((source) =>
    normalizeSource(source, repositoryRoot),
  );
  if (new Set(normalizedExpected).size !== normalizedExpected.length) {
    throw new Error("expected coverage sources must be unique");
  }

  const bunRecords = validateLcov("Bun", bunLcov, repositoryRoot);
  const branchRecords = validateBranchLcov(branchLcov, repositoryRoot);
  assertExpectedSources({
    bunRecords,
    branchRecords,
    expectedSources: normalizedExpected,
  });

  const output = [];
  let activeSource;
  const mergedSources = new Set();
  for (const line of bunLcov.split(/\r?\n/)) {
    if (/^(?:BRDA|BRF|BRH):/.test(line)) continue;
    if (line.startsWith("SF:")) {
      activeSource = normalizeSource(line.slice(3), repositoryRoot);
    }
    if (line === "end_of_record" && activeSource) {
      const branchRecord = branchRecords.get(activeSource);
      if (branchRecord) {
        if (mergedSources.has(activeSource)) {
          throw new Error(`Bun LCOV repeats source ${activeSource}`);
        }
        output.push(...branchLines(branchRecord));
        mergedSources.add(activeSource);
      }
      activeSource = undefined;
    }
    output.push(line);
  }
  for (const source of normalizedExpected) {
    if (!mergedSources.has(source)) {
      throw new Error(`Bun LCOV missing source block ${source}`);
    }
  }

  const merged = output.join("\n");
  validateLcov("merged", merged, repositoryRoot);
  return merged;
};

export const mergeBranchCoverageTarget = (
  targetName,
  repositoryRoot = process.cwd(),
) => {
  const target = COVERAGE_BRANCH_TARGETS[targetName];
  if (!target) throw new Error(`unknown coverage branch target ${targetName}`);
  const bunPath = resolve(repositoryRoot, target.bunReport);
  const merged = mergeBranchCoverage({
    bunLcov: readFileSync(bunPath, "utf8"),
    branchLcov: readFileSync(
      resolve(repositoryRoot, target.branchReport),
      "utf8",
    ),
    expectedSources: target.sources,
    repositoryRoot,
  });
  const temporaryPath = `${bunPath}.merge.tmp`;
  writeFileSync(temporaryPath, merged);
  renameSync(temporaryPath, bunPath);
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    mergeBranchCoverageTarget(process.argv[2]);
  } catch (error) {
    console.error(`coverage branch merge FAIL ${error.message}`);
    process.exitCode = 1;
  }
}
