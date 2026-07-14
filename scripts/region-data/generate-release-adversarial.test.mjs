import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { generateRelease } from "./generate-release.mjs";
import { generateReleaseInternal } from "./generate-release-internal.mjs";
import { createManifest } from "./manifest.mjs";
import { removeWritableTree } from "./test-cleanup.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => removeWritableTree(directory)),
  );
});

const makeFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "region-adversarial-"));
  temporaryDirectories.push(root);
  const sourceRoot = join(root, "source");
  await Promise.all(
    ["region-dist", "region-db"].map((group) =>
      mkdir(join(sourceRoot, group), { recursive: true }),
    ),
  );
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

const releasePath = (fixture, version) =>
  join(fixture.stagingRoot, "releases", version);

describe("adversarial immutable release generation", () => {
  test("rejects a pointer inside either managed source group before writing", async () => {
    const fixture = await makeFixture();
    for (const group of ["region-dist", "region-db"]) {
      const groupRoot = join(fixture.sourceRoot, group);
      for (const pointerPath of [groupRoot, join(groupRoot, "pointer.json")]) {
        await assert.rejects(
          generateRelease({ ...fixture, pointerPath }),
          /release pointer must not overlap a managed source group/i,
        );
        if (pointerPath !== groupRoot) {
          await assert.rejects(readFile(pointerPath), /ENOENT/);
        }
        await assert.rejects(readFile(fixture.stagingRoot), /ENOENT|EISDIR/);
      }
    }
  });

  test("allows the approved pointer beside, but not inside, managed groups", async () => {
    const fixture = await makeFixture();
    fixture.pointerPath = join(fixture.sourceRoot, "region-data-release.json");

    const first = await generateRelease(fixture);
    const second = await generateRelease(fixture);

    assert.equal(second.version, first.version);
    assert.equal(second.createdObjects, 0);
    assert.equal(
      JSON.parse(await readFile(fixture.pointerPath)).version,
      first.version,
    );
  });

  test("detects an object changed after private object construction before manifest write", async () => {
    const fixture = await makeFixture();
    const manifest = await createManifest({ sourceRoot: fixture.sourceRoot });
    await assert.rejects(
      generateReleaseInternal(fixture, {
        afterObjectTreeReady: async ({ objectDirectory }) => {
          const object = join(
            objectDirectory,
            `${manifest.entries[0].sha256}.json.gz`,
          );
          await writeFile(object, "EVIL");
        },
      }),
      /object.*integrity|conflicting/i,
    );

    await assert.rejects(
      readFile(join(releasePath(fixture, manifest.version), "manifest.json")),
      /ENOENT/,
    );
    await assert.rejects(readFile(fixture.pointerPath), /ENOENT/);
  });

  test("re-verifies an existing release after an ABA seam before pointer success", async () => {
    const fixture = await makeFixture();
    const result = await generateRelease(fixture);
    const releaseDirectory = releasePath(fixture, result.version);
    const manifest = JSON.parse(
      await readFile(join(releaseDirectory, "manifest.json"), "utf8"),
    );
    await rm(fixture.pointerPath);

    await assert.rejects(
      generateReleaseInternal(fixture, {
        afterReleaseVerification: async () => {
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
      /EACCES|EPERM|permission denied|read-only/i,
    );
    await assert.rejects(readFile(fixture.pointerPath), /ENOENT/);
  });

  test("rejects extra files in an existing release without deleting them", async () => {
    const fixture = await makeFixture();
    const result = await generateRelease(fixture);
    const extra = join(
      releasePath(fixture, result.version),
      "objects",
      "extra.json.gz",
    );
    await chmod(dirname(extra), 0o700);
    await writeFile(extra, "extra");
    await chmod(extra, 0o444);
    await chmod(dirname(extra), 0o555);
    await rm(fixture.pointerPath);

    await assert.rejects(
      generateRelease(fixture),
      /extra|object set|immutable/i,
    );
    assert.equal(await readFile(extra, "utf8"), "extra");
    await assert.rejects(readFile(fixture.pointerPath), /ENOENT/);
  });
});
