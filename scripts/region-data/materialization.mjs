import { lstatSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const sentinels = new Map([
  ["region-dist", "region-1.json"],
  ["region-db", "region-1.index"],
]);

const isMaterializedGroup = (directory, sentinel) => {
  try {
    return (
      lstatSync(directory).isDirectory() &&
      lstatSync(join(directory, sentinel)).isFile()
    );
  } catch {
    return false;
  }
};

export const assertMaterializedRegionData = ({
  directories = {},
  groups = [...sentinels.keys()],
  root = repositoryRoot,
} = {}) => {
  const unknown = groups.filter((group) => !sentinels.has(group));
  if (unknown.length > 0) {
    throw new TypeError(`Unknown region data group(s): ${unknown.join(", ")}`);
  }

  const absoluteRoot = resolve(root);
  const missing = groups.filter((group) => {
    const directory = resolve(
      directories[group] ?? join(absoluteRoot, "packages/geoint", group),
    );
    return !isMaterializedGroup(directory, sentinels.get(group));
  });
  if (missing.length === 0) return;

  throw new Error(
    `Region data is not materialized for: ${missing.join(", ")}. Run \`REGION_DATA_BASE_URL=https://region-data.ground.codes pnpm region-data:sync\` before this command.`,
  );
};
