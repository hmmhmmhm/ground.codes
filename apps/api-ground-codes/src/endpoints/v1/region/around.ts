import Elysia, { t } from "elysia";
import { around } from "@ground-codes/geoint";

export const v1RegionAround = new Elysia().post(
  "/region/around",
  async ({
    body: {
      lat,
      lng,
      regionLevel = 2,
      language = "English",
      maxResults = 5,
      maxDistance,
    },
  }) => {
    return (
      await around({
        regionName: `region-${regionLevel}${
          language.toLowerCase() === "english"
            ? ""
            : `-${language.toLowerCase()}`
        }`,
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
          })
        ),
        language: t.Optional(
          t.String({
            default: "English",
            example: "English",
            description: "Language for word set encoding",
            enum: ["English", "Korean"],
          })
        ),
        maxResults: t.Optional(
          t.Number({
            default: 5,
            example: 5,
            maximum: 100,
            description: "Maximum number of results",
          })
        ),
        maxDistance: t.Optional(
          t.Number({
            description: "Maximum distance in meters",
          })
        ),
      },
      {
        examples: [
          {
            lat: 37.422,
            lng: 127.024,
            regionLevel: 2,
            language: "English",
            maxResults: 5,
          },
        ],
      }
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
          })
        ),
        countryCode: t.Optional(
          t.String({
            example: "KR",
            description: "Country code of the region",
          })
        ),
      })
    ),
  }
);
