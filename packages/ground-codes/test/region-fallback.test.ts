import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { decode, encode, findClosestRegion } from "../src/index.js";

const assertClose = (actual: number, expected: number, tolerance: number) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

describe("region fallback", () => {
  test("uses a region-1 code when the nearest region-2 point is too far away", async () => {
    const region = await findClosestRegion(
      { lat: -53, lng: -133 },
      { regionLevel: 2 },
    );

    assert.equal(region?.code, "PN");
    assert.equal((region as { regionLevel?: number } | null)?.regionLevel, 1);
  });

  test("keeps region-2 names when city data is nearby", async () => {
    const region = await findClosestRegion(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2 },
    );

    assert.equal((region as { regionLevel?: number } | null)?.regionLevel, 2);
    assert.equal(region?.name, "Seoul");
  });

  test("default encode/decode roundtrips region-1 fallback codes", async () => {
    const target = { lat: -53, lng: -133 };
    const encoded = await encode(target, { regionLevel: 2 });

    assert.match(encoded, /^PN-/);

    const decoded = await decode(encoded);
    assertClose(decoded.lat, target.lat, 0.0001);
    assertClose(decoded.lng, target.lng, 0.0001);
  });
});
