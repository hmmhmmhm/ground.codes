#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  canonicalJson,
  sha256Hex,
  validateManifest,
} from "../../../scripts/region-data/manifest.mjs";
import {
  readResponseBytes,
  requestWithRetry,
} from "../../../scripts/region-data/sync-http.mjs";

const pointerPath = "packages/geoint/region-data-release.json";
const referencePattern = /^(?:HEAD|[a-f0-9]{40,64})$/i;
const hashPattern = /^[a-f0-9]{64}$/;
const versionPattern = /^sha256-[a-f0-9]{64}$/;

const validateReference = (reference, label) => {
  if (typeof reference !== "string" || !referencePattern.test(reference)) {
    throw new TypeError(`${label} must be HEAD or a full Git object ID`);
  }
  return reference;
};

const parsePointer = (bytes, label) => {
  let pointer;
  try {
    pointer = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new TypeError(`${label} release pointer is not valid JSON`);
  }
  if (
    pointer === null ||
    typeof pointer !== "object" ||
    Array.isArray(pointer) ||
    Object.getPrototypeOf(pointer) !== Object.prototype ||
    Object.keys(pointer).sort().join(",") !==
      "manifestSha256,schemaVersion,version" ||
    pointer.schemaVersion !== 1 ||
    typeof pointer.manifestSha256 !== "string" ||
    !hashPattern.test(pointer.manifestSha256) ||
    typeof pointer.version !== "string" ||
    !versionPattern.test(pointer.version) ||
    !bytes.equals(Buffer.from(canonicalJson(pointer)))
  ) {
    throw new TypeError(`${label} release pointer is malformed`);
  }
  return pointer;
};

const referenceExists = (reference) => {
  try {
    execFileSync(
      "git",
      ["rev-parse", "--verify", "--quiet", `${reference}^{commit}`],
      {
        stdio: "ignore",
      },
    );
    return true;
  } catch {
    return false;
  }
};

const pointerAtReference = (reference, label) => {
  validateReference(reference, label);
  if (!referenceExists(reference)) {
    throw new TypeError(`${label} Git reference is unavailable`);
  }
  let pointerRecord;
  try {
    pointerRecord = execFileSync(
      "git",
      ["ls-tree", "-z", reference, "--", pointerPath],
      {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    throw new TypeError(`${label} release pointer could not be inspected`, {
      cause: error,
    });
  }
  if (pointerRecord.length === 0) return null;
  if (
    !/^100(?:644|755) blob [a-f0-9]+\tpackages\/geoint\/region-data-release\.json\0$/.test(
      pointerRecord,
    )
  ) {
    throw new TypeError(`${label} release pointer is not a regular Git blob`);
  }
  try {
    return parsePointer(
      execFileSync("git", ["show", `${reference}:${pointerPath}`], {
        encoding: "buffer",
        maxBuffer: 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      }),
      label,
    );
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`${label} release pointer could not be read`, {
      cause: error,
    });
  }
};

const regionDataBaseUrl = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("REGION_DATA_BASE_URL is required");
  }
  const url = new URL(value.endsWith("/") ? value : `${value}/`);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("REGION_DATA_BASE_URL must be a plain HTTP(S) origin");
  }
  return url;
};

const fetchReleaseManifest = async ({ pointer, baseUrl, label }) => {
  try {
    const bytes = await requestWithRetry(
      new URL(`releases/${pointer.version}/manifest.json`, baseUrl),
      (response) =>
        readResponseBytes(response, `${label} release manifest`, {
          maximumBytes: 4 * 1024 * 1024,
        }),
    );
    if (sha256Hex(bytes) !== pointer.manifestSha256) {
      throw new TypeError("hash does not match its release pointer");
    }
    let manifest;
    try {
      manifest = JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new TypeError("is not valid JSON");
    }
    validateManifest(manifest);
    if (manifest.version !== pointer.version) {
      throw new TypeError("version does not match its release pointer");
    }
    if (!bytes.equals(Buffer.from(canonicalJson(manifest)))) {
      throw new TypeError("is not canonical JSON");
    }
    return manifest;
  } catch (error) {
    throw new TypeError(
      `${label} release manifest is unavailable or invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
};

const regionDistEntries = (manifest) => {
  const datasets = new Map();
  for (const entry of manifest.entries) {
    if (entry.group !== "region-dist") continue;
    const match = entry.path.match(
      /^packages\/geoint\/region-dist\/([^/]+)\.json$/,
    );
    if (!match) {
      throw new TypeError(
        `unsupported region-dist manifest entry: ${entry.path}`,
      );
    }
    datasets.set(match[1], entry.sha256);
  }
  return datasets;
};

const changedManifestDatasets = (previous, current) => {
  const oldEntries = regionDistEntries(previous);
  const newEntries = regionDistEntries(current);
  return [...new Set([...oldEntries.keys(), ...newEntries.keys()])]
    .filter((name) => oldEntries.get(name) !== newEntries.get(name))
    .sort();
};

const changedGitDatasets = (baseRef, headRef) => {
  const regionDistDir = "packages/geoint/region-dist";
  const output = execFileSync(
    "git",
    ["diff", "--name-only", baseRef, headRef, "--", `${regionDistDir}/`],
    {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return [
    ...new Set(
      output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.endsWith(".json"))
        .map((line) =>
          line.slice(`${regionDistDir}/`.length).replace(/\.json$/, ""),
        ),
    ),
  ].sort();
};

const samePointer = (left, right) =>
  left.version === right.version &&
  left.manifestSha256 === right.manifestSha256;

const detectChangedDatasets = async ({ baseRef, headRef, baseUrl }) => {
  const head = validateReference(headRef ?? "HEAD", "head");
  const currentPointer = pointerAtReference(head, "current");
  if (!currentPointer) {
    throw new TypeError("current release pointer is unavailable");
  }

  if (!baseRef || /^0+$/.test(baseRef)) {
    const current = await fetchReleaseManifest({
      pointer: currentPointer,
      baseUrl: regionDataBaseUrl(baseUrl),
      label: "current",
    });
    return [...regionDistEntries(current).keys()].sort();
  }

  const base = validateReference(baseRef, "base");
  const previousPointer = pointerAtReference(base, "previous");
  if (!previousPointer) {
    return changedGitDatasets(base, head);
  }
  if (samePointer(previousPointer, currentPointer)) return [];

  const origin = regionDataBaseUrl(baseUrl);
  const [previous, current] = await Promise.all([
    fetchReleaseManifest({
      pointer: previousPointer,
      baseUrl: origin,
      label: "previous",
    }),
    fetchReleaseManifest({
      pointer: currentPointer,
      baseUrl: origin,
      label: "current",
    }),
  ]);
  return changedManifestDatasets(previous, current);
};

const main = async () => {
  const [baseRef, headRef = "HEAD", ...extra] = process.argv.slice(2);
  if (extra.length > 0) {
    throw new TypeError(
      "Usage: node list-changed-region-datasets.mjs [base-ref] [head-ref]",
    );
  }
  const datasets = await detectChangedDatasets({
    baseRef,
    headRef,
    baseUrl: process.env.REGION_DATA_BASE_URL,
  });
  process.stdout.write(`${datasets.join(",")}\n`);
};

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}

export { changedManifestDatasets, detectChangedDatasets };
