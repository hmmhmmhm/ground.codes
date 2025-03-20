import { info } from "@ground-codes/geoint";
import Elysia, { t } from "elysia";
import { decode, SupportedLanguage } from "ground-codes";

export const v1Decode = new Elysia().post(
  "/decode",
  async ({ body: { code, regionLevel = 2, language = "english" } }) => {
    const codes = code.split("-");
    const name = codes[0];
    const encoded = codes.slice(1).join("-");

    const center = await info({
      name,
      regionName: `region-${regionLevel}${
        language.toLowerCase() === "english" ? "" : `-${language.toLowerCase()}`
      }`,
    });

    return await decode(encoded, {
      center: {
        lat: center.lat,
        lng: center.long,
      },
      regionLevel,
      language: language as SupportedLanguage,
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
        })
      ),
      language: t.Optional(
        t.String({
          default: "english",
          example: "english",
          description: "Language for word set decoding",
          enum: ["english", "korean", "chinese"],
        })
      ),
    }),
    response: t.Object({
      lat: t.Number(),
      lng: t.Number(),
    }),
  }
);
