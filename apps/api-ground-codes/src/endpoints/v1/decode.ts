import Elysia, { t } from "elysia";
import { decode, SupportedLanguage } from "ground-codes";

export const v1Decode = new Elysia().post(
  "/decode",
  async ({ body: { code, regionLevel, language } }) => {
    return await decode(code, {
      regionLevel,
      language: language as SupportedLanguage,
    });
  },
  {
    detail: {
      tags: ["Code"],
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
        })
      ),
      language: t.Optional(
        t.String({
          default: "English",
          example: "English",
          description: "Language for word set decoding",
          enum: ["English", "Korean"],
        })
      ),
    }),
    response: t.Object({
      lat: t.Number(),
      lng: t.Number(),
    }),
  }
);
