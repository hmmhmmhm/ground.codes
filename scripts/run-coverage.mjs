import { spawnSync } from "node:child_process";
import {
  closeSync,
  lstatSync,
  mkdirSync,
  openSync,
  realpathSync,
  rmSync,
  unlinkSync,
} from "node:fs";
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

const LOCK_FILENAME = ".run-coverage.lock";

const safeError = (error) => {
  if (typeof error?.publicMessage === "string") return error.publicMessage;
  return typeof error?.code === "string" ? error.code : "unknown error";
};

const unsafePathError = (publicMessage) =>
  Object.assign(new Error(publicMessage), { publicMessage });

const validateCoverageRoot = (coverageRoot) => {
  const stats = lstatSync(coverageRoot);
  if (
    stats.isSymbolicLink() ||
    !stats.isDirectory() ||
    realpathSync(coverageRoot) !== coverageRoot
  ) {
    throw unsafePathError("unsafe coverage root");
  }
};

const prepareCoverageRoot = (repositoryRoot) => {
  const realRepositoryRoot = realpathSync(repositoryRoot);
  const coverageRoot = resolve(realRepositoryRoot, "coverage");
  try {
    mkdirSync(coverageRoot, { mode: 0o700 });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  validateCoverageRoot(coverageRoot);
  return coverageRoot;
};

const reportPath = (coverageRoot, directory) => {
  const target = resolve(coverageRoot, directory.replace(/^coverage\//, ""));
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

const validateReportPath = (coverageRoot, directory) => {
  const target = reportPath(coverageRoot, directory);
  try {
    if (lstatSync(target).isSymbolicLink()) {
      throw unsafePathError(`unsafe coverage report directory ${directory}`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return target;
};

const acquireLock = (coverageRoot) => {
  validateCoverageRoot(coverageRoot);
  const lockPath = resolve(coverageRoot, LOCK_FILENAME);
  const descriptor = openSync(lockPath, "wx", 0o600);
  return { descriptor, lockPath };
};

const releaseLock = ({ descriptor, lockPath }) => {
  let releaseError;
  try {
    closeSync(descriptor);
  } catch (error) {
    releaseError = error;
  }
  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (error?.code !== "ENOENT") releaseError ??= error;
  }
  if (releaseError) throw releaseError;
};

const formatFailure = (name, result) => {
  if (result?.error) {
    return `${name} failed to start: ${result.error.code ?? "unknown error"}`;
  }
  if (result?.signal) return `${name} failed with signal ${result.signal}`;
  return `${name} failed with exit status ${String(result?.status)}`;
};

const cleanReports = ({ coverageRoot, remove }) => {
  validateCoverageRoot(coverageRoot);
  for (const directory of COVERAGE_REPORT_DIRECTORIES) {
    validateReportPath(coverageRoot, directory);
  }

  for (const directory of COVERAGE_REPORT_DIRECTORIES) {
    validateCoverageRoot(coverageRoot);
    remove(validateReportPath(coverageRoot, directory), {
      recursive: true,
      force: true,
    });
  }
};

const runCommands = ({ repositoryRoot, spawn, writeError }) => {
  for (const { name, command, args } of COVERAGE_COMMANDS) {
    let result;
    try {
      result = spawn(command, args, {
        cwd: repositoryRoot,
        shell: false,
        stdio: "inherit",
      });
    } catch (error) {
      writeError(`${name} failed to start: ${safeError(error)}`);
      return 1;
    }
    if (result?.status !== 0) {
      writeError(formatFailure(name, result));
      return Number.isInteger(result?.status) && result.status > 0
        ? result.status
        : 1;
    }
  }
  return 0;
};

export const runCoverage = ({
  repositoryRoot = REPOSITORY_ROOT,
  spawn = spawnSync,
  remove = rmSync,
  writeError = console.error,
} = {}) => {
  let coverageRoot;
  try {
    coverageRoot = prepareCoverageRoot(repositoryRoot);
  } catch (error) {
    writeError(`coverage setup failed: ${safeError(error)}`);
    return 1;
  }

  let lock;
  try {
    lock = acquireLock(coverageRoot);
  } catch (error) {
    writeError(
      error?.code === "EEXIST"
        ? "coverage run already in progress"
        : `coverage lock failed: ${safeError(error)}`,
    );
    return 1;
  }

  let exitCode = 1;
  try {
    try {
      cleanReports({ coverageRoot, remove });
      exitCode = runCommands({ repositoryRoot, spawn, writeError });
    } catch (error) {
      writeError(`coverage cleanup failed: ${safeError(error)}`);
      exitCode = 1;
    }
  } finally {
    try {
      releaseLock(lock);
    } catch (error) {
      writeError(`coverage lock release failed: ${safeError(error)}`);
      exitCode = 1;
    }
  }

  return exitCode;
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) process.exitCode = runCoverage();
