import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  decode,
  encode,
  findClosestRegion,
  findRegionsByQuery,
  getBodyMetersPerDegree,
} from "../src/index.js";

import marsRegions from "@ground-codes/geoint/region-dist/region-2-mars.json";
import marsKoreanRegions from "@ground-codes/geoint/region-dist/region-2-mars-korean.json";
import marsFallbackKoreanRegions from "@ground-codes/geoint/region-dist/region-3-mars-korean.json";
import marsFallbackChineseRegions from "@ground-codes/geoint/region-dist/region-3-mars-chinese.json";
import marsFallbackJapaneseRegions from "@ground-codes/geoint/region-dist/region-3-mars-japanese.json";
import moonKoreanRegions from "@ground-codes/geoint/region-dist/region-2-moon-korean.json";
import moonChineseRegions from "@ground-codes/geoint/region-dist/region-2-moon-chinese.json";
import moonJapaneseRegions from "@ground-codes/geoint/region-dist/region-2-moon-japanese.json";
import marsChineseRegions from "@ground-codes/geoint/region-dist/region-2-mars-chinese.json";
import marsJapaneseRegions from "@ground-codes/geoint/region-dist/region-2-mars-japanese.json";

const assertClose = (actual: number, expected: number, tolerance: number) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

const assertNoLatinNames = (rows: { name: string }[]) => {
  const latinNames = rows.filter((row) => /[A-Za-z]/.test(row.name));
  assert.deepEqual(
    latinNames.slice(0, 10).map((row) => row.name),
    [],
  );
};

describe("celestial bodies", () => {
  test("keeps planetary localized datasets unique", () => {
    const assertUniqueNames = (rows: { name: string }[]) => {
      assert.equal(
        new Set(rows.map((row) => row.name.toLowerCase())).size,
        rows.length,
      );
    };

    assert.equal(
      marsRegions.filter((region) => region.name === "Bohar").length,
      1,
    );
    assertUniqueNames(moonKoreanRegions);
    assertUniqueNames(moonChineseRegions);
    assertUniqueNames(moonJapaneseRegions);
    assertUniqueNames(marsKoreanRegions);
    assertUniqueNames(marsChineseRegions);
    assertUniqueNames(marsJapaneseRegions);
    assertUniqueNames(marsFallbackKoreanRegions);
    assertUniqueNames(marsFallbackChineseRegions);
    assertUniqueNames(marsFallbackJapaneseRegions);
    assertNoLatinNames(moonKoreanRegions);
    assertNoLatinNames(marsKoreanRegions);
    assertNoLatinNames(marsFallbackKoreanRegions);
    assertNoLatinNames(moonChineseRegions);
    assertNoLatinNames(marsChineseRegions);
    assertNoLatinNames(marsFallbackChineseRegions);
  });

  test("keeps earth as the default body", async () => {
    const target = { lat: 37.566, lng: 126.978 };

    const defaultEncoded = await encode(target, { regionLevel: 2 });
    const earthEncoded = await encode(target, {
      regionLevel: 2,
      body: "earth",
    });

    assert.equal(defaultEncoded, earthEncoded);
  });

  test("keeps ASCII-normalized English earth labels usable in codes and search", async () => {
    const target = { lat: -82, lng: -63 };

    const encoded = await encode(target, {
      regionLevel: 2,
      language: "english",
      body: "earth",
    });
    assert.equal(encoded, "Mollereisstrom-Alder");

    const decoded = await decode(encoded, {
      regionLevel: 2,
      language: "english",
      body: "earth",
    });
    assertClose(decoded.lat, target.lat, 0.0002);
    assertClose(decoded.lng, target.lng, 0.0002);

    const matches = await findRegionsByQuery("Mollereisstrom", {
      regionLevel: 3,
      language: "english",
      body: "earth",
      maxResults: 1,
    });
    assert.equal(matches[0]?.name, "Mollereisstrom");
  });

  test("biases repeated region-name search results toward the current map center", async () => {
    const missouriMatches = await findRegionsByQuery("Springfield", {
      regionLevel: 2,
      language: "english",
      body: "earth",
      maxResults: 1,
      biasLat: 37.2,
      biasLng: -93.3,
    });
    assert.equal(missouriMatches[0]?.name, "Springfield");
    assertClose(missouriMatches[0]?.lat ?? Infinity, 37.2, 1);

    const massachusettsMatches = await findRegionsByQuery("Springfield", {
      regionLevel: 2,
      language: "english",
      body: "earth",
      maxResults: 1,
      biasLat: 42.1,
      biasLng: -72.6,
    });
    assert.equal(massachusettsMatches[0]?.name, "West Springfield");
    assertClose(massachusettsMatches[0]?.lat ?? Infinity, 42.1, 1);
  });

  test("finds official Moon nomenclature for lunar coordinates", async () => {
    const region = await findClosestRegion(
      { lat: 8.3487, lng: 30.8346 },
      { body: "moon" },
    );

    assert.equal(region?.name, "Mare Tranquillitatis");
    assert.equal(region?.code, "ME");
    assert.equal(region?.body, "moon");
  });

  test("finds official Mars nomenclature for martian coordinates", async () => {
    const region = await findClosestRegion(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2 },
    );

    assert.equal(region?.name, "Olympus Mons");
    assert.equal(region?.code, "MO");
    assert.equal(region?.body, "mars");
    assert.equal(region?.lng, -133.8025);
  });

  test("uses refined Mars crater labels when official nomenclature is sparse", async () => {
    const region = await findClosestRegion(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2 },
    );

    assert.equal(region?.body, "mars");
    assert.equal(region?.regionLevel, 3);
    assert.match(region?.name ?? "", /^[A-Z][A-Za-z]+ Crater \d+$/);
    assert.match(region?.code ?? "", /^MCR-\d{2}-\d{6}$/);
    assert.ok((region?.distanceKm ?? Infinity) < 200);
  });

  test("roundtrips Moon codes with lunar meter conversion", async () => {
    const target = { lat: 8.35, lng: 30.84 };
    const encoded = await encode(target, { body: "moon", regionLevel: 2 });

    assert.match(encoded, /^Mare Tranquillitatis-/);

    const decoded = await decode(encoded, { body: "moon" });
    assertClose(decoded.lat, target.lat, 0.0002);
    assertClose(decoded.lng, target.lng, 0.0002);
  });

  test("supports Korean Moon and Mars labels", async () => {
    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "korean" },
    );
    assert.match(moonCode, /^고요의 바다-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "korean" },
    );
    assert.match(marsCode, /^올림푸스 산-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "korean" },
    );
    assert.match(marsFallback, /^[가-힣\s\d]+-/);
    assert.doesNotMatch(marsFallback.split("-")[0] ?? "", /[A-Za-z]/);

    const decoded = await decode(moonCode, { body: "moon" });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Chinese Moon and Mars labels", async () => {
    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "chinese" },
    );
    assert.match(moonCode, /^宁静海-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "chinese" },
    );
    assert.match(marsCode, /^奥林帕斯山-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "chinese" },
    );
    assert.match(marsFallback, /^[\p{Script=Han}\d]+-/u);
    assert.doesNotMatch(marsFallback.split("-")[0] ?? "", /[A-Za-z]/);

    const decoded = await decode(moonCode, { body: "moon" });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Japanese Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2, language: "japanese" },
    );
    assert.match(
      earthCode,
      /^[\p{Script=Katakana}\p{Script=Hiragana}\p{Script=Han}ー\s]+-/u,
    );

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "japanese" },
    );
    assert.match(moonCode, /^静かの海-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "japanese" },
    );
    assert.match(marsCode, /^オリンポス山-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "japanese" },
    );
    assert.match(marsFallback, /^[\p{Script=Katakana}ー]+クレーター \d+-/u);

    const decoded = await decode(moonCode, { body: "moon" });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("uses a smaller meters-per-degree value on the Moon than on Earth", () => {
    assert.ok(getBodyMetersPerDegree("moon") < getBodyMetersPerDegree("earth"));
  });
});
