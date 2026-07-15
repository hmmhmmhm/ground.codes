import assert from "node:assert/strict";
import { test } from "node:test";

import { assertSupportedNodeMajor } from "./manifest-compressor.mjs";

test("executes unsupported compressor runtime branches in Node 22 CI", () => {
  assert.doesNotThrow(() => assertSupportedNodeMajor("22.23.1"));
  for (const version of ["21.7.3", "24.18.0", "25.9.0"]) {
    assert.throws(() => assertSupportedNodeMajor(version), /requires Node 22/i);
  }
});
