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
    assertUniqueNames(moonSpanishRegions);
    assertUniqueNames(marsSpanishRegions);
    assertUniqueNames(moonFrenchRegions);
    assertUniqueNames(marsFrenchRegions);
    assertUniqueNames(moonGermanRegions);
    assertUniqueNames(marsGermanRegions);
    assertUniqueNames(moonPortugueseRegions);
    assertUniqueNames(marsPortugueseRegions);
    assertUniqueNames(moonIndonesianRegions);
    assertUniqueNames(marsIndonesianRegions);
    assertUniqueNames(moonThaiRegions);
    assertUniqueNames(marsThaiRegions);
    assertUniqueNames(moonVietnameseRegions);
    assertUniqueNames(marsVietnameseRegions);
    assertUniqueNames(moonHindiRegions);
    assertUniqueNames(marsHindiRegions);
    assertUniqueNames(moonArabicRegions);
    assertUniqueNames(marsArabicRegions);
    assertUniqueNames(marsFallbackKoreanRegions);
    assertUniqueNames(marsFallbackChineseRegions);
    assertUniqueNames(marsFallbackJapaneseRegions);
    assertUniqueNames(marsFallbackSpanishRegions);
    assertUniqueNames(marsFallbackFrenchRegions);
    assertUniqueNames(marsFallbackGermanRegions);
    assertUniqueNames(marsFallbackPortugueseRegions);
    assertUniqueNames(marsFallbackIndonesianRegions);
    assertUniqueNames(marsFallbackThaiRegions);
    assertUniqueNames(marsFallbackVietnameseRegions);
    assertUniqueNames(marsFallbackHindiRegions);
    assertUniqueNames(marsFallbackArabicRegions);
    assert.equal(
      moonIndonesianRegions.find((region) =>
        region.source.endsWith("/Feature/3686"),
      )?.name,
      "Laut Serenitas",
    );
    assertNoLatinNames(moonKoreanRegions);
    assertNoLatinNames(marsKoreanRegions);
    assertNoLatinNames(marsFallbackKoreanRegions);
    assertNoLatinNames(moonChineseRegions);
    assertNoLatinNames(marsChineseRegions);
    assertNoLatinNames(marsFallbackChineseRegions);
    assertNoLatinNames(moonThaiRegions);
    assertNoLatinNames(marsThaiRegions);
    assertNoLatinNames(marsFallbackThaiRegions);
    assertNoLatinNames(moonArabicRegions);
    assertNoLatinNames(marsArabicRegions);
    assertNoLatinNames(marsFallbackArabicRegions);
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

  test("supports Spanish Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2, language: "spanish" },
    );
    assert.match(earthCode, /^Seul-[A-Z][A-Za-z]+/);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "spanish" },
    );
    assert.match(moonCode, /^Mar Tranquilidad-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "spanish" },
    );
    assert.match(marsCode, /^Monte Olimpo-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "spanish" },
    );
    assert.match(marsFallback, /^Crater [A-Za-z]+ \d+-/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "spanish",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

  test("supports French Earth, Moon, and Mars labels", async () => {
    const earthCode = await encode(
      { lat: 37.566, lng: 126.978 },
      { regionLevel: 2, language: "french" },
    );
    assert.match(earthCode, /^Seoul-[A-Z][A-Za-z]+/);

    const moonCode = await encode(
      { lat: 8.35, lng: 30.84 },
      { body: "moon", regionLevel: 2, language: "french" },
    );
    assert.match(moonCode, /^Mer Tranquillite-/);

    const marsCode = await encode(
      { lat: 18.6528, lng: 226.1975 },
      { body: "mars", regionLevel: 2, language: "french" },
    );
    assert.match(marsCode, /^Mont Olympe-/);

    const marsFallback = await encode(
      { lat: 64.3, lng: -86.4 },
      { body: "mars", regionLevel: 2, language: "french" },
    );
    assert.match(marsFallback, /^Cratere [A-Za-z]+ \d+-/);

    const decoded = await decode(moonCode, {
      body: "moon",
      language: "french",
    });
    assertClose(decoded.lat, 8.35, 0.0002);
    assertClose(decoded.lng, 30.84, 0.0002);
  });

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
    assert.match(
      marsFallback,
      /^Hố va chạm [\p{Script=Latin}\p{Mark}\s\d]+-/u,
    );

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

  test("uses a smaller meters-per-degree value on the Moon than on Earth", () => {
    assert.ok(getBodyMetersPerDegree("moon") < getBodyMetersPerDegree("earth"));
  });
});
