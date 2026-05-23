import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const readRows = (relativePath) =>
  JSON.parse(readFileSync(join(root, relativePath), "utf8"));

const reviewedLabels = [
  ["packages/geoint/region-dist/region-3-hindi.json", "OCN0", "रॉस सागर 1"],
  ["packages/geoint/region-dist/region-3-thai.json", "OCN0", "ทะเลรอสส์ 1"],
  ["packages/geoint/region-dist/region-3-german.json", "OCN0", "Rossmeer 1"],
  ["packages/geoint/region-dist/region-3-portuguese.json", "OCN0", "Mar de Ross 1"],
];

describe("region label quality audit", () => {
  test("keeps reviewed multilingual ocean labels stable", () => {
    for (const [dataset, code, expectedName] of reviewedLabels) {
      const row = readRows(dataset).find((candidate) => candidate.code === code);

      assert.equal(row?.name, expectedName, `${dataset}:${code}`);
    }
  });

  test("keeps non-Latin reviewed region datasets free of URL separators", () => {
    for (const dataset of [
      "packages/geoint/region-dist/region-2-hindi.json",
      "packages/geoint/region-dist/region-3-hindi.json",
      "packages/geoint/region-dist/region-2-thai.json",
      "packages/geoint/region-dist/region-3-thai.json",
      "packages/geoint/region-dist/region-3-japanese.json",
      "packages/geoint/region-dist/region-3-chinese.json",
    ]) {
      const unsafe = readRows(dataset)
        .filter((row) => /[-/#?]/.test(row.name))
        .slice(0, 10);

      assert.deepEqual(unsafe, [], dataset);
    }
  });
});
