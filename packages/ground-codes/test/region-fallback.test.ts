import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  decode,
  encode,
  findClosestRegion,
  findRegionByCodeOrName,
} from "../src/index.js";

const assertClose = (actual: number, expected: number, tolerance: number) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

describe("region fallback", () => {
  test("uses a region-3 ocean label when it is the nearest sparse fallback", async () => {
    const region = await findClosestRegion(
      { lat: -53, lng: -133 },
      { regionLevel: 2 },
    );

    assert.match(region?.name ?? "", /^South Pacific \d+$/);
    assert.equal((region as { regionLevel?: number } | null)?.regionLevel, 3);
    assert.ok((region?.distanceKm ?? Infinity) < 160);
  });

  test("keeps region-2 names when city data is nearby", async () => {
    const region = await findClosestRegion(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2 },
    );

    assert.equal((region as { regionLevel?: number } | null)?.regionLevel, 2);
    assert.equal(region?.name, "Seoul");
  });

  test("default encode/decode roundtrips region-3 fallback labels", async () => {
    const target = { lat: -53, lng: -133 };
    const encoded = await encode(target, { regionLevel: 2 });

    assert.match(encoded, /^South Pacific \d+-/);

    const decoded = await decode(encoded);
    assertClose(decoded.lat, target.lat, 0.0001);
    assertClose(decoded.lng, target.lng, 0.0001);
  });

  test("matches legacy accented English region URL labels against ASCII data", async () => {
    const region = await findRegionByCodeOrName("Möllereisstrom", {
      regionLevel: 3,
      language: "english",
    });

    assert.equal(region?.name, "Mollereisstrom");
    assert.equal(region?.lat, -82);
    assert.equal(region?.lng, -63);
  });

  test("uses word-set encoding for region-1 when selected as a region-2 fallback", async () => {
    const target = { lat: 67.25, lng: -105.25 };
    const encoded = await encode(target, { regionLevel: 2 });

    assert.match(encoded, /^CGR3-/);
    assert.doesNotMatch(encoded, /^CGR3-[0-9A-V]+$/);

    const decoded = await decode(encoded);
    assertClose(decoded.lat, target.lat, 0.0001);
    assertClose(decoded.lng, target.lng, 0.0001);
  });

  test("keeps base32 encoding when region-1 is explicitly requested", async () => {
    const target = { lat: 67.25, lng: -105.25 };
    const encoded = await encode(target, { regionLevel: 1 });

    assert.match(encoded, /^CGR3-[0-9A-V]+$/);

    const decoded = await decode(encoded, { regionLevel: 1 });
    assertClose(decoded.lat, target.lat, 0.0001);
    assertClose(decoded.lng, target.lng, 0.0001);
  });
});
