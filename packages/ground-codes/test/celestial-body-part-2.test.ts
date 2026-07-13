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
import moonSpanishRegions from "@ground-codes/geoint/region-dist/region-2-moon-spanish.json";
import marsSpanishRegions from "@ground-codes/geoint/region-dist/region-2-mars-spanish.json";
import marsFallbackSpanishRegions from "@ground-codes/geoint/region-dist/region-3-mars-spanish.json";
import moonFrenchRegions from "@ground-codes/geoint/region-dist/region-2-moon-french.json";
import marsFrenchRegions from "@ground-codes/geoint/region-dist/region-2-mars-french.json";
import marsFallbackFrenchRegions from "@ground-codes/geoint/region-dist/region-3-mars-french.json";
import moonGermanRegions from "@ground-codes/geoint/region-dist/region-2-moon-german.json";
import marsGermanRegions from "@ground-codes/geoint/region-dist/region-2-mars-german.json";
import marsFallbackGermanRegions from "@ground-codes/geoint/region-dist/region-3-mars-german.json";
import moonPortugueseRegions from "@ground-codes/geoint/region-dist/region-2-moon-portuguese.json";
import marsPortugueseRegions from "@ground-codes/geoint/region-dist/region-2-mars-portuguese.json";
import marsFallbackPortugueseRegions from "@ground-codes/geoint/region-dist/region-3-mars-portuguese.json";
import moonIndonesianRegions from "@ground-codes/geoint/region-dist/region-2-moon-indonesian.json";
import marsIndonesianRegions from "@ground-codes/geoint/region-dist/region-2-mars-indonesian.json";
import marsFallbackIndonesianRegions from "@ground-codes/geoint/region-dist/region-3-mars-indonesian.json";
import moonThaiRegions from "@ground-codes/geoint/region-dist/region-2-moon-thai.json";
import marsThaiRegions from "@ground-codes/geoint/region-dist/region-2-mars-thai.json";
import marsFallbackThaiRegions from "@ground-codes/geoint/region-dist/region-3-mars-thai.json";
import moonVietnameseRegions from "@ground-codes/geoint/region-dist/region-2-moon-vietnamese.json";
import marsVietnameseRegions from "@ground-codes/geoint/region-dist/region-2-mars-vietnamese.json";
import marsFallbackVietnameseRegions from "@ground-codes/geoint/region-dist/region-3-mars-vietnamese.json";
import moonHindiRegions from "@ground-codes/geoint/region-dist/region-2-moon-hindi.json";
import marsHindiRegions from "@ground-codes/geoint/region-dist/region-2-mars-hindi.json";
import marsFallbackHindiRegions from "@ground-codes/geoint/region-dist/region-3-mars-hindi.json";
import moonArabicRegions from "@ground-codes/geoint/region-dist/region-2-moon-arabic.json";
import marsArabicRegions from "@ground-codes/geoint/region-dist/region-2-mars-arabic.json";
import marsFallbackArabicRegions from "@ground-codes/geoint/region-dist/region-3-mars-arabic.json";
import moonRussianRegions from "@ground-codes/geoint/region-dist/region-2-moon-russian.json";
import marsRussianRegions from "@ground-codes/geoint/region-dist/region-2-mars-russian.json";
import marsFallbackRussianRegions from "@ground-codes/geoint/region-dist/region-3-mars-russian.json";

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
  test("supports German Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2, language: "german" },
    );
    assert.match(earthCode, /^Seoul-[A-Z][A-Za-z]+/);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "german" },
    );
    assert.match(moonCode, /^Meer der Ruhe-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "german" },
    );
    assert.match(marsCode, /^Olympusberg-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "german" },
    );
    assert.match(marsFallback, /^Krater [A-Za-z]+ \d+-/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "german",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Portuguese Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2, language: "portuguese" },
    );
    assert.match(earthCode, /^Seul-[A-Z][A-Za-z]+/);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "portuguese" },
    );
    assert.match(moonCode, /^Mar da Tranquilidade-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "portuguese" },
    );
    assert.match(marsCode, /^Monte Olimpo-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "portuguese" },
    );
    assert.match(marsFallback, /^Cratera [A-Za-z]+ \d+-/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "portuguese",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Indonesian Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2, language: "indonesian" },
    );
    assert.match(earthCode, /^Seoul-[A-Z][A-Za-z]+/);

    const jakartaCode = await encode(
      { lat: -6.1751, lng: 106.865 },
      { regionLevel: 2, language: "indonesian" },
    );
    assert.match(jakartaCode, /^Jakarta-[A-Z][A-Za-z]+/);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "indonesian" },
    );
    assert.match(moonCode, /^Laut Ketenangan-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "indonesian" },
    );
    assert.match(marsCode, /^Gunung Olympus-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "indonesian" },
    );
    assert.match(marsFallback, /^Kawah [A-Za-z]+ \d+-/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "indonesian",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Thai Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 13.7563, lng: 100.5018 },
      { regionLevel: 2, language: "thai" },
    );
    assert.match(earthCode, /^กรุงเทพมหานคร-[\p{Script=Thai}]+/u);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "thai" },
    );
    assert.match(moonCode, /^ทะเลแห่งความสงบ-/u);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "thai" },
    );
    assert.match(marsCode, /^ภูเขาโอลิมปัส-/u);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "thai" },
    );
    assert.match(marsFallback, /^หลุมอุกกาบาต[\p{Script=Thai}\s\d]+-/u);
    assert.doesNotMatch(marsFallback.split("-")[0] ?? "", /[A-Za-z]/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "thai",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Vietnamese Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 21.0278, lng: 105.8342 },
      { regionLevel: 2, language: "vietnamese" },
    );
    assert.match(earthCode, /^Hà Nội-[\p{Script=Latin}\p{Mark}]+/u);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "vietnamese" },
    );
    assert.match(moonCode, /^Biển Tĩnh Lặng-/u);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "vietnamese" },
    );
    assert.match(marsCode, /^Núi Olympus-/u);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "vietnamese" },
    );
    assert.match(marsFallback, /^Hố va chạm [\p{Script=Latin}\p{Mark}\s\d]+-/u);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "vietnamese",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Hindi Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 28.65195, lng: 77.23149 },
      { regionLevel: 2, language: "hindi" },
    );
    assert.match(earthCode, /^दिल्ली-[\p{Script=Devanagari}\p{Mark}]+/u);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "hindi" },
    );
    assert.match(moonCode, /^शांति सागर-/u);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "hindi" },
    );
    assert.match(marsCode, /^ओलिम्पस पर्वत-/u);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "hindi" },
    );
    assert.match(marsFallback, /^गड्ढा .+-/u);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "hindi",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Arabic Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 30.0444, lng: 31.2357 },
      { regionLevel: 2, language: "arabic" },
    );
    assert.match(earthCode, /^القاهرة-[\p{Script=Arabic}\p{Mark}]+/u);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "arabic" },
    );
    assert.match(moonCode, /^بحر السكون-/u);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "arabic" },
    );
    assert.match(marsCode, /^جبل أوليمبوس-/u);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "arabic" },
    );
    assert.match(marsFallback, /^فوهة .+-/u);
    assert.doesNotMatch(marsFallback.split("-")[0] ?? "", /[A-Za-z]/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "arabic",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports Russian Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 55.7558, lng: 37.6173 },
      { regionLevel: 2, language: "russian" },
    );
    assert.match(earthCode, /^Москва-[\p{Script=Cyrillic}\p{Mark}]+/u);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "russian" },
    );
    assert.match(moonCode, /^Море Спокойствия-/u);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "russian" },
    );
    assert.match(marsCode, /^гора Олимпус-/u);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "russian" },
    );
    assert.match(marsFallback, /^кратер [\p{Script=Cyrillic}\p{Mark}\s\d]+-/u);
    assert.doesNotMatch(marsFallback.split("-")[0] ?? "", /[A-Za-z]/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "russian",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });
});
