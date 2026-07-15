#!/usr/bin/env node

import {
  formatVerificationResult,
  verifyRegionData,
} from "./region-data/verify.mjs";

const USAGE =
  "Usage: node scripts/verify-region-data.mjs (--source <path> | --manifest <path>) --materialized <path> [--exact]";
const FLAGS = new Map([
  ["--source", "sourceRoot"],
  ["--manifest", "manifestPath"],
  ["--materialized", "materializedRoot"],
]);

const parseArguments = (arguments_) => {
  const parsed = { exact: false };
  for (let index = 0; index < arguments_.length; index += 1) {
    const flag = arguments_[index];
    if (flag === "--exact") {
      if (parsed.exact) throw new TypeError("Duplicate argument: --exact");
      parsed.exact = true;
      continue;
    }
    const field = FLAGS.get(flag);
    if (!field) throw new TypeError(`Unknown argument: ${flag ?? "<missing>"}`);
    if (Object.hasOwn(parsed, field)) {
      throw new TypeError(`Duplicate argument: ${flag}`);
    }
    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) {
      throw new TypeError(`Missing value for argument: ${flag}`);
    }
    parsed[field] = value;
    index += 1;
  }
  if (!parsed.materializedRoot) {
    throw new TypeError("Missing required argument: --materialized");
  }
  if (Boolean(parsed.sourceRoot) === Boolean(parsed.manifestPath)) {
    throw new TypeError("Provide exactly one of --source or --manifest");
  }
  return parsed;
};

try {
  const result = await verifyRegionData(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${formatVerificationResult(result)}\n`);
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n${USAGE}\n`,
  );
  process.exitCode = 1;
}
