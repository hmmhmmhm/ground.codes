import Elysia, { t } from "elysia";
import { info } from "@ground-codes/geoint";

export const v1RegionInfo = new Elysia().post(
  "/region/info",
  async ({ body: { name, language = "English", regionLevel = 2 } }) => {
    const data = await info({
      name,
      regionName: `region-${regionLevel}${
        language.toLowerCase() === "english" ? "" : `-${language.toLowerCase()}`
      }`,
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
      description: "Get information about a region",
    },
    body: t.Object({
      name: t.String({
        example: "Seoul",
        description: "Region name",
      }),
      language: t.Optional(
        t.String({
          default: "English",
          example: "English",
          description: "Language for word set encoding",
          enum: ["English", "Korean"],
        })
      ),
      regionLevel: t.Optional(
        t.Number({
          default: 2,
          example: 2,
          description:
            "Region level for encoding (2: City Name, 1: Airport Code)",
        })
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
        })
      ),
      countryCode: t.Optional(
        t.String({
          example: "KR",
          description: "Country code of the region",
        })
      ),
    }),
  }
);
