import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rename, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  directoryIdentity,
  runAnchoredMutation,
} from "./generate-release-anchored.mjs";

test("anchors mutation to the verified parent inode before mkdir", async () => {
  const root = await mkdtemp(join(tmpdir(), "region-anchor-"));
  try {
    const parent = join(root, "parent");
    const movedParent = join(root, "verified-parent");
    const outside = join(root, "outside");
    await Promise.all([mkdir(parent), mkdir(outside)]);
    const expectedIdentity = await directoryIdentity(parent, "test parent");

    await assert.rejects(
      runAnchoredMutation({
        cwd: parent,
        expectedIdentity,
        operation: { type: "mkdir", name: "release", mode: 0o700 },
        beforeSpawn: async () => {
          await rename(parent, movedParent);
          await symlink(outside, parent);
        },
      }),
      /identity|verified parent/i,
    );

    assert.deepEqual(await readdir(outside), []);
    assert.deepEqual(await readdir(movedParent), []);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
