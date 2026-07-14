import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  decode,
  encode,
  findClosestRegion,
  findRegionByCodeOrName,
  findRegionsByQuery,
} from "../src/index.js";
import {
  calculateDistance,
  findClosestInRegions,
  toRadians,
  toRegionResult,
} from "../src/region-geometry.js";
import type { Region } from "../src/region-types.js";

const assertClose = (actual: number, expected: number, tolerance: number) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

describe("region fallback", () => {
  test("returns null when the supplied region collection is empty", () => {
    assert.equal(
      findClosestInRegions({ lat: 0, lng: 0 }, [], 2, "earth"),
      null,
    );
  });

  test("selects the closest region and exposes a public result", () => {
    const regions: Region[] = [
      {
        name: "Near",
        code: "NEAR",
        lat: 0,
        long: 1,
        population: 5_000,
        countryCode: "AA",
      },
      {
        name: "Far",
        code: "FAR",
        lat: 20,
        long: 20,
        population: 10_000,
        countryCode: "BB",
      },
    ];

    const closest = findClosestInRegions(
      { lat: 0, lng: 0 },
      regions,
      2,
      "moon",
    );

    assert.ok(closest);
    assert.equal(closest.name, "Near");
    assert.equal(closest.body, "moon");
    assert.equal(closest.regionLevel, 2);
    assert.equal(closest.population, 5_000);
    assert.equal(closest.countryCode, "AA");
    assert.ok((closest.distanceKm ?? Infinity) > 0);
    assert.deepEqual(toRegionResult(closest), {
      name: "Near",
      code: "NEAR",
      lat: 0,
      lng: 1,
      body: "moon",
      regionLevel: 2,
      distanceKm: closest.distanceKm,
      population: 5_000,
    });
  });

  test("prefers a nearby prominent city over a closer satellite", () => {
    const closest = findClosestInRegions(
      { lat: 37.5, lng: 127 },
      [
        {
          name: "Satellite",
          code: "SAT",
          lat: 37.5,
          long: 127.01,
          population: 200_000,
          countryCode: "KR",
        },
        {
          name: "Metropolis",
          code: "MET",
          lat: 37.5,
          long: 127.013,
          population: 5_000_000,
          countryCode: "KR",
        },
        {
          name: "Capital",
          code: "CAP",
          lat: 37.5,
          long: 127.014,
          population: 7_000_000,
          countryCode: "KR",
        },
      ],
      2,
      "earth",
    );

    assert.equal(closest?.name, "Capital");
  });

  test("keeps the closest region when prominent-city rules do not apply", () => {
    const closest = findClosestInRegions(
      { lat: 0, lng: 0 },
      [
        {
          name: "Closest",
          code: "CLOSE",
          lat: 0,
          long: 0.01,
          population: 900_000,
          countryCode: "AA",
        },
        {
          name: "Other country",
          code: "OTHER",
          lat: 0,
          long: 0.011,
          population: 9_000_000,
          countryCode: "BB",
        },
      ],
      2,
      "earth",
    );

    assert.equal(closest?.name, "Closest");
  });

  test("computes great-circle distances with the selected body radius", () => {
    assert.equal(toRadians(180), Math.PI);
    assert.equal(calculateDistance(0, 0, 0, 0), 0);
    assert.ok(calculateDistance(0, 0, 0, 1, "moon") > 0);
    assert.ok(
      calculateDistance(0, 0, 0, 1, "moon") <
        calculateDistance(0, 0, 0, 1, "earth"),
    );
  });

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

  test("prefers a nearby prominent city over a closer satellite city", async () => {
    const region = await findClosestRegion(
      { lat: 37.5125, lng: 127.1025 },
      { regionLevel: 2 },
    );

    assert.equal(region?.name, "Seoul");
    assert.equal((region as { regionLevel?: number } | null)?.regionLevel, 2);
    assert.ok((region?.distanceKm ?? Infinity) < 13);
  });

  test("includes country core city additions with disambiguated labels", async () => {
    const [valencia] = await findRegionsByQuery("Valencia ES", {
      regionLevel: 2,
      maxResults: 1,
    });

    assert.equal(valencia?.code, "2509954");
    assert.equal(valencia?.name, "Valencia ES");
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
