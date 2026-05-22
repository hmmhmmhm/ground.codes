/// <reference path="./region-json.d.ts" />

import { SupportedLanguage } from "./wordset.js";
import {
  CelestialBody,
  getBodyMetersPerDegree,
  normalizeLongitudeForBody,
} from "./spherical.js";

export interface Region {
  name: string;
  code: string;
  lat: number;
  long: number;
  body?: CelestialBody;
  regionLevel?: number;
  distanceKm?: number;
  population?: number;
}

const DEFAULT_REGION_2_FALLBACK_DISTANCE_KM = 100;
const DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM = 100;
const regionDataCache = new Map<string, Promise<Region[]>>();

type RegionLookupRow = {
  region: Region;
  codeKey: string;
  nameKey: string;
};

type RegionSearchMatch = RegionLookupRow & {
  matchRank: number;
  distanceKm: number | undefined;
};

const regionLookupCache = new Map<string, Promise<RegionLookupRow[]>>();

const loadRegions = async (
  regionLevel: number,
  language?: SupportedLanguage,
  body: CelestialBody = "earth",
): Promise<Region[]> => {
  const normalizedLanguage = language?.toLowerCase();
  const cacheKey = `${body}:${regionLevel}:${normalizedLanguage ?? "english"}`;
  const cached = regionDataCache.get(cacheKey);
  if (cached) return cached;

  const load = async () => {
    if (body === "moon") {
      if (regionLevel !== 2) throw new Error("Moon supports region level 2");
      if (normalizedLanguage === "korean") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-korean.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "chinese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-chinese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "japanese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-japanese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "spanish") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-spanish.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "french") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-french.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "german") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-german.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "portuguese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-portuguese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "indonesian") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-indonesian.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "thai") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-thai.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "vietnamese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-moon-vietnamese.json"
          );
        return module.default as Region[];
      }
      const module =
        // @ts-ignore
        await import("@ground-codes/geoint/region-dist/region-2-moon.json");
      return module.default as Region[];
    }

    if (body === "mars") {
      if (regionLevel === 3) {
        if (normalizedLanguage === "korean") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-korean.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "chinese") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-chinese.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "japanese") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-japanese.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "spanish") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-spanish.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "french") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-french.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "german") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-german.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "portuguese") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-portuguese.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "indonesian") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-indonesian.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "thai") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-thai.json"
            );
          return module.default as Region[];
        }
        if (normalizedLanguage === "vietnamese") {
          const module =
            // @ts-ignore
            await import(
              "@ground-codes/geoint/region-dist/region-3-mars-vietnamese.json"
            );
          return module.default as Region[];
        }
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-3-mars.json");
        return module.default as Region[];
      }
      if (regionLevel !== 2)
        throw new Error("Mars supports region levels 2 and 3");
      if (normalizedLanguage === "korean") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-korean.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "chinese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-chinese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "japanese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-japanese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "spanish") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-spanish.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "french") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-french.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "german") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-german.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "portuguese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-portuguese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "indonesian") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-indonesian.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "thai") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-thai.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "vietnamese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-mars-vietnamese.json"
          );
        return module.default as Region[];
      }
      const module =
        // @ts-ignore
        await import("@ground-codes/geoint/region-dist/region-2-mars.json");
      return module.default as Region[];
    }

    if (regionLevel === 1) {
      const module =
        // @ts-ignore
        await import("@ground-codes/geoint/region-dist/region-1.json");
      return module.default as Region[];
    }

    if (regionLevel === 2) {
      if (!language || normalizedLanguage === "english") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-2.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "korean") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-2-korean.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "chinese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-chinese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "japanese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-japanese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "spanish") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-spanish.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "french") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-2-french.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "german") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-2-german.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "portuguese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-portuguese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "indonesian") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-indonesian.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "thai") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-2-thai.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "vietnamese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-2-vietnamese.json"
          );
        return module.default as Region[];
      }
      throw new Error(`Invalid language: ${language}`);
    }

    if (regionLevel === 3) {
      if (!language || normalizedLanguage === "english") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-3.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "korean") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-3-korean.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "chinese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-3-chinese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "japanese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-3-japanese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "spanish") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-3-spanish.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "french") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-3-french.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "german") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-3-german.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "portuguese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-3-portuguese.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "indonesian") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-3-indonesian.json"
          );
        return module.default as Region[];
      }
      if (normalizedLanguage === "thai") {
        const module =
          // @ts-ignore
          await import("@ground-codes/geoint/region-dist/region-3-thai.json");
        return module.default as Region[];
      }
      if (normalizedLanguage === "vietnamese") {
        const module =
          // @ts-ignore
          await import(
            "@ground-codes/geoint/region-dist/region-3-vietnamese.json"
          );
        return module.default as Region[];
      }
      throw new Error(`Invalid language: ${language}`);
    }

    throw new Error(`Invalid region level: ${regionLevel}`);
  };

  const promise = load().catch((error) => {
    regionDataCache.delete(cacheKey);
    throw error;
  });
  regionDataCache.set(cacheKey, promise);
  return promise;
};

const findClosestInRegions = (
  target: { lat: number; lng: number },
  regions: Region[],
  regionLevel: number,
  body: CelestialBody,
) => {
  let closestRegion: Region | null = null;
  let closestRegionDistance = Infinity;
  const targetLng = normalizeLongitudeForBody(target.lng, body);

  for (const region of regions) {
    const regionLng = normalizeLongitudeForBody(region.long, body);
    const distance = calculateDistance(
      target.lat,
      targetLng,
      region.lat,
      regionLng,
      body,
    );

    if (distance < closestRegionDistance) {
      closestRegionDistance = distance;
      closestRegion = {
        name: region.name,
        code: region.code,
        lat: region.lat,
        long: regionLng,
        body,
        regionLevel,
        distanceKm: distance,
      };
    }
  }

  return closestRegion;
};

const toRegionResult = (region: Region) => ({
  name: region.name,
  code: region.code,
  lat: region.lat,
  lng: region.long,
  body: region.body,
  regionLevel: region.regionLevel,
  distanceKm: region.distanceKm,
});

const normalizeRegionLookupKey = (value: string) =>
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

const loadRegionLookupRows = async (
  regionLevel: number,
  language?: SupportedLanguage,
  body: CelestialBody = "earth",
) => {
  const normalizedLanguage = language?.toLowerCase();
  const cacheKey = `${body}:${regionLevel}:${normalizedLanguage ?? "english"}`;
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

export const findClosestRegion = async (
  {
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  },
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    region2FallbackDistanceKm?: number;
    body?: CelestialBody;
  },
) => {
  const body = options?.body ?? "earth";
  const regionLevel = options?.regionLevel ?? (body === "earth" ? 1 : 2);
  const language = options?.language;
  const region2FallbackDistanceKm =
    options?.region2FallbackDistanceKm ?? DEFAULT_REGION_2_FALLBACK_DISTANCE_KM;

  try {
    const regions = await loadRegions(regionLevel, language, body);
    const closestRegion = findClosestInRegions(
      { lat, lng },
      regions,
      regionLevel,
      body,
    );

    if (
      regionLevel === 2 &&
      closestRegion &&
      closestRegion.distanceKm !== undefined &&
      ((body === "earth" &&
        closestRegion.distanceKm > region2FallbackDistanceKm) ||
        (body === "mars" &&
          closestRegion.distanceKm >
            DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM))
    ) {
      const fallbackCandidates =
        body === "mars"
          ? [
              closestRegion,
              findClosestInRegions(
                { lat, lng },
                await loadRegions(3, language, body),
                3,
                body,
              ),
            ].filter((region): region is Region => Boolean(region))
          : [
              closestRegion,
              findClosestInRegions(
                { lat, lng },
                await loadRegions(1, undefined, body),
                1,
                body,
              ),
              findClosestInRegions(
                { lat, lng },
                await loadRegions(3, language, body),
                3,
                body,
              ),
            ].filter((region): region is Region => Boolean(region));

      const fallbackRegion = fallbackCandidates.reduce((best, region) =>
        (region.distanceKm ?? Infinity) < (best.distanceKm ?? Infinity)
          ? region
          : best,
      );

      if (fallbackRegion !== closestRegion)
        return toRegionResult(fallbackRegion);
    }

    if (!closestRegion) return null;
    return toRegionResult(closestRegion);
  } catch (error: unknown) {
    console.error("Error importing region data:", error);
    throw new Error(
      `Failed to load region data for level ${regionLevel}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Helper function to find a region by code or name.
 * Searches through the region data to find a region that matches the provided code or name.
 */
export const findRegionByCodeOrName = async (
  codeOrName: string,
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    body?: CelestialBody;
  },
): Promise<{
  lat: number;
  lng: number;
  regionLevel?: number;
  body?: CelestialBody;
  name?: string;
  code?: string;
} | null> => {
  const matches = await findRegionsByQuery(codeOrName, {
    ...options,
    maxResults: 1,
  });

  return matches[0] ?? null;
};

export const findRegionsByQuery = async (
  codeOrName: string,
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    body?: CelestialBody;
    maxResults?: number;
    biasLat?: number;
    biasLng?: number;
  },
): Promise<
  Array<{
    lat: number;
    lng: number;
    regionLevel?: number;
    body?: CelestialBody;
    name?: string;
    code?: string;
  }>
> => {
  if (!codeOrName || codeOrName.trim() === "") {
    return [];
  }

  try {
    const {
      regionLevel = 2,
      language,
      body = "earth",
      maxResults = 5,
      biasLat,
      biasLng,
    } = options ?? {};
    const hasSearchBias = Number.isFinite(biasLat) && Number.isFinite(biasLng);
    const normalizedBiasLng = hasSearchBias
      ? normalizeLongitudeForBody(biasLng as number, body)
      : undefined;

    const normalizedSearch = normalizeRegionLookupKey(codeOrName);
    const results: Array<{
      lat: number;
      lng: number;
      regionLevel?: number;
      body?: CelestialBody;
      name?: string;
      code?: string;
    }> = [];
    const seen = new Set<string>();

    const addMatches = async (candidateRegionLevel: number) => {
      const lookupRows = await loadRegionLookupRows(
        candidateRegionLevel,
        language,
        body,
      );
      const matches = lookupRows
        .flatMap((row): RegionSearchMatch[] => {
          const isExact =
            row.codeKey === normalizedSearch ||
            row.nameKey === normalizedSearch;
          const isPartial =
            row.codeKey.includes(normalizedSearch) ||
            row.nameKey.includes(normalizedSearch);
          if (!isExact && !isPartial) return [];

          const matchRank = isExact
            ? 0
            : row.nameKey.startsWith(normalizedSearch)
              ? 1
              : row.codeKey.startsWith(normalizedSearch)
                ? 2
                : 3;
          const distanceKm =
            hasSearchBias && normalizedBiasLng !== undefined
              ? calculateDistance(
                  biasLat as number,
                  normalizedBiasLng,
                  row.region.lat,
                  normalizeLongitudeForBody(row.region.long, body),
                  body,
                )
              : undefined;

          return [{ ...row, matchRank, distanceKm }];
        })
        .sort((a, b) => {
          const aRank = a.nameKey.startsWith(normalizedSearch)
            ? 0
            : a.codeKey.startsWith(normalizedSearch)
              ? 1
              : 2;
          const bRank = b.nameKey.startsWith(normalizedSearch)
            ? 0
            : b.codeKey.startsWith(normalizedSearch)
              ? 1
              : 2;

          return hasSearchBias
            ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
                a.matchRank - b.matchRank ||
                (b.region.population ?? 0) - (a.region.population ?? 0) ||
                a.region.name.length - b.region.name.length
            : a.matchRank - b.matchRank ||
                aRank - bRank ||
                (b.region.population ?? 0) - (a.region.population ?? 0) ||
                a.region.name.length - b.region.name.length;
        });

      for (const { region } of matches) {
        const key = `${body}:${candidateRegionLevel}:${region.code}:${region.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          name: region.name,
          code: region.code,
          lat: region.lat,
          lng: region.long,
          body,
          regionLevel: candidateRegionLevel,
        });
        if (results.length >= maxResults) return;
      }
    };

    await addMatches(regionLevel);
    if (results.length >= maxResults) return results;

    if ((body === "earth" || body === "mars") && regionLevel === 2) {
      const fallbackLevels = body === "mars" ? [3] : [1, 3];
      for (const fallbackLevel of fallbackLevels) {
        await addMatches(fallbackLevel);
        if (results.length >= maxResults) return results;
      }
    }

    return results;
  } catch (e) {
    console.error("Error finding region by code or name:", e);
    return [];
  }
};

/**
 * Calculates the distance between two points on the selected body's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lon1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lon2 - Longitude of the second point in degrees
 * @returns {number} Distance between the points in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  body: CelestialBody = "earth",
): number {
  const R = getBodyMetersPerDegree(body) / 1000 / (Math.PI / 180);

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 *
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
