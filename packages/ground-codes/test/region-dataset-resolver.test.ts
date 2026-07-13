import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getRegionDatasetName } from "../src/region-dataset.js";

describe("region dataset resolver", () => {
  test("resolves Earth, Moon, and Mars dataset names", () => {
    assert.equal(
      getRegionDatasetName({
        body: "earth",
        regionLevel: 1,
        language: "korean",
      }),
      "region-1",
    );
    assert.equal(
      getRegionDatasetName({
        body: "earth",
        regionLevel: 2,
        language: "korean",
      }),
      "region-2-korean",
    );
    assert.equal(
      getRegionDatasetName({
        body: "earth",
        regionLevel: 3,
        language: "english",
      }),
      "region-3",
    );
    assert.equal(
      getRegionDatasetName({
        body: "moon",
        regionLevel: 2,
        language: "swahili",
      }),
      "region-2-moon-swahili",
    );
    assert.equal(
      getRegionDatasetName({
        body: "mars",
        regionLevel: 3,
        language: "cantonese",
      }),
      "region-3-mars-cantonese",
    );
  });

  test("rejects unsupported body levels and languages", () => {
    assert.throws(
      () =>
        getRegionDatasetName({
          body: "moon",
          regionLevel: 3,
          language: "english",
        }),
      /Moon supports region level 2/,
    );
    assert.throws(
      () =>
        getRegionDatasetName({
          body: "mars",
          regionLevel: 1,
          language: "english",
        }),
      /Mars supports region levels 2 and 3/,
    );
    assert.throws(
      () =>
        getRegionDatasetName({
          body: "earth",
          regionLevel: 2,
          language: "not-supported" as never,
        }),
      /Invalid language: not-supported/,
    );
  });
});
