import Elysia, { redirect, t } from "elysia";
import { decode, encode } from "ground-codes";

export const codeEndpoint = new Elysia().get(
  "/*",
  async ({ path }) => {
    const input = decodeURIComponent(path)
      .replace(/^\//, "")
      .replace(/\/$/, "");

    if (input.includes("-")) {
      return await decode(input);
    }
    if (input.includes(",")) {
      const [lat, lng] = input.split(",").map(Number);
      return await encode({ lat, lng });
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
