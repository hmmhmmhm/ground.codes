import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { enumerateManagedFiles } from "./manifest-filesystem.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const makeTemporaryDirectory = async (prefix = "region-manifest-") => {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
};

const makeTree = async (files) => {
  const root = await makeTemporaryDirectory();
  await Promise.all([
    mkdir(join(root, "region-dist"), { recursive: true }),
    mkdir(join(root, "region-db"), { recursive: true }),
  ]);
  for (const [relativePath, contents] of Object.entries(files)) {
    const destination = join(root, ...relativePath.split("/"));
    await mkdir(join(destination, ".."), { recursive: true });
    await writeFile(destination, contents);
  }
  return root;
};

const makeBasicTree = () =>
  makeTree({
    "region-db/sample.index": Buffer.from("index"),
    "region-dist/sample.json": Buffer.from("json"),
  });

const enumerate = async (root, hooks = {}) => {
  const files = [];
  await enumerateManagedFiles({
    root,
    ...hooks,
    onFile: (file) => files.push(file),
  });
  return files;
};

describe("manifest filesystem boundaries", () => {
  test("rejects a regular file replaced by an external symlink after lstat", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("inside"),
    });
    const outsideRoot = await makeTemporaryDirectory(
      "region-manifest-outside-",
    );
    const outsideFile = join(outsideRoot, "outside.json");
    await writeFile(outsideFile, "outside");
    const victim = join(root, "region-dist/sample.json");

    await assert.rejects(
      enumerate(root, {
        beforeFileOpen: async ({ logicalPath }) => {
          if (logicalPath !== "packages/geoint/region-dist/sample.json") return;
          await rm(victim);
          await symlink(outsideFile, victim);
        },
      }),
      /changed|containment|regular file|symlink/i,
    );
  });

  test("rejects sourceRoot replacement after directory enumeration", async () => {
    const root = await makeBasicTree();
    const replacementRoot = await makeBasicTree();
    const linkContainer = await makeTemporaryDirectory("region-root-swap-");
    const prebuiltLink = join(linkContainer, "replacement");
    await symlink(replacementRoot, prebuiltLink, "dir");
    const preservedRoot = `${root}-preserved`;
    temporaryDirectories.push(preservedRoot);
    let removal;

    await assert.rejects(
      enumerate(root, {
        beforeFileOpen: async () => {
          removal ??= rename(root, preservedRoot);
          await removal;
          await rename(prebuiltLink, root);
        },
      }),
      (error) => {
        assert.equal(error.constructor, TypeError);
        assert.equal(
          error.message,
          "sourceRoot changed during manifest generation",
        );
        return true;
      },
    );
  });

  test("rejects a managed group replaced immediately before readdir", async () => {
    const root = await makeBasicTree();
    const emptyExternal = await makeTemporaryDirectory("region-empty-group-");
    const linkContainer = await makeTemporaryDirectory("region-group-swap-");
    const prebuiltLink = join(linkContainer, "replacement");
    await symlink(emptyExternal, prebuiltLink, "dir");
    const groupPath = join(root, "region-dist");
    const preservedGroup = join(root, "preserved-region-dist");

    await assert.rejects(
      enumerate(root, {
        beforeDirectoryRead: async ({ group, relativeDirectory }) => {
          if (group !== "region-dist" || relativeDirectory.length !== 0) return;
          await rename(groupPath, preservedGroup);
          await rename(prebuiltLink, groupPath);
        },
      }),
      /region-dist directory.*changed/i,
    );
  });

  test("rejects persistent directory entry mutation during enumeration", async () => {
    const root = await makeBasicTree();
    const lateFile = join(root, "region-dist/late.json");

    await assert.rejects(
      enumerate(root, {
        beforeFileOpen: async ({ logicalPath }) => {
          if (logicalPath !== "packages/geoint/region-dist/sample.json") return;
          await writeFile(lateFile, "late");
        },
      }),
      /region-dist directory.*changed/i,
    );
  });

  test("rejects a symlink or non-directory sourceRoot before enumeration", async () => {
    const targetRoot = await makeBasicTree();
    const linkContainer = await makeTemporaryDirectory("region-manifest-link-");
    const linkedRoot = join(linkContainer, "geoint");
    await symlink(targetRoot, linkedRoot, "dir");
    await assert.rejects(enumerate(linkedRoot), /sourceRoot.*symlink/i);

    const fileContainer = await makeTemporaryDirectory("region-manifest-file-");
    const fileRoot = join(fileContainer, "geoint");
    await writeFile(fileRoot, "not a directory");
    await assert.rejects(enumerate(fileRoot), /sourceRoot.*directory/i);
  });

  test("rejects managed-root and nested-directory symlinks", async () => {
    const groupLinkRoot = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
    });
    await rm(join(groupLinkRoot, "region-dist"), { recursive: true });
    await symlink(
      join(groupLinkRoot, "region-db"),
      join(groupLinkRoot, "region-dist"),
      "dir",
    );
    await assert.rejects(
      enumerate(groupLinkRoot),
      /region-dist.*directory|symlink/i,
    );

    const nestedLinkRoot = await makeBasicTree();
    await symlink(
      join(nestedLinkRoot, "region-db"),
      join(nestedLinkRoot, "region-dist/nested"),
      "dir",
    );
    await assert.rejects(enumerate(nestedLinkRoot), /nested.*symlink/i);
  });

  test("rejects symlinks and non-regular filesystem entries", async () => {
    const symlinkRoot = await makeBasicTree();
    await symlink(
      join(symlinkRoot, "region-db/sample.index"),
      join(symlinkRoot, "region-dist/link.json"),
    );
    await assert.rejects(enumerate(symlinkRoot), /regular file|symlink/i);

    const socketRoot = await makeBasicTree();
    const socketPath = join(socketRoot, "region-db/service.sock");
    const server = createServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });
    try {
      await assert.rejects(enumerate(socketRoot), /regular file|socket/i);
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
