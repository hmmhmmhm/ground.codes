/// <reference path="./region-json.d.ts" />

import { createRequire } from "node:module";
import type { CelestialBody } from "./spherical.js";
import type { SupportedLanguage } from "./wordset.js";
import { regionSupportedLanguages } from "./region-languages.js";
import type { Region } from "./region-types.js";

export type RegionLookupRow = {
  region: Region;
  codeKey: string;
  nameKey: string;
};

export type RegionSearchMatch = RegionLookupRow & {
  matchRank: number;
  distanceKm: number | undefined;
};

const regionDataCache = new Map<string, Promise<Region[]>>();
const regionLookupCache = new Map<string, Promise<RegionLookupRow[]>>();
let requireRegionJson: ReturnType<typeof createRequire> | null = null;

export const getRegionDatasetName = ({
  body,
  regionLevel,
  language = "english",
}: {
  body: CelestialBody;
  regionLevel: number;
  language?: SupportedLanguage;
}) => {
  const languageKey = String(language).toLowerCase();
  if (!regionSupportedLanguages.has(languageKey)) {
    throw new Error(`Invalid language: ${language}`);
  }

  if (body === "earth" && regionLevel === 1) return "region-1";
  const suffix = languageKey === "english" ? "" : `-${languageKey}`;

  if (body === "earth") {
    if (![2, 3].includes(regionLevel)) {
      throw new Error(`Invalid region level: ${regionLevel}`);
    }
    return `region-${regionLevel}${suffix}`;
  }

  if (body === "moon") {
    if (regionLevel !== 2) throw new Error("Moon supports region level 2");
    return `region-2-moon${suffix}`;
  }

  if (body === "mars") {
    if (![2, 3].includes(regionLevel)) {
      throw new Error("Mars supports region levels 2 and 3");
    }
    return `region-${regionLevel}-mars${suffix}`;
  }

  throw new Error(`Invalid celestial body: ${body}`);
};

const loadRegionData = (path: string) => {
  if (!requireRegionJson) {
    if (typeof import.meta.url !== "string") {
      throw new Error(
        "Local region JSON loading is unavailable in this runtime",
      );
    }
    requireRegionJson = createRequire(import.meta.url);
  }

  return requireRegionJson(path) as Region[];
};

export const loadRegions = async (
  regionLevel: number,
  language?: SupportedLanguage,
  body: CelestialBody = "earth",
): Promise<Region[]> => {
  const languageKey = language?.toLowerCase() ?? "english";
  const cacheKey = `${body}:${regionLevel}:${languageKey}`;
  const cached = regionDataCache.get(cacheKey);
  if (cached) return cached;

  const promise = Promise.resolve().then(() => {
    const datasetName = getRegionDatasetName({
      body,
      regionLevel,
      language: languageKey as SupportedLanguage,
    });
    return loadRegionData(
      `@ground-codes/geoint/region-dist/${datasetName}.json`,
    );
  });
  const recoverablePromise = promise.catch((error) => {
    regionDataCache.delete(cacheKey);
    throw error;
  });
  regionDataCache.set(cacheKey, recoverablePromise);
  return recoverablePromise;
};

export const normalizeRegionLookupKey = (value: string) =>
  value
    .replace(/Æ/g, "Ae")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "Oe")
    .replace(/œ/g, "oe")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/Ð/g, "D")
    .replace(/ð/g, "d")
    .replace(/Þ/g, "Th")
    .replace(/þ/g, "th")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const loadRegionLookupRows = async (
  regionLevel: number,
  language?: SupportedLanguage,
  body: CelestialBody = "earth",
) => {
  const languageKey = language?.toLowerCase() ?? "english";
  const cacheKey = `${body}:${regionLevel}:${languageKey}`;
  const cached = regionLookupCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadRegions(regionLevel, language, body)
    .then((regions) =>
      regions.map((region) => ({
        region,
        codeKey: normalizeRegionLookupKey(region.code),
        nameKey: normalizeRegionLookupKey(region.name),
      })),
    )
    .catch((error) => {
      regionLookupCache.delete(cacheKey);
      throw error;
    });
  regionLookupCache.set(cacheKey, promise);
  return promise;
};
