import cors from "@elysiajs/cors";
import Elysia from "elysia";

export const corsEndpoint = new Elysia()
  .onAfterHandle(({ request, set }) => {
    // * Only process CORS requests
    if (request.method !== "OPTIONS") return;

    const allowHeader = set.headers["Access-Control-Allow-Headers"];
    if (allowHeader === "*") {
      set.headers["Access-Control-Allow-Headers"] =
        request.headers.get("Access-Control-Request-Headers") ?? "";
    }
  })
  .use(
    cors({
      origin: true,
    })
  );
