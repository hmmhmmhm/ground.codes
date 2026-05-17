import Elysia, { t } from "elysia";
import { around } from "@ground-codes/geoint/src/index.ts";
import { getRegionDatasetName, supportedLanguages } from "../language.js";
import {
  validateBody,
  validateCoordinates,
  validateLanguage,
  validateMaxResults,
  validateRegionLevel,
} from "../validation.js";
import { loadRegionDataset } from "./load-region.js";

export const v1RegionAround = new Elysia().post(
  "/region/around",
  async ({
    body: {
      lat,
      lng,
      regionLevel = 2,
      language = "english",
      maxResults = 5,
      maxDistance,
      body = "earth",
    },
  }) => {
    validateCoordinates({ lat, lng });
    const validatedLanguage = validateLanguage(language);
    const validatedBody = validateBody(body);
    validateRegionLevel({ body: validatedBody, regionLevel });
    validateMaxResults(maxResults);

    const regionName = getRegionDatasetName({
      body: validatedBody,
      language: validatedLanguage,
      regionLevel,
    });
    await loadRegionDataset(regionName);

    return (
      await around({
        regionName,
        lat,
        lng,
        maxResults,
        maxDistance,
      })
    )?.map((region) => ({
      name: region.name,
      code: region.code,
      lat: region.lat,
      lng: region.long,
      population: region.population,
      countryCode: region.countryCode,
    }));
  },
  {
    detail: {
      tags: ["Code"],
      summary: "Find regions around a point",
      description: "Find regions around a point",
    },
    body: t.Object(
      {
        lat: t.Number({
          example: 37.422,
          description: "Latitude of the point to encode",
        }),
        lng: t.Number({
          example: 127.024,
          description: "Longitude of the point to encode",
        }),
        regionLevel: t.Optional(
          t.Number({
            default: 2,
            example: 2,
            description:
              "Region level for encoding (2: City Name, 1: Airport Code)",
          }),
        ),
        language: t.Optional(
          t.String({
            default: "english",
            example: "english",
            description: "Language for word set encoding",
            enum: supportedLanguages,
          }),
        ),
        maxResults: t.Optional(
          t.Number({
            default: 5,
            example: 5,
            maximum: 100,
            description: "Maximum number of results",
          }),
        ),
        maxDistance: t.Optional(
          t.Number({
            description: "Maximum distance in meters",
          }),
        ),
        body: t.Optional(
          t.String({
            default: "earth",
            example: "mars",
            description: "Celestial body for region lookup",
            enum: ["earth", "moon", "mars"],
          }),
        ),
      },
      {
        examples: [
          {
            lat: 37.422,
            lng: 127.024,
            regionLevel: 2,
            language: "english",
            maxResults: 5,
          },
        ],
      },
    ),
    response: t.Array(
      t.Object({
        name: t.String({
          example: "Seoul",
          description: "Region name",
        }),
        code: t.String({
          example: "Seoul",
          description: "Region code",
        }),
        lat: t.Number({
          example: 37.422,
          description: "Latitude of the region",
        }),
        lng: t.Number({
          example: 127.024,
          description: "Longitude of the region",
        }),
        population: t.Optional(
          t.Number({
            example: 1000000,
            description: "Population of the region",
          }),
        ),
        countryCode: t.Optional(
          t.String({
            example: "KR",
            description: "Country code of the region",
          }),
        ),
      }),
    ),
  },
);
