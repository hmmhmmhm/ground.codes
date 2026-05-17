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
    } = options ?? {};

    const normalizedSearch = codeOrName.toLowerCase().trim();
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
      const regions = await loadRegions(candidateRegionLevel, language, body);
      const exactMatches = regions.filter(
        (region) =>
          region.code.toLowerCase() === normalizedSearch ||
          region.name.toLowerCase() === normalizedSearch,
      );
      const partialMatches = regions
        .filter(
          (region) =>
            !exactMatches.includes(region) &&
            (region.code.toLowerCase().includes(normalizedSearch) ||
              region.name.toLowerCase().includes(normalizedSearch)),
        )
        .sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aCode = a.code.toLowerCase();
          const bCode = b.code.toLowerCase();
          const aRank = aName.startsWith(normalizedSearch)
            ? 0
            : aCode.startsWith(normalizedSearch)
              ? 1
              : 2;
          const bRank = bName.startsWith(normalizedSearch)
            ? 0
            : bCode.startsWith(normalizedSearch)
              ? 1
              : 2;

          return (
            aRank - bRank ||
            (b.population ?? 0) - (a.population ?? 0) ||
            a.name.length - b.name.length
          );
        });

      for (const region of [...exactMatches, ...partialMatches]) {
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
