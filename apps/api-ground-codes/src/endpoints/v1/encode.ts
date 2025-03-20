import { around } from "@ground-codes/geoint";
import Elysia, { t } from "elysia";
import { encode, SupportedLanguage } from "ground-codes";

export const v1Encode = new Elysia().post(
  "/encode",
  async ({
    body: { lat, lng, regionLevel = 2, language = "english", precisionMeters },
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

    const encodeOptions: {
      regionLevel: number;
      language: SupportedLanguage;
      center: { lat: number; lng: number };
      precisionMeters?: number;
    } = {
      regionLevel,
      language: language as SupportedLanguage,
      center: {
        lat: center[0].lat,
        lng: center[0].long,
      },
    };

    if (precisionMeters !== undefined) {
      encodeOptions.precisionMeters = precisionMeters;
    }

    const encoded = await encode({ lat, lng }, encodeOptions);

    return `${regionLevel === 1 ? center[0].code : center[0].name}-${encoded}`;
  },
  {
    detail: {
      tags: ["Code"],
      summary: "Encode the coordinates to a ground code",
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
          default: "english",
          example: "english",
          description: "Language for word set encoding",
          enum: ["english", "korean", "chinese"],
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
