import { around } from "@ground-codes/geoint";
import Elysia, { t } from "elysia";
import { encode, SupportedLanguage } from "ground-codes";

export const v1Encode = new Elysia().post(
  "/encode",
  async ({
    body: { lat, lng, regionLevel, language = "English", precisionMeters },
  }) => {
    const center = await around({
      lat,
      lng,
      regionName: `region-${regionLevel}${
        language.toLowerCase() === "english" ? "" : `-${language.toLowerCase()}`
      }`,
      maxResults: 1,
    });

    if (!center || center.length === 0) {
      throw new Error("Failed to find region");
    }

    return await encode(
      { lat, lng },
      {
        regionLevel,
        language: language as SupportedLanguage,
        precisionMeters,
        center: {
          lat: center[0].lat,
          lng: center[0].long,
        },
      }
    );
  },
  {
    detail: {
      tags: ["Code"],
      description: "Encode the coordinates to a ground code",
    },
    body: t.Object({
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
      precisionMeters: t.Optional(
        t.Number({
          default: 3,
          example: 3,
          description: "Precision in meters for encoding",
        })
      ),
    }),
    response: t.String({
      example: "Seoul-Happy-Tiger",
      description: "Encoded ground code",
    }),
  }
);
