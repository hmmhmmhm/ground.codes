import { around, info } from "@ground-codes/geoint";
import Elysia, { redirect, t } from "elysia";
import { decode, encode } from "ground-codes";

export const codeEndpoint = new Elysia().get(
  "/:path",
  async ({ params, set }) => {
    const input = decodeURIComponent(params.path || "")
      .replace(/^\//, "")
      .replace(/\/$/, "");

    // 입력이 없거나 {path}인 경우 (Swagger UI 테스트 시)
    if (!input || input === "{path}") {
      return {
        message: "Path parameter required",
        examples: {
          encoding: "37.566,126.97758167241173 (latitude,longitude)",
          decoding: "Seoul-Happy-Tiger (region-encodedstring)",
        },
      };
    }

    if (input.includes("-")) {
      const codes = input.split("-");
      const name = codes[0];
      const encoded = codes.slice(1).join("-");
      const center = await info({
        name,
        regionName: "region-2",
      });

      return await decode(encoded, {
        center: {
          lat: center.lat,
          lng: center.long,
        },
        regionLevel: 2,
        language: "english",
      });
    }
    if (input.includes(",")) {
      const [lat, lng] = input.split(",").map(Number);
      const center = await around({
        lat,
        lng,
        regionName: "region-2",
        maxResults: 1,
      });

      const encoded = await encode(
        { lat, lng },
        {
          center: {
            lat: center[0].lat,
            lng: center[0].long,
          },
          regionLevel: 2,
        }
      );

      return `${center[0].name}-${encoded}`;
    }

    // If path is undecodable, redirect to root
    set.redirect = "/";
    return null;
  },
  {
    params: t.Object({
      path: t.String({
        description:
          "Path parameter for encoding/decoding. Use one of these formats:\n" +
          "1. For encoding: `latitude,longitude` (e.g., `37.566,126.97758167241173`)\n" +
          "2. For decoding: `region-encodedstring` (e.g., `seoul-happy-tiger`)",
        examples: ["37.566,126.97758167241173", "Seoul-Happy-Tiger"],
      }),
    }),
    response: t.Union([
      t.String({
        description: "Encoded result (when input is 'lat,lng')",
        examples: ["Seoul-Happy-Tiger"],
      }),
      t.Object(
        {
          lat: t.Number({
            examples: [37.566],
          }),
          lng: t.Number({
            examples: [126.978],
          }),
        },
        {
          description: "Decoded result (when input is 'name-encoded')",
        }
      ),
      t.Object(
        {
          message: t.String(),
          examples: t.Object({
            encoding: t.String(),
            decoding: t.String(),
          }),
        },
        {
          description: "Help message",
        }
      ),
      t.Null(),
    ]),
    detail: {
      tags: ["Code"],
      summary: "Location Encoding and Decoding",
      description:
        "Encode coordinates or decode encoded strings using a single endpoint.\n\n" +
        "**How to test in Swagger UI:**\n" +
        "1. Click 'Try it out'\n" +
        "2. In the path parameter field, enter one of these values:\n" +
        "   - For encoding coordinates: `37.566,126.97758167241173`\n" +
        "   - For decoding a code: `Seoul-Happy-Tiger`\n" +
        "3. Click 'Execute'\n\n" +
        "**Important:** `{path}` must be directly specified. Example: `37.566,126.97758167241173`",
      operationId: "encodeDecodeLocation",
    },
  }
);

// Root path redirect endpoint
export const rootRedirectEndpoint = new Elysia().get(
  "/",
  ({ set }) => {
    set.redirect = "/";
    return null;
  },
  {
    response: t.Null(),
    detail: {
      tags: ["Code"],
      summary: "Root Path",
      description: "Redirects to the root path.",
      operationId: "rootRedirect",
    },
  }
);
