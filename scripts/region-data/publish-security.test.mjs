import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  createR2ClientFromEnvironment,
  formatPublishResult,
  R2_REGION_DATA_BUCKET,
} from "./publish.mjs";

const ENVIRONMENT = {
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  R2_REGION_DATA_ACCESS_KEY_ID: "access-key",
  R2_REGION_DATA_SECRET_ACCESS_KEY: "secret-key",
};

test("constructs the exact R2 client only after every credential is present", () => {
  const configurations = [];
  class RecordingClient {
    constructor(configuration) {
      configurations.push(configuration);
    }
  }

  const configured = createR2ClientFromEnvironment(
    ENVIRONMENT,
    RecordingClient,
  );
  assert.equal(R2_REGION_DATA_BUCKET, "ground-codes-region-data");
  assert.ok(configured.client instanceof RecordingClient);
  assert.equal(configured.bucket, R2_REGION_DATA_BUCKET);
  assert.deepEqual(configurations, [
    {
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      region: "auto",
      credentials: {
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
      },
    },
  ]);

  for (const missing of Object.keys(ENVIRONMENT)) {
    configurations.length = 0;
    assert.throws(
      () =>
        createR2ClientFromEnvironment(
          { ...ENVIRONMENT, [missing]: "" },
          RecordingClient,
        ),
      new RegExp(missing),
    );
    assert.deepEqual(configurations, []);
  }
});

const runPublisher = (environment) =>
  new Promise((resolve, reject) => {
    const script = fileURLToPath(
      new URL("../publish-region-data.mjs", import.meta.url),
    );
    const child = spawn(
      process.execPath,
      [script, "--staging", ".staging", "--pointer", "pointer.json"],
      {
        cwd: dirname(script),
        env: environment,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr, stdout }));
  });

test("keeps credentials out of CLI output and records the exact root command", async () => {
  const account = "account-credential-sentinel";
  const accessKey = "access-credential-sentinel";
  const result = await runPublisher({
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: account,
    R2_REGION_DATA_ACCESS_KEY_ID: accessKey,
    R2_REGION_DATA_SECRET_ACCESS_KEY: "",
  });

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /missing R2 credentials/i);
  assert.equal(`${result.stdout}${result.stderr}`.includes(account), false);
  assert.equal(`${result.stdout}${result.stderr}`.includes(accessKey), false);

  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );
  assert.equal(
    packageJson.scripts["region-data:publish"],
    "node scripts/publish-region-data.mjs --staging .region-data-staging --pointer packages/geoint/region-data-release.json",
  );
});

test("formats only approved publication fields", () => {
  const output = formatPublishResult({
    version: `sha256-${"a".repeat(64)}`,
    objectCount: 2,
    uploadedObjects: 1,
    skippedObjects: 1,
    uploadedBytes: 123,
    manifestUploaded: false,
    uploadedObjectKeys: [
      `releases/sha256-${"a".repeat(64)}/objects/${"b".repeat(64)}.json.gz`,
    ],
    secretAccessKey: "credential-must-never-print",
  });

  assert.equal(
    output,
    `published version=sha256-${"a".repeat(64)} objects=2 uploaded=1 skipped=1 bytes=123 manifest_uploaded=0\nobject releases/sha256-${"a".repeat(64)}/objects/${"b".repeat(64)}.json.gz`,
  );
  assert.equal(output.includes("credential-must-never-print"), false);
});
