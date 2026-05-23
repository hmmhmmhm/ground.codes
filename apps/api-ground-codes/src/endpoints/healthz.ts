import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Elysia, { t } from "elysia";

const endpointDir = dirname(fileURLToPath(import.meta.url));
const packagePath = join(endpointDir, "../../package.json");
const lockfilePath = join(endpointDir, "../../../../pnpm-lock.yaml");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
  version: string;
  dependencies: Record<string, string>;
};

const runtimeDependency =
  packageJson.dependencies["ground-codes"] ??
  packageJson.dependencies["@repo/codebook"] ??
  "";
const runtimeTag = runtimeDependency.match(/#([^&]+)&path:/)?.[1] ?? "unknown";
const runtimeCommit =
  readFileSync(lockfilePath, "utf8").match(
    /ground\.codes\/tar\.gz\/([0-9a-f]{40})#path:packages\/ground-codes/,
  )?.[1] ?? "unknown";

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
  }
);

export const readyz = new Elysia().get(
  "/readyz",
  async ({ set }) => {
    set.headers["cache-control"] = "no-store";

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
        example: "railway-api-runtime-20260522-hindi-v3",
      }),
      runtimeCommit: t.String({
        example: "f173ae362a9134d954d8b867c66058c9dcb7a754",
      }),
    }),
  }
);
