import Elysia, { t } from "elysia";
import { CelestialBody, encode, SupportedLanguage } from "ground-codes";
import { supportedLanguages } from "./language.js";
import {
  validateBody,
  validateCoordinates,
  validateLanguage,
  validatePrecisionMeters,
  validateRegionLevel,
} from "./validation.js";

export const v1Encode = new Elysia().post(
  "/encode",
  async ({
    body: {
      lat,
      lng,
      regionLevel = 2,
      language = "english",
      precisionMeters,
      body: celestialBody = "earth",
    },
  }) => {
    validateCoordinates({ lat, lng });
    const validatedLanguage = validateLanguage(language);
    const validatedBody = validateBody(celestialBody);
    validateRegionLevel({ body: validatedBody, regionLevel });
    validatePrecisionMeters(precisionMeters);

    const encodeOptions: {
      regionLevel: number;
      language: SupportedLanguage;
      precisionMeters?: number;
      body: CelestialBody;
    } = {
      regionLevel,
      language: validatedLanguage as SupportedLanguage,
      body: validatedBody as CelestialBody,
    };

    if (precisionMeters !== undefined) {
      encodeOptions.precisionMeters = precisionMeters;
    }

    return await encode({ lat, lng }, encodeOptions);
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
      precisionMeters: t.Optional(
        t.Number({
          default: 3,
          example: 3,
          description: "Precision in meters for encoding",
        }),
      ),
      body: t.Optional(
        t.String({
          default: "earth",
          example: "moon",
          description: "Celestial body for coordinate conversion and labels",
          enum: ["earth", "moon", "mars"],
        }),
      ),
    }),
    response: t.String({
      example: "Seoul-Happy-Tiger",
      description: "Encoded ground code",
    }),
  },
);
