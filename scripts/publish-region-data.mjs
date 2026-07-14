#!/usr/bin/env node

import {
  createR2ClientFromEnvironment,
  formatPublishResult,
  publishRegionData,
} from "./region-data/publish.mjs";

const USAGE =
  "Usage: node scripts/publish-region-data.mjs --staging <path> --pointer <path>";
const FLAGS = new Map([
  ["--staging", "stagingRoot"],
  ["--pointer", "pointerPath"],
]);

const parseArguments = (arguments_) => {
  const parsed = {};
  for (let index = 0; index < arguments_.length; index += 2) {
    const flag = arguments_[index];
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
  }
  for (const [flag, field] of FLAGS) {
    if (!Object.hasOwn(parsed, field)) {
      throw new TypeError(`Missing required argument: ${flag}`);
    }
  }
  return parsed;
};

let client;
try {
  const configured = createR2ClientFromEnvironment();
  client = configured.client;
  const result = await publishRegionData({
    ...parseArguments(process.argv.slice(2)),
    client,
    bucket: configured.bucket,
  });
  process.stdout.write(`${formatPublishResult(result)}\n`);
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n${USAGE}\n`,
  );
  process.exitCode = 1;
} finally {
  client?.destroy?.();
}
