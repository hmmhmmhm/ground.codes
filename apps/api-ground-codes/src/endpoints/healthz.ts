import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Elysia, { t } from "elysia";

const fallbackPackageJson = {
  version: "1.0.79",
  dependencies: {},
} as {
  version: string;
  dependencies: Record<string, string>;
};

const getEndpointDir = () => {
  try {
    return typeof import.meta.url === "string"
      ? dirname(fileURLToPath(import.meta.url))
      : null;
  } catch {
    return null;
  }
};

const endpointDir = getEndpointDir();
const packageJson = endpointDir
  ? (JSON.parse(
      readFileSync(join(endpointDir, "../../package.json"), "utf8"),
    ) as typeof fallbackPackageJson)
  : fallbackPackageJson;

const findUp = (fileName: string, startDir: string) => {
  let currentDir = startDir;
  while (true) {
    const candidate = join(currentDir, fileName);
    if (existsSync(candidate)) return candidate;

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) return null;
    currentDir = parentDir;
  }
};

const runtimeDependency =
  packageJson.dependencies["ground-codes"] ??
  packageJson.dependencies["@repo/codebook"] ??
  "";
const lockfilePath = endpointDir ? findUp("pnpm-lock.yaml", endpointDir) : null;
const lockfileCommit = lockfilePath
  ? readFileSync(lockfilePath, "utf8").match(
      /ground\.codes\/tar\.gz\/([0-9a-f]{40})#path:packages\/ground-codes/,
    )?.[1]
  : undefined;

export const getRuntimeMetadata = () => {
  const runtimeTag =
    process.env.API_RUNTIME_TAG ??
    runtimeDependency.match(/#([^&]+)&path:/)?.[1] ??
    (runtimeDependency.startsWith("workspace:") ? "workspace" : "unknown");
  const runtimeCommit =
    lockfileCommit ??
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    "0000000000000000000000000000000000000000";

  return { runtimeTag, runtimeCommit };
};

export const healthz = new Elysia().get(
  "/healthz",
  async () => {
    return "OK";
  },
  {
    detail: {
      tags: ["Health"],
      summary: "Health Check",
      description: "Health check endpoint",
    },
    response: t.String({
      description: "Health check response",
      example: "OK",
    }),
  },
);

export const readyz = new Elysia().get(
  "/readyz",
  async ({ set }) => {
    set.headers["cache-control"] = "no-store";
    const { runtimeTag, runtimeCommit } = getRuntimeMetadata();

    return {
      status: "ready",
      service: "api-ground-codes",
      apiVersion: packageJson.version,
      runtimeTag,
      runtimeCommit,
    };
  },
  {
    detail: {
      tags: ["Health"],
      summary: "Readiness Check",
      description: "Deployment readiness endpoint",
    },
    response: t.Object({
      status: t.String({
        example: "ready",
      }),
      service: t.String({
        example: "api-ground-codes",
      }),
      apiVersion: t.String({
        example: "1.0.68",
      }),
      runtimeTag: t.String({
        example: "unknown",
      }),
      runtimeCommit: t.String({
        example: "0000000000000000000000000000000000000000",
      }),
    }),
  },
);
