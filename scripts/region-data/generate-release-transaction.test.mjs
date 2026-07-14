import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { generateReleaseInternal } from "./generate-release-internal.mjs";
import { createManifest } from "./manifest.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const makeFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "region-transaction-"));
  temporaryDirectories.push(root);
  const sourceRoot = join(root, "source");
  await Promise.all([
    mkdir(join(sourceRoot, "region-dist"), { recursive: true }),
    mkdir(join(sourceRoot, "region-db"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(sourceRoot, "region-dist", "a.json"), "dist"),
    writeFile(join(sourceRoot, "region-db", "a.index"), "db"),
  ]);
  return {
    root,
    sourceRoot,
    stagingRoot: join(root, "staging"),
    pointerPath: join(root, "region-data-release.json"),
  };
};

const missing = (path) => assert.rejects(readFile(path), /ENOENT/);

describe("release activation transaction", () => {
  test("re-verifies a mutation at the former verify-worker-close gap before activation", async () => {
    const fixture = await makeFixture();
    const manifest = await createManifest({ sourceRoot: fixture.sourceRoot });
    let seamCalls = 0;

    await assert.rejects(
      generateReleaseInternal(fixture, {
        beforeActivation: async ({ releaseDirectory }) => {
          seamCalls += 1;
          await writeFile(
            join(
              releaseDirectory,
              "objects",
              `${manifest.entries[0].sha256}.json.gz`,
            ),
            "EVIL",
          );
        },
      }),
      /object.*integrity|conflicting/i,
    );

    assert.equal(seamCalls, 1);
    await missing(fixture.pointerPath);
    await missing(
      join(fixture.stagingRoot, "releases", manifest.version, "manifest.json"),
    );
  });

  test("records durable ordering through pointer-parent fsync", async () => {
    const fixture = await makeFixture();
    const events = [];

    await generateReleaseInternal(fixture, {
      onDurabilityEvent: (event) => events.push(event),
    });

    assert.deepEqual(events, [
      "objects-written",
      "objects-directory-fsync",
      "manifest-written",
      "private-release-directory-fsync",
      "release-verified",
      "release-promoted",
      "releases-directory-fsync",
      "pointer-renamed",
      "pointer-parent-directory-fsync",
    ]);
  });

  test("rechecks the final release entry identity from the anchored transaction", async () => {
    const fixture = await makeFixture();
    const first = await generateReleaseInternal(fixture);
    const releaseDirectory = join(
      fixture.stagingRoot,
      "releases",
      first.version,
    );
    const movedRelease = `${releaseDirectory}-moved`;
    await rm(fixture.pointerPath);

    await assert.rejects(
      generateReleaseInternal(fixture, {
        beforeActivation: async () => {
          await rename(releaseDirectory, movedRelease);
          await symlink(movedRelease, releaseDirectory);
        },
      }),
      /final release entry identity changed before activation/i,
    );

    assert.equal((await lstat(releaseDirectory)).isSymbolicLink(), true);
    await missing(fixture.pointerPath);
  });

  test("does not activate a pointer when a required directory fsync fails", async () => {
    for (const phase of [
      "objects-directory-fsync",
      "releases-directory-fsync",
    ]) {
      const fixture = await makeFixture();
      await assert.rejects(
        generateReleaseInternal(fixture, { failDurabilityPhase: phase }),
        new RegExp(`${phase}.*injected`, "i"),
      );
      await missing(fixture.pointerPath);
    }
  });
});

describe("release generation pass budget", () => {
  test("uses two gzip source passes and at most two object read passes for a new release", async () => {
    const fixture = await makeFixture();
    let summary;

    await generateReleaseInternal(fixture, {
      onPerformance: (value) => (summary = value),
    });

    assert.deepEqual(summary, {
      mode: "new",
      gzipSourcePasses: 2,
      compressedObjectReadPasses: 2,
    });
  });

  test("uses two gzip source passes and one object read pass for an existing release", async () => {
    const fixture = await makeFixture();
    await generateReleaseInternal(fixture);
    let summary;

    await generateReleaseInternal(fixture, {
      onPerformance: (value) => (summary = value),
    });

    assert.deepEqual(summary, {
      mode: "existing",
      gzipSourcePasses: 2,
      compressedObjectReadPasses: 1,
    });
  });
});
