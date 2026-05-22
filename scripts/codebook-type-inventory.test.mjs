import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildTypeInventory } from "./codebook-type-inventory.mjs";

describe("codebook type inventory", () => {
  test("classifies Portuguese standalone words without suffix false positives", () => {
    const portuguese = buildTypeInventory().find(
      (row) => row.language === "portuguese",
    );

    assert.ok(portuguese);
    assert.ok(portuguese.counts.shortStandalone > 0);
    assert.equal(
      portuguese.examples.recognizedCompound.includes("Hortela"),
      false,
    );
  });

  test("classifies Indonesian standalone and generated entries", () => {
    const indonesian = buildTypeInventory().find(
      (row) => row.language === "indonesian",
    );

    assert.ok(indonesian);
    assert.ok(indonesian.counts.shortStandalone > 0);
    assert.ok(indonesian.counts.recognizedCompound > 0);
    assert.ok(indonesian.counts.otherStandalone >= 650);
    assert.ok(indonesian.counts.recognizedCompound <= 4300);
  });
});
