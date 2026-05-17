import Elysia, { t } from "elysia";
import {
  type CelestialBody,
  decode,
  type SupportedLanguage,
} from "ground-codes/src/index.ts";
import { supportedLanguages } from "./language.js";
import {
  validateBody,
  validateLanguage,
  validateRegionLevel,
  validateSearchQuery,
} from "./validation.js";

export const v1Decode = new Elysia().post(
  "/decode",
  async ({
    body: {
      code,
      regionLevel = 2,
      language = "english",
      body: celestialBody = "earth",
    },
  }) => {
    const query = validateSearchQuery(code);
    const validatedLanguage = validateLanguage(language);
    const validatedBody = validateBody(celestialBody);
    validateRegionLevel({ body: validatedBody, regionLevel });

    return await decode(code, {
      regionLevel,
      language: validatedLanguage as SupportedLanguage,
      body: validatedBody as CelestialBody,
    });
  },
  {
    detail: {
      tags: ["Code"],
      summary: "Decode a ground code to coordinates",
      description: "Decode a ground code to coordinates",
    },
    body: t.Object({
      code: t.String({
        example: "Seoul-Happy-Tiger",
        description: "Ground code to decode",
      }),
      regionLevel: t.Optional(
        t.Number({
          default: 2,
          example: 2,
          description:
            "Region level for decoding (2: City Name, 1: Airport Code)",
        }),
      ),
      language: t.Optional(
        t.String({
          default: "english",
          example: "english",
          description: "Language for word set decoding",
          enum: supportedLanguages,
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
    response: t.Object({
      lat: t.Number(),
      lng: t.Number(),
    }),
  },
);
