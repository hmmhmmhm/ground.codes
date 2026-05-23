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
    assert.ok(indonesian.counts.otherStandalone >= 950);
    assert.ok(indonesian.counts.recognizedCompound <= 4000);
  });

  test("classifies Thai script standalone and compound entries", () => {
    const thai = buildTypeInventory().find((row) => row.language === "thai");

    assert.ok(thai);
    assert.ok(thai.counts.shortStandalone > 0);
    assert.ok(thai.counts.recognizedCompound > 0);
    assert.ok(thai.counts.otherStandalone > thai.counts.recognizedCompound);
  });

  test("classifies Vietnamese standalone and fused compound entries", () => {
    const vietnamese = buildTypeInventory().find(
      (row) => row.language === "vietnamese",
    );

    assert.ok(vietnamese);
    assert.ok(vietnamese.counts.shortStandalone > 0);
    assert.ok(vietnamese.counts.recognizedCompound > 0);
    assert.ok(vietnamese.counts.otherStandalone > 0);
  });

  test("classifies Hindi standalone and Devanagari compound entries", () => {
    const hindi = buildTypeInventory().find((row) => row.language === "hindi");

    assert.ok(hindi);
    assert.ok(hindi.counts.shortStandalone > 0);
    assert.ok(hindi.counts.recognizedCompound > 0);
    assert.ok(hindi.counts.otherStandalone > 0);
  });

  test("classifies Arabic standalone and Arabic-script compound entries", () => {
    const arabic = buildTypeInventory().find(
      (row) => row.language === "arabic",
    );

    assert.ok(arabic);
    assert.ok(arabic.counts.shortStandalone > 0);
    assert.ok(arabic.counts.recognizedCompound > 0);
    assert.ok(arabic.counts.otherStandalone > 0);
  });
});
