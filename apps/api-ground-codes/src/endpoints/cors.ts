import cors from "@elysiajs/cors";
import Elysia from "elysia";

export const getAllowedOriginsFromEnv = () =>
  process.env.CORS_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const createCorsEndpoint = (
  allowedOrigins = getAllowedOriginsFromEnv(),
) =>
  new Elysia()
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
        origin:
          allowedOrigins && allowedOrigins.length > 0
            ? (request: Request) => {
                const origin = request.headers.get("origin");
                return origin ? allowedOrigins.includes(origin) : false;
              }
            : true,
      }),
    );
