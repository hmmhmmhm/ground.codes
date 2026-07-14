import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateCoveragePolicy } from "./coverage-policy.mjs";

const POLICY_PATH = "scripts/coverage-policy.json";
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".vercel",
  "coverage",
  "node_modules",
]);

const walkFiles = (root, relativeDirectory = "") => {
  const directory = resolve(root, relativeDirectory);
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const relativePath = [relativeDirectory, entry.name]
      .filter(Boolean)
      .join("/");
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...walkFiles(root, relativePath));
      }
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
};

const listSourceFiles = (repositoryRoot) => {
  try {
    return execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard"],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    )
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return walkFiles(repositoryRoot);
  }
};

const formatRatio = (metric) => `${(metric.ratio * 100).toFixed(2)}%`;

const formatTarget = (target) => {
  if (!target.ok) return `${target.name} FAIL ${target.errors.join("; ")}`;
  return [
    target.name,
    "PASS",
    `line=${formatRatio(target.metrics.line)}`,
    `function=${formatRatio(target.metrics.function)}`,
    `branch=${formatRatio(target.metrics.branch)}`,
  ].join(" ");
};

export const runCoverageCheck = ({
  repositoryRoot = process.cwd(),
  write = console.log,
} = {}) => {
  const policyFile = resolve(repositoryRoot, POLICY_PATH);
  if (!existsSync(policyFile)) {
    write(`coverage FAIL missing policy ${POLICY_PATH}`);
    return 1;
  }

  let policy;
  try {
    policy = JSON.parse(readFileSync(policyFile, "utf8"));
  } catch {
    write(`coverage FAIL unreadable policy ${POLICY_PATH}`);
    return 1;
  }

  try {
    evaluateCoveragePolicy(policy);
  } catch (error) {
    write(`coverage FAIL invalid policy: ${error.message}`);
    return 1;
  }

  const reports = {};
  const reportErrors = {};
  const realRepositoryRoot = realpathSync(repositoryRoot);
  for (const target of Object.values(policy.targets ?? {})) {
    if (typeof target?.lcov !== "string") continue;
    const reportFile = resolve(repositoryRoot, target.lcov);
    if (!existsSync(reportFile)) continue;
    try {
      const realReport = realpathSync(reportFile);
      const relativeReport = relative(realRepositoryRoot, realReport);
      if (
        relativeReport === ".." ||
        relativeReport.startsWith(`..${sep}`) ||
        isAbsolute(relativeReport)
      ) {
        reportErrors[target.lcov] = `unsafe LCOV report ${target.lcov}`;
      } else if (!statSync(realReport).isFile()) {
        reportErrors[target.lcov] = `unreadable LCOV report ${target.lcov}`;
      } else {
        reports[target.lcov] = readFileSync(realReport, "utf8");
      }
    } catch {
      reportErrors[target.lcov] = `unreadable LCOV report ${target.lcov}`;
    }
  }

  let result;
  try {
    result = evaluateCoveragePolicy(policy, {
      repositoryRoot,
      reports,
      reportErrors,
      sourceFiles: listSourceFiles(repositoryRoot),
    });
  } catch (error) {
    write(`coverage FAIL invalid policy: ${error.message}`);
    return 1;
  }

  for (const target of result.targets) write(formatTarget(target));
  return result.ok ? 0 : 1;
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) process.exitCode = runCoverageCheck();
