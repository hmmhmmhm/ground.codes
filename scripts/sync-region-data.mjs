#!/usr/bin/env node

import { resolve } from "node:path";

import { syncRegionData } from "./region-data/sync.mjs";

const USAGE =
  "Usage: node scripts/sync-region-data.mjs [--root <path>] (--groups <a,b> | --path <logical-path>...) [--prune]";

const parseArguments = (arguments_) => {
  const parsed = {
    root: process.cwd(),
    pointerPath: resolve("packages/geoint/region-data-release.json"),
    paths: [],
    prune: false,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--prune") {
      if (parsed.prune) throw new TypeError("Duplicate argument: --prune");
      parsed.prune = true;
      continue;
    }
    if (!["--root", "--groups", "--path"].includes(argument)) {
      throw new TypeError(`Unknown argument: ${argument}`);
    }
    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) {
      throw new TypeError(`Missing value for argument: ${argument}`);
    }
    index += 1;
    if (argument === "--root") {
      if (parsed.rootExplicit)
        throw new TypeError("Duplicate argument: --root");
      parsed.root = resolve(value);
      parsed.rootExplicit = true;
    } else if (argument === "--groups") {
      if (parsed.groups) throw new TypeError("Duplicate argument: --groups");
      parsed.groups = value.split(",").filter(Boolean);
      if (parsed.groups.length === 0) {
        throw new TypeError("--groups requires at least one group");
      }
    } else {
      parsed.paths.push(value);
    }
  }
  delete parsed.rootExplicit;
  if (parsed.paths.length === 0) delete parsed.paths;
  return parsed;
};

try {
  const options = parseArguments(process.argv.slice(2));
  const result = await syncRegionData({
    ...options,
    baseUrl: process.env.REGION_DATA_BASE_URL,
  });
  process.stdout.write(
    `synced ${result.version} selected=${result.selected} downloaded=${result.downloaded} skipped=${result.skipped} pruned=${result.pruned} bytes=${result.bytes}\n`,
  );
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n${USAGE}\n`,
  );
  process.exitCode = 1;
}
