import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { generateReleaseInternal } from "./generate-release-internal.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const makeFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "region-lease-"));
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

const leasePath = (fixture) => join(fixture.stagingRoot, ".generate-lease");
const writeLease = async (fixture, pid, token = crypto.randomUUID()) => {
  await mkdir(fixture.stagingRoot, { recursive: true });
  await writeFile(leasePath(fixture), JSON.stringify({ pid, token }));
};

describe("exclusive generation lease", () => {
  test("rejects a concurrent lease owned by a live process", async () => {
    const fixture = await makeFixture();
    await writeLease(fixture, process.pid);

    await assert.rejects(
      generateReleaseInternal(fixture),
      /generation lease.*live process/i,
    );
    assert.equal(
      JSON.parse(await readFile(leasePath(fixture))).pid,
      process.pid,
    );
    await assert.rejects(readFile(fixture.pointerPath), /ENOENT/);
  });

  test("holds a live lease across the whole concurrent generation", async () => {
    const fixture = await makeFixture();
    let signalAcquired;
    const acquired = new Promise((resolve) => (signalAcquired = resolve));
    let releaseFirst;
    const hold = new Promise((resolve) => (releaseFirst = resolve));
    const first = generateReleaseInternal(fixture, {
      afterLeaseAcquired: async () => {
        signalAcquired();
        await hold;
      },
    });
    await Promise.race([
      acquired,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("lease acquisition hook timed out")),
          1000,
        ),
      ),
    ]);

    await assert.rejects(
      generateReleaseInternal(fixture),
      /generation lease.*live process/i,
    );
    releaseFirst();
    await first;
    await assert.rejects(lstat(leasePath(fixture)), /ENOENT/);
  });

  test("recovers a stale lease and only validated private orphan directories", async () => {
    const fixture = await makeFixture();
    const releases = join(fixture.stagingRoot, "releases");
    const stalePrivate = `.private-${crypto.randomUUID()}`;
    const unknownPrivate = ".private-not-a-uuid";
    const symlinkPrivate = `.private-${crypto.randomUUID()}`;
    const outside = join(fixture.root, "outside");
    await Promise.all([
      mkdir(join(releases, stalePrivate), { recursive: true }),
      mkdir(join(releases, unknownPrivate), { recursive: true }),
      mkdir(outside),
    ]);
    await symlink(outside, join(releases, symlinkPrivate));
    await writeLease(fixture, 2_147_483_647, crypto.randomUUID());
    let acquiredOwner;

    await generateReleaseInternal(fixture, {
      leasePid: process.pid,
      afterLeaseAcquired: (owner) => (acquiredOwner = owner),
    });

    assert.equal(acquiredOwner.pid, process.pid);
    const names = await readdir(releases);
    assert.equal(names.includes(stalePrivate), false);
    assert.equal(names.includes(unknownPrivate), true);
    assert.equal(names.includes(symlinkPrivate), true);
    assert.equal(
      (await lstat(join(releases, symlinkPrivate))).isSymbolicLink(),
      true,
    );
    await assert.rejects(lstat(leasePath(fixture)), /ENOENT/);
  });

  test("surfaces an owned lease cleanup failure", async () => {
    const fixture = await makeFixture();

    await assert.rejects(
      generateReleaseInternal(fixture, {
        beforeLeaseRelease: async () => {
          await writeFile(leasePath(fixture), "replaced");
        },
      }),
      /generation lease.*cleanup|generation lease.*regular|lease.*changed/i,
    );
    assert.equal(await readFile(leasePath(fixture), "utf8"), "replaced");
  });
});
