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
  test("supports address-gap expansion Earth, Moon, and Mars labels", async () => {
    const cases = [
      {
        language: "swahili",
        target: { lat: -6.1751, lng: 106.865 },
        earth: /^Jakarta-[A-Z][A-Za-z]+/u,
        moon: /^[\p{Script=Latin}\s]+-[A-Z][A-Za-z]+/u,
        mars: /^[\p{Script=Latin}\s\d]+-[A-Z][A-Za-z]+/u,
      },
      {
        language: "filipino",
        target: { lat: -6.1751, lng: 106.865 },
        earth: /^Jakarta-[A-Z][A-Za-z]+/u,
        moon: /^[\p{Script=Latin}\s]+-[A-Z][A-Za-z]+/u,
        mars: /^[\p{Script=Latin}\s\d]+-[A-Z][A-Za-z]+/u,
      },
      {
        language: "hausa",
        target: { lat: 30.0444, lng: 31.2357 },
        earth: /^Alkahira-[A-Z][A-Za-z]+/u,
        moon: /^[\p{Script=Latin}\s]+-[A-Z][A-Za-z]+/u,
        mars: /^[\p{Script=Latin}\s\d]+-[A-Z][A-Za-z]+/u,
      },
      {
        language: "bengali",
        target: { lat: 28.65195, lng: 77.23149 },
        earth: /^দিল্লি-[\p{Script=Bengali}\p{Mark}]+/u,
        moon: /^[\p{Script=Bengali}\p{Mark}\s]+-[\p{Script=Bengali}\p{Mark}]+/u,
        mars: /^[\p{Script=Bengali}\p{Mark}\s\d]+-[\p{Script=Bengali}\p{Mark}]+/u,
      },
      {
        language: "urdu",
        target: { lat: 28.65195, lng: 77.23149 },
        earth: /^دہلی-[\p{Script=Arabic}\p{Mark}]+/u,
        moon: /^[\p{Script=Arabic}\p{Mark}\s]+-[\p{Script=Arabic}\p{Mark}]+/u,
        mars: /^[\p{Script=Arabic}\p{Mark}\s\d]+-[\p{Script=Arabic}\p{Mark}]+/u,
      },
      {
        language: "amharic",
        target: { lat: 30.0444, lng: 31.2357 },
        earth: /^ካይሮ-[\p{Script=Ethiopic}\p{Mark}]+/u,
        moon: /^[\p{Script=Ethiopic}\p{Mark}\s]+-[\p{Script=Ethiopic}\p{Mark}]+/u,
        mars: /^[\p{Script=Ethiopic}\p{Mark}\s\d]+-[\p{Script=Ethiopic}\p{Mark}]+/u,
      },
      {
        language: "burmese",
        target: { lat: -6.1751, lng: 106.865 },
        earth: /^ဂျာကာတာ-[\p{Script=Myanmar}\p{Mark}]+/u,
        moon: /^[\p{Script=Myanmar}\p{Mark}\s]+-[\p{Script=Myanmar}\p{Mark}]+/u,
        mars: /^[\p{Script=Myanmar}\p{Mark}\s\d]+-[\p{Script=Myanmar}\p{Mark}]+/u,
      },
      {
        language: "khmer",
        target: { lat: -6.1751, lng: 106.865 },
        earth: /^ចាការតា-[\p{Script=Khmer}\p{Mark}]+/u,
        moon: /^[\p{Script=Khmer}\p{Mark}\s]+-[\p{Script=Khmer}\p{Mark}]+/u,
        mars: /^[\p{Script=Khmer}\p{Mark}\s\d]+-[\p{Script=Khmer}\p{Mark}]+/u,
      },
      {
        language: "nepali",
        target: { lat: 28.65195, lng: 77.23149 },
        earth: /^दिल्ली-[\p{Script=Devanagari}\p{Mark}]+/u,
        moon: /^[\p{Script=Devanagari}\p{Mark}\s]+-[\p{Script=Devanagari}\p{Mark}]+/u,
        mars: /^[\p{Script=Devanagari}\p{Mark}\s\d]+-[\p{Script=Devanagari}\p{Mark}]+/u,
      },
      {
        language: "somali",
        target: { lat: 30.0444, lng: 31.2357 },
        earth: /^Qaahira-[A-Z][A-Za-z]+/u,
        moon: /^[\p{Script=Latin}\s]+-[A-Z][A-Za-z]+/u,
        mars: /^[\p{Script=Latin}\s\d]+-[A-Z][A-Za-z]+/u,
      },
      {
        language: "pashto",
        target: { lat: 28.65195, lng: 77.23149 },
        earth: /^ډیلي-[\p{Script=Arabic}\p{Mark}]+/u,
        moon: /^[\p{Script=Arabic}\p{Mark}\s]+-[\p{Script=Arabic}\p{Mark}]+/u,
        mars: /^[\p{Script=Arabic}\p{Mark}\s\d]+-[\p{Script=Arabic}\p{Mark}]+/u,
      },
      {
        language: "lingala",
        target: { lat: 30.0444, lng: 31.2357 },
        earth: /^Kairo-[A-Z][A-Za-z]+/u,
        moon: /^[\p{Script=Latin}\s]+-[A-Z][A-Za-z]+/u,
        mars: /^[\p{Script=Latin}\s\d]+-[A-Z][A-Za-z]+/u,
      },
    ] as const;

    for (const item of cases) {
      const earthCode = await encode(item.target, {
        regionLevel: 2,
        language: item.language,
      });
      assert.match(earthCode, item.earth);

      const moonCode = await encode(
        { lat: 8.35, lng: 30.84 },
        { body: "moon", regionLevel: 2, language: item.language },
      );
      assert.match(moonCode, item.moon);

      const marsCode = await encode(
        { lat: 18.6528, lng: 226.1975 },
        { body: "mars", regionLevel: 2, language: item.language },
      );
      assert.match(marsCode, item.mars);

      const decoded = await decode(moonCode, {
        body: "moon",
        language: item.language,
      });
      assertClose(decoded.lat, 8.35, 0.0002);
      assertClose(decoded.lng, 30.84, 0.0002);
    }
  });

  test("uses a smaller meters-per-degree value on the Moon than on Earth", () => {
    assert.ok(getBodyMetersPerDegree("moon") < getBodyMetersPerDegree("earth"));
  });
});
