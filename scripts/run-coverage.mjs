import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const REPOSITORY_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const COVERAGE_REPORT_DIRECTORIES = [
  "coverage/ground-codes",
  "coverage/api",
  "coverage/api-branches",
  "coverage/web",
  "coverage/web-branches",
  "coverage/operations",
];

export const COVERAGE_COMMANDS = [
  {
    name: "coverage:ground-codes",
    command: "pnpm",
    args: ["coverage:ground-codes"],
  },
  { name: "coverage:api", command: "pnpm", args: ["coverage:api"] },
  { name: "coverage:web", command: "pnpm", args: ["coverage:web"] },
  {
    name: "coverage:operations",
    command: "pnpm",
    args: ["coverage:operations"],
  },
  { name: "coverage:check", command: "pnpm", args: ["coverage:check"] },
];

const reportPath = (repositoryRoot, directory) => {
  const coverageRoot = resolve(repositoryRoot, "coverage");
  const target = resolve(repositoryRoot, directory);
  const relativeTarget = relative(coverageRoot, target);
  if (
    relativeTarget === "" ||
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    throw new Error(`unsafe coverage report directory ${directory}`);
  }
  return target;
};

const formatFailure = (name, result) => {
  if (result.error) {
    return `${name} failed to start: ${result.error.code ?? "unknown error"}`;
  }
  if (result.signal) return `${name} failed with signal ${result.signal}`;
  return `${name} failed with exit status ${String(result.status)}`;
};

export const runCoverage = ({
  repositoryRoot = REPOSITORY_ROOT,
  spawn = spawnSync,
  remove = rmSync,
  writeError = console.error,
} = {}) => {
  for (const directory of COVERAGE_REPORT_DIRECTORIES) {
    remove(reportPath(repositoryRoot, directory), {
      recursive: true,
      force: true,
    });
  }

  for (const { name, command, args } of COVERAGE_COMMANDS) {
    const result = spawn(command, args, {
      cwd: repositoryRoot,
      shell: false,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      writeError(formatFailure(name, result));
      return Number.isInteger(result.status) && result.status > 0
        ? result.status
        : 1;
    }
  }

  return 0;
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) process.exitCode = runCoverage();
