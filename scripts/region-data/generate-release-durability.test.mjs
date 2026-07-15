import assert from "node:assert/strict";
import { test } from "node:test";

import { fsyncDirectory } from "./generate-release-durability.mjs";

test("closes the directory descriptor after a successful fsync", () => {
  const calls = [];
  fsyncDirectory("ignored", "directory-fsync", {
    open: () => {
      calls.push("open");
      return 17;
    },
    fsync: (descriptor) => calls.push(`fsync:${descriptor}`),
    close: (descriptor) => calls.push(`close:${descriptor}`),
  });
  assert.deepEqual(calls, ["open", "fsync:17", "close:17"]);
});

test("closes the directory descriptor when fsync fails", () => {
  const calls = [];
  assert.throws(
    () =>
      fsyncDirectory("ignored", "directory-fsync", {
        open: () => {
          calls.push("open");
          return 19;
        },
        fsync: () => {
          calls.push("fsync");
          throw new Error("fsync failed");
        },
        close: (descriptor) => calls.push(`close:${descriptor}`),
      }),
    /fsync failed/,
  );
  assert.deepEqual(calls, ["open", "fsync", "close:19"]);
});
