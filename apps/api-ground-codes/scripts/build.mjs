import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const hasWorkspace =
  existsSync(resolve(repoRoot, "pnpm-workspace.yaml")) &&
  existsSync(resolve(repoRoot, "packages/ground-codes/package.json")) &&
  existsSync(resolve(repoRoot, "packages/geoint/package.json"));

if (!hasWorkspace) {
  console.log(
    "No monorepo workspace found; using installed ground-codes packages.",
  );
  process.exit(0);
}

for (const args of [
  ["--filter", "@ground-codes/geoint", "build"],
  ["--filter", "ground-codes", "build"],
]) {
  const result = spawnSync("pnpm", args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
