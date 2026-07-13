import {
  loadRegionLookupRows,
  loadRegions,
  normalizeRegionLookupKey,
  type RegionSearchMatch,
} from "./region-dataset.js";
import {
  calculateDistance,
  findClosestInRegions,
  toRadians,
  toRegionResult,
} from "./region-geometry.js";
import { getRegionStore, setRegionStore } from "./region-store.js";
import type {
  Region,
  RegionSearchResult,
  RegionStore,
} from "./region-types.js";
import { type CelestialBody, normalizeLongitudeForBody } from "./spherical.js";
import type { SupportedLanguage } from "./wordset.js";

const DEFAULT_REGION_2_FALLBACK_DISTANCE_KM = 100;
const DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM = 100;

export { calculateDistance, getRegionStore, setRegionStore, toRadians };
export type { Region, RegionSearchResult, RegionStore };

export const findClosestRegion = async (
  { lat, lng }: { lat: number; lng: number },
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    region2FallbackDistanceKm?: number;
    body?: CelestialBody;
  },
) => {
  const regionStore = getRegionStore();
  if (regionStore) {
    return await regionStore.findClosestRegion({ lat, lng }, options);
  }

  const body = options?.body ?? "earth";
  const regionLevel = options?.regionLevel ?? (body === "earth" ? 1 : 2);
  const language = options?.language;
  const region2FallbackDistanceKm =
    options?.region2FallbackDistanceKm ?? DEFAULT_REGION_2_FALLBACK_DISTANCE_KM;

  try {
    const closestRegion = findClosestInRegions(
      { lat, lng },
      await loadRegions(regionLevel, language, body),
      regionLevel,
      body,
    );

    const needsFallback =
      regionLevel === 2 &&
      closestRegion?.distanceKm !== undefined &&
      ((body === "earth" &&
        closestRegion.distanceKm > region2FallbackDistanceKm) ||
        (body === "mars" &&
          closestRegion.distanceKm >
            DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM));

    if (needsFallback && closestRegion) {
      const fallbackLevels = body === "mars" ? [3] : [1, 3];
      const fallbackCandidates = [
        closestRegion,
        ...(await Promise.all(
          fallbackLevels.map(async (fallbackLevel) =>
            findClosestInRegions(
              { lat, lng },
              await loadRegions(
                fallbackLevel,
                fallbackLevel === 1 ? undefined : language,
                body,
              ),
              fallbackLevel,
              body,
            ),
          ),
        )),
      ].filter((region): region is Region => Boolean(region));
      const fallbackRegion = fallbackCandidates.reduce((best, region) =>
        (region.distanceKm ?? Infinity) < (best.distanceKm ?? Infinity)
          ? region
          : best,
      );
      if (fallbackRegion !== closestRegion)
        return toRegionResult(fallbackRegion);
    }

    return closestRegion ? toRegionResult(closestRegion) : null;
  } catch (error: unknown) {
    console.error("Error importing region data:", error);
    throw new Error(
      `Failed to load region data for level ${regionLevel}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const findRegionByCodeOrName = async (
  codeOrName: string,
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    body?: CelestialBody;
  },
): Promise<RegionSearchResult | null> => {
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
): Promise<RegionSearchResult[]> => {
  if (!codeOrName || codeOrName.trim() === "") return [];

  const regionStore = getRegionStore();
  if (regionStore) {
    return await regionStore.findRegionsByQuery(codeOrName, options);
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
    const results: RegionSearchResult[] = [];
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
      for (const fallbackLevel of body === "mars" ? [3] : [1, 3]) {
        await addMatches(fallbackLevel);
        if (results.length >= maxResults) return results;
      }
    }
    return results;
  } catch (error) {
    console.error("Error finding region by code or name:", error);
    return [];
  }
};
