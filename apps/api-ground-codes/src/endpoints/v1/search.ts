import Elysia, { t } from "elysia";
import * as GroundCodes from "ground-codes/src/index.ts";
import type {
  CelestialBody,
  SupportedLanguage,
} from "ground-codes/src/index.ts";
import { supportedLanguages } from "./language.js";
import {
  validateBody,
  validateCoordinates,
  validateLanguage,
  validateMaxResults,
  validateRegionLevel,
  validateSearchBiasCoordinates,
  validateSearchQuery,
} from "./validation.js";

const coordinatePattern = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

const parseCoordinates = (query: string) => {
  const match = query.match(coordinatePattern);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  validateCoordinates({ lat, lng });
  return { lat, lng };
};

const getDecodeLanguages = (language: string) => [
  language,
  ...supportedLanguages.filter((candidate) => candidate !== language),
];

const englishLikePattern = /^[\x00-\x7F]+$/;
const searchAliases: Record<string, string> = {
  la: "Los Angeles",
  lax: "Los Angeles",
  nyc: "New York City",
  sf: "San Francisco",
  sfo: "San Francisco",
};

const resolveSearchAlias = (query: string) =>
  searchAliases[query.toLowerCase()] ?? query;

type RegionSearchResult = {
  lat: number;
  lng: number;
  regionLevel?: number;
  body?: CelestialBody;
  name?: string;
  code?: string;
};

type GroundCodesWithOptionalRegionSearch = typeof GroundCodes & {
  findRegionsByQuery?: (
    codeOrName: string,
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      biasLat?: number;
      biasLng?: number;
    },
  ) => Promise<RegionSearchResult[]>;
};

const getRegionSearchLanguages = (language: string, query: string) => {
  if (language === "english") return ["english"];
  if (language === "spanish") return ["spanish", "english"];
  if (language === "french") return ["french", "english"];
  if (language === "german") return ["german", "english"];
  if (language === "portuguese") return ["portuguese", "english"];
  if (language === "indonesian") return ["indonesian", "english"];
  if (englishLikePattern.test(query)) return ["english", language];
  return [language, "english"];
};

const findRegionMatches = async (
  query: string,
  options: {
    regionLevel: number;
    language: SupportedLanguage;
    body: CelestialBody;
    maxResults: number;
    biasLat?: number;
    biasLng?: number;
  },
): Promise<RegionSearchResult[]> => {
  const findRegionsByQuery = (
    GroundCodes as GroundCodesWithOptionalRegionSearch
  ).findRegionsByQuery;

  if (findRegionsByQuery) {
    return await findRegionsByQuery(query, options);
  }

  const exactMatch = await GroundCodes.findRegionByCodeOrName(query, options);
  return exactMatch ? [exactMatch] : [];
};

export const v1Search = new Elysia().post(
  "/search",
  async ({
    body: {
      query,
      regionLevel = 2,
      language = "english",
      body: celestialBody = "earth",
      maxResults = 5,
      biasLat,
      biasLng,
    },
    set,
  }) => {
    const normalizedQuery = validateSearchQuery(query);
    const validatedLanguage = validateLanguage(language);
    const validatedBody = validateBody(celestialBody);
    validateRegionLevel({ body: validatedBody, regionLevel });
    validateMaxResults(maxResults);
    const searchBias = validateSearchBiasCoordinates({ biasLat, biasLng });
    set.headers["cache-control"] = "public, max-age=60, s-maxage=600";

    const baseResult = {
      body: validatedBody,
      regionLevel,
    };

    const resolvedQuery = resolveSearchAlias(normalizedQuery);
    const coordinates = parseCoordinates(resolvedQuery);
    if (coordinates) {
      const encoded = await GroundCodes.encode(coordinates, {
        regionLevel,
        language: validatedLanguage as SupportedLanguage,
        body: validatedBody as CelestialBody,
      });

      return {
        query: normalizedQuery,
        results: [
          {
            type: "coordinates",
            label: encoded,
            lat: coordinates.lat,
            lng: coordinates.lng,
            code: encoded,
            ...baseResult,
          },
        ],
      };
    }

    if (resolvedQuery.includes("-")) {
      for (const candidateLanguage of getDecodeLanguages(validatedLanguage)) {
        try {
          const decoded = await GroundCodes.decode(resolvedQuery, {
            regionLevel,
            language: candidateLanguage as SupportedLanguage,
            body: validatedBody as CelestialBody,
          });

          return {
            query: normalizedQuery,
            results: [
              {
                type: "ground-code",
                label: resolvedQuery,
                lat: decoded.lat,
                lng: decoded.lng,
                code: resolvedQuery,
                ...baseResult,
              },
            ],
          };
        } catch {
          // Fall through to other languages and then region-name search.
        }
      }
    }

    const regions: RegionSearchResult[] = [];
    for (const candidateLanguage of getRegionSearchLanguages(
      validatedLanguage,
      resolvedQuery,
    )) {
      const candidateRegions = await findRegionMatches(resolvedQuery, {
        regionLevel,
        language: candidateLanguage as SupportedLanguage,
        body: validatedBody as CelestialBody,
        maxResults: maxResults - regions.length,
        ...(searchBias ?? {}),
      });
      regions.push(...candidateRegions);
      if (regions.length >= maxResults) break;
    }

    return {
      query: normalizedQuery,
      results: regions.map((region) => ({
        type: "region",
        label: region.name ?? normalizedQuery,
        lat: region.lat,
        lng: region.lng,
        code: region.code,
        body: region.body ?? validatedBody,
        regionLevel: region.regionLevel ?? regionLevel,
      })),
    };
  },
  {
    detail: {
      tags: ["Code"],
      summary: "Search ground codes, coordinates, or region names",
      description:
        "Search an encoded Ground Code, a `lat,lng` coordinate pair, or a known region name/code.",
    },
    body: t.Object({
      query: t.String({
        example: "Seoul-Happy-Tiger",
        description:
          "Ground Code, coordinate pair, region name, or region code",
      }),
      regionLevel: t.Optional(
        t.Number({
          default: 2,
          example: 2,
        }),
      ),
      language: t.Optional(
        t.String({
          default: "english",
          example: "english",
          enum: supportedLanguages,
        }),
      ),
      body: t.Optional(
        t.String({
          default: "earth",
          example: "earth",
          enum: ["earth", "moon", "mars"],
        }),
      ),
      maxResults: t.Optional(
        t.Number({
          default: 5,
          minimum: 1,
          maximum: 25,
          example: 5,
        }),
      ),
      biasLat: t.Optional(
        t.Number({
          example: 37.566,
          description:
            "Optional map-center latitude used to rank ambiguous region-name matches.",
        }),
      ),
      biasLng: t.Optional(
        t.Number({
          example: 126.978,
          description:
            "Optional map-center longitude used with biasLat to rank ambiguous region-name matches.",
        }),
      ),
    }),
    response: t.Object({
      query: t.String(),
      results: t.Array(
        t.Object({
          type: t.String(),
          label: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          code: t.Optional(t.String()),
          body: t.String(),
          regionLevel: t.Number(),
        }),
      ),
    }),
  },
);
