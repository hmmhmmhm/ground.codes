import { around, info } from "@ground-codes/geoint";
import Elysia, { redirect, t } from "elysia";
import { decode, encode } from "ground-codes";

export const codeEndpoint = new Elysia().get(
  "/*",
  async ({ path }) => {
    const input = decodeURIComponent(path)
      .replace(/^\//, "")
      .replace(/\/$/, "");

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
        language: "English",
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
    return redirect("/");
  },
  {
    detail: {
      tags: ["Code"],
      description: "Encode & Decode endpoint",
    },
  }
);
