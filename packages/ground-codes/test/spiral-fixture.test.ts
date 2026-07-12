import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  clearSpiralCache,
  getCoordinates,
  getNFromCoordinates,
  isSpiralCacheEnabled,
  setSpiralCacheEnabled,
} from "../src/spiral.js";

type SpiralFixture = {
  count: number;
  coordinatesByN: Array<{ n: number; x: number; y: number }>;
  nByCoordinate: Array<{ x: number; y: number; n: number }>;
};

const dirname = fileURLToPath(new URL(".", import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(dirname, "fixtures", "spiral-10000.json"), "utf8"),
) as SpiralFixture;

describe("Grok Spiral compatibility fixture", () => {
  test("spiral cache is disabled by default and can be toggled explicitly", () => {
    clearSpiralCache();
    assert.equal(isSpiralCacheEnabled(), false);

    setSpiralCacheEnabled(true);
    assert.equal(isSpiralCacheEnabled(), true);

    setSpiralCacheEnabled(false);
    assert.equal(isSpiralCacheEnabled(), false);
  });

  test("getCoordinates returns the same first 10,000 outputs as the baseline algorithm", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();
    assert.equal(fixture.coordinatesByN.length, fixture.count);

    for (const expected of fixture.coordinatesByN) {
      assert.deepEqual(getCoordinates(expected.n), {
        x: expected.x,
        y: expected.y,
      });
    }
  });

  test("getNFromCoordinates returns the same outputs as the baseline algorithm", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();
    assert.equal(fixture.nByCoordinate.length, fixture.count);

    for (const expected of fixture.nByCoordinate) {
      assert.equal(getNFromCoordinates(expected.x, expected.y), expected.n);
    }
  });

  test("BigInt inputs preserve number-compatible outputs in the fixture range", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    for (const expected of fixture.coordinatesByN) {
      assert.deepEqual(getCoordinates(BigInt(expected.n)), {
        x: BigInt(expected.x),
        y: BigInt(expected.y),
      });
    }

    for (const expected of fixture.nByCoordinate) {
      assert.equal(
        getNFromCoordinates(BigInt(expected.x), BigInt(expected.y)),
        BigInt(expected.n),
      );
    }
  });

  test("unsafe number coordinates automatically return a BigInt index", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    const automaticValue = getNFromCoordinates(100_000_000, -1);
    const explicitValue = getNFromCoordinates(100_000_000n, -1n);

    assert.equal(typeof automaticValue, "bigint");
    assert.equal(automaticValue, explicitValue);
  });

  test("large BigInt n roundtrips through exact shell scan path", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    const n = 98_765_432_101_234_567n;
    const coordinates = getCoordinates(n);

    assert.deepEqual(coordinates, {
      x: 73_056_129n,
      y: 161_557_468n,
    });
    assert.equal(getNFromCoordinates(coordinates.x, coordinates.y), n);
  });

  test("large safe number n uses optimized search while preserving number output", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    const n = 1_234_567_890_123_456;
    const numberCoordinates = getCoordinates(n);
    const bigintCoordinates = getCoordinates(BigInt(n));

    assert.equal(typeof numberCoordinates.x, "number");
    assert.equal(typeof numberCoordinates.y, "number");
    assert.deepEqual(numberCoordinates, {
      x: Number(bigintCoordinates.x),
      y: Number(bigintCoordinates.y),
    });
  });

  test("large unsafe integer number n uses optimized search for the represented value", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    const n = 9_467_177_351_936_700;
    const numberCoordinates = getCoordinates(n);
    const bigintCoordinates = getCoordinates(BigInt(n));

    assert.equal(typeof numberCoordinates.x, "number");
    assert.equal(typeof numberCoordinates.y, "number");
    assert.deepEqual(numberCoordinates, {
      x: Number(bigintCoordinates.x),
      y: Number(bigintCoordinates.y),
    });
  });

  test("large number coordinates preserve exact BigInt indexes", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    assert.equal(
      getNFromCoordinates(-2_742_364_216, 3_368_918_423),
      59_282_396_347_346_210_502n,
    );
    assert.equal(
      getNFromCoordinates(8_462_522_219, 8_256_445_255),
      439_141_781_713_843_920_926n,
    );
    assert.equal(
      getNFromCoordinates(4_941_966_020, 3_234_148_727),
      109_587_378_982_785_380_307n,
    );
    assert.equal(
      getNFromCoordinates(9_113_563_565, -8_232_229_350),
      473_835_867_093_396_624_363n,
    );
  });

  test("11 digit BigInt coordinates preserve exact indexes", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    assert.equal(
      getNFromCoordinates(-64_791_796_609n, 57_777_086_992n),
      23_675_572_189_899_908_565_477n,
    );
  });

  test("global 3mm scale coordinates roundtrip through a 21 digit index", () => {
    setSpiralCacheEnabled(false);
    clearSpiralCache();

    const coordinates = { x: 3_335_847_799n, y: 6_671_695_599n };
    const n = getNFromCoordinates(coordinates.x, coordinates.y);

    assert.equal(n, 174_796_338_784_410_565_457n);
    assert.deepEqual(getCoordinates(n), coordinates);
  });
});
