import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { watch, writeFileSync } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
const modeOf = async (path) =>
  Number((await lstat(path, { bigint: true })).mode & 0o777n);

const assertSealedRelease = async (releaseDirectory, manifest) => {
  assert.equal(await modeOf(releaseDirectory), 0o555);
  assert.equal(await modeOf(join(releaseDirectory, "objects")), 0o555);
  assert.equal(await modeOf(join(releaseDirectory, "manifest.json")), 0o444);
  for (const entry of manifest.entries) {
    assert.equal(
      await modeOf(
        join(releaseDirectory, "objects", `${entry.sha256}.json.gz`),
      ),
      0o444,
    );
  }
};

describe("release activation transaction", () => {
  test("seals a promoted release before a filesystem watcher can change it", async () => {
    const fixture = await makeFixture();
    const manifest = await createManifest({ sourceRoot: fixture.sourceRoot });
    const releases = join(fixture.stagingRoot, "releases");
    await mkdir(releases, { recursive: true });
    let resolveMutation;
    const mutation = new Promise((resolve) => {
      resolveMutation = resolve;
    });
    const watcher = watch(releases, (_event, filename) => {
      if (String(filename) !== manifest.version) return;
      try {
        writeFileSync(
          join(
            releases,
            manifest.version,
            "objects",
            `${manifest.entries[0].sha256}.json.gz`,
          ),
          "EVIL",
        );
        resolveMutation({ error: null });
      } catch (error) {
        resolveMutation({ error });
      }
    });

    try {
      const generation = generateRelease(fixture);
      const mutationResult = await Promise.race([
        mutation,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("promotion watch timed out")),
            2_000,
          ),
        ),
      ]);
      const result = await generation;
      assert.match(mutationResult.error?.code ?? "", /EACCES|EPERM/);
      assert.equal(
        JSON.parse(await readFile(fixture.pointerPath)).version,
        result.version,
      );
      await assertSealedRelease(join(releases, manifest.version), manifest);
    } finally {
      watcher.close();
    }
  });

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
      /EACCES|EPERM|permission denied|read-only/i,
    );

    assert.equal(seamCalls, 1);
    await missing(fixture.pointerPath);
    await missing(
      join(fixture.stagingRoot, "releases", manifest.version, "manifest.json"),
    );
  });

  test("cleans an owned sealed private release after activation is rejected", async () => {
    const fixture = await makeFixture();
    const manifest = await createManifest({ sourceRoot: fixture.sourceRoot });

    await assert.rejects(
      generateReleaseInternal(fixture, {
        beforeActivation: async ({ releaseDirectory }) => {
          await assertSealedRelease(releaseDirectory, manifest);
          throw new Error("stop after sealed hook");
        },
      }),
      /stop after sealed hook/i,
    );

    assert.equal(
      (await readdir(join(fixture.stagingRoot, "releases"))).some((name) =>
        name.startsWith(".private-"),
      ),
      false,
    );
    await missing(fixture.pointerPath);
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
      "release-promoted",
      "releases-directory-fsync",
      "release-verified",
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
          await chmod(releaseDirectory, 0o700);
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
      "pointer-parent-directory-fsync",
    ]) {
      const fixture = await makeFixture();
      await assert.rejects(
        generateReleaseInternal(fixture, { failDurabilityPhase: phase }),
        new RegExp(`${phase}.*injected`, "i"),
      );
      await missing(fixture.pointerPath);
    }
  });

  test("restores the exact old pointer when activation readback fails", async () => {
    const fixture = await makeFixture();
    await generateRelease(fixture);
    const oldPointer = await readFile(fixture.pointerPath);
    const oldIdentity = await lstat(fixture.pointerPath, { bigint: true });
    await writeFile(
      join(fixture.sourceRoot, "region-dist", "a.json"),
      "changed-dist",
    );

    await assert.rejects(
      generateReleaseInternal(fixture, {
        failDurabilityPhase: "pointer-readback",
      }),
      /pointer-readback.*injected/i,
    );

    assert.deepEqual(await readFile(fixture.pointerPath), oldPointer);
    const restoredIdentity = await lstat(fixture.pointerPath, {
      bigint: true,
    });
    assert.equal(restoredIdentity.dev, oldIdentity.dev);
    assert.equal(restoredIdentity.ino, oldIdentity.ino);
  });

  test("reports activation indeterminate when pointer rollback cannot be made durable", async () => {
    const fixture = await makeFixture();

    await assert.rejects(
      generateReleaseInternal(fixture, {
        failDurabilityPhase: [
          "pointer-parent-directory-fsync",
          "pointer-rollback-parent-directory-fsync",
        ],
      }),
      /activation indeterminate.*pointer-rollback-parent-directory-fsync/i,
    );
    await missing(fixture.pointerPath);
  });

  test("rejects an existing unsealed release without repairing it", async () => {
    const fixture = await makeFixture();
    const first = await generateRelease(fixture);
    const manifestPath = join(
      fixture.stagingRoot,
      "releases",
      first.version,
      "manifest.json",
    );
    await chmod(manifestPath, 0o644);
    await rm(fixture.pointerPath);

    await assert.rejects(generateRelease(fixture), /sealed|mode|write bits/i);

    assert.equal(await modeOf(manifestPath), 0o644);
    await missing(fixture.pointerPath);
  });
});

test("public generation clears eval-only execArgv before forking", () => {
  const generator = new URL("./generate-release.mjs", import.meta.url).href;
  const cleaner = new URL("./test-cleanup.mjs", import.meta.url).href;
  const script = `
    if (process.env.GROUND_CODES_EVAL_CHILD === "1") process.exit(23);
    process.env.GROUND_CODES_EVAL_CHILD = "1";
    const { mkdir, mkdtemp, writeFile } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { generateRelease } = await import(${JSON.stringify(generator)});
    const { removeWritableTree } = await import(${JSON.stringify(cleaner)});
    const root = await mkdtemp(join(tmpdir(), "region-eval-"));
    try {
      const sourceRoot = join(root, "source");
      await mkdir(join(sourceRoot, "region-dist"), { recursive: true });
      await mkdir(join(sourceRoot, "region-db"), { recursive: true });
      await writeFile(join(sourceRoot, "region-dist", "a.json"), "dist");
      await writeFile(join(sourceRoot, "region-db", "a.index"), "db");
      await generateRelease({
        sourceRoot,
        stagingRoot: join(root, "staging"),
        pointerPath: join(root, "pointer.json"),
      });
    } finally {
      await removeWritableTree(root);
    }
  `;

  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8", timeout: 10_000 },
  );

  assert.equal(result.status, 0, result.stderr || result.error?.message);
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
