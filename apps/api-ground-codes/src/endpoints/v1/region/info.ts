import Elysia, { t } from "elysia";
import { info } from "@ground-codes/geoint/src/index.ts";
import { getRegionDatasetName, supportedLanguages } from "../language.js";
import {
  validateBody,
  validateLanguage,
  validateRegionLevel,
  validateSearchQuery,
} from "../validation.js";
import { loadRegionDataset } from "./load-region.js";

export const v1RegionInfo = new Elysia().post(
  "/region/info",
  async ({
    body: { name, language = "english", regionLevel = 2, body = "earth" },
  }) => {
    const query = validateSearchQuery(name);
    const validatedLanguage = validateLanguage(language);
    const validatedBody = validateBody(body);
    validateRegionLevel({ body: validatedBody, regionLevel });

    const regionName = getRegionDatasetName({
      body: validatedBody,
      language: validatedLanguage,
      regionLevel,
    });
    await loadRegionDataset(regionName);

    const data = await info({
      name: query,
      regionName,
    });

    if (!data) {
      throw new Error("Failed to find region");
    }

    return {
      name: data.name,
      code: data.code,
      lat: data.lat,
      lng: data.long,
      population: data.population,
      countryCode: data.countryCode,
    };
  },
  {
    detail: {
      tags: ["Code"],
      summary: "Get information about a region",
      description: "Get information about a region",
    },
    body: t.Object({
      name: t.String({
        example: "Seoul",
        description: "Region name",
      }),
      language: t.Optional(
        t.String({
          default: "english",
          example: "english",
          description: "Language for word set encoding",
          enum: supportedLanguages,
        }),
      ),
      regionLevel: t.Optional(
        t.Number({
          default: 2,
          example: 2,
          description:
            "Region level for encoding (2: City Name, 1: Airport Code)",
        }),
      ),
      body: t.Optional(
        t.String({
          default: "earth",
          example: "moon",
          description: "Celestial body for region lookup",
          enum: ["earth", "moon", "mars"],
        }),
      ),
    }),

    response: t.Object({
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
  },
);
