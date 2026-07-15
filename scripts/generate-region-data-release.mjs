#!/usr/bin/env node

import { generateRelease } from "./region-data/generate-release.mjs";

const USAGE =
  "Usage: node scripts/generate-region-data-release.mjs --source <path> --staging <path> --pointer-out <path>";
const FLAGS = new Map([
  ["--source", "sourceRoot"],
  ["--staging", "stagingRoot"],
  ["--pointer-out", "pointerPath"],
]);

const parseArguments = (arguments_) => {
  const parsed = {};
  for (let index = 0; index < arguments_.length; index += 2) {
    const flag = arguments_[index];
    const value = arguments_[index + 1];
    const field = FLAGS.get(flag);
    if (!field) throw new TypeError(`Unknown argument: ${flag ?? "<missing>"}`);
    if (Object.hasOwn(parsed, field)) {
      throw new TypeError(`Duplicate argument: ${flag}`);
    }
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      throw new TypeError(`Missing value for argument: ${flag}`);
    }
    parsed[field] = value;
  }
  for (const [flag, field] of FLAGS) {
    if (!Object.hasOwn(parsed, field)) {
      throw new TypeError(`Missing required argument: ${flag}`);
    }
  }
  return parsed;
};

try {
  const result = await generateRelease(parseArguments(process.argv.slice(2)));
  process.stdout.write(
    `generated ${result.version} ${result.entryCount} entries ${result.objectCount} objects\n`,
  );
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n${USAGE}\n`,
  );
  process.exitCode = 1;
}
