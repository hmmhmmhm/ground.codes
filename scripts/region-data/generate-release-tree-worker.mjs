import {
  closeSync,
  constants,
  fsyncSync,
  openSync,
  readdirSync,
  writeFileSync,
} from "node:fs";

import { collectReleaseObjectMetadata } from "./generate-release-artifacts.mjs";
import { fsyncDirectory } from "./generate-release-durability.mjs";
import {
  identity,
  inspectDirectory,
  verifyObjectDirectory,
  verifyReleaseDirectory,
} from "./generate-release-integrity.mjs";
import { validateManifest } from "./manifest.mjs";

const readInput = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};
const validateObjectName = (name) => {
  if (!/^[a-f0-9]{64}\.json\.gz$/.test(name)) {
    throw new TypeError(
      "object name is outside the content-addressed contract",
    );
  }
  return name;
};

const writeObject = ({ name, bytes }) => {
  validateObjectName(name);
  const descriptor = openSync(
    name,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0),
    0o600,
  );
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
};

const writeObjects = async (input, cwdIdentity) => {
  validateManifest(input.manifest);
  if (readdirSync(".").length !== 0) {
    throw new TypeError("new object directory must be empty");
  }
  const metadata = await collectReleaseObjectMetadata({
    sourceRoot: input.sourceRoot,
    manifest: input.manifest,
    onObject: writeObject,
  });
  inspectDirectory(".", cwdIdentity, "object directory");
  const events = ["objects-written"];
  fsyncDirectory(".", "objects-directory-fsync", {
    failPhase: input.failDurabilityPhase,
    events,
  });
  return {
    metadata,
    objectCount: Object.keys(metadata).length,
    gzipSourcePasses: 1,
    compressedObjectReadPasses: 0,
    durabilityEvents: events,
  };
};

try {
  const input = await readInput();
  const cwdIdentity = identity(
    inspectDirectory(".", input.expectedIdentity, "anchored tree root"),
  );
  let result;
  if (input.operation === "write-objects") {
    result = await writeObjects(input, cwdIdentity);
  } else if (input.operation === "verify-objects") {
    result = verifyObjectDirectory(input.metadata, cwdIdentity);
  } else if (input.operation === "verify-release") {
    result = verifyReleaseDirectory({
      releaseIdentity: cwdIdentity,
      manifestBytes: Buffer.from(input.manifestBytes, "base64"),
      metadata: input.metadata,
    });
  } else {
    throw new TypeError("unsupported release tree operation");
  }
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
