import { Elysia } from "elysia";
import { healthz } from "./endpoints/healthz.js";
import { swaggerEndpoint } from "./endpoints/swagger.js";
import { corsEndpoint } from "./endpoints/cors.js";
import { staticPlugin } from "@elysiajs/static";
import { codeEndpoint, rootRedirectEndpoint } from "./endpoints/code.js";
import { v1Endpoints } from "./endpoints/v1/v1-endpoints.js";

/**
 * Create an Elysia application instance that listens on the specified port.
 *
 * @param port The port to listen on.
 * @returns An Elysia application instance.
 */
export const createApp = (port: string | number) =>
  new Elysia()
    .use(
      staticPlugin({
        prefix: "/",
      })
    )
    .use(corsEndpoint)
    .use(swaggerEndpoint)
    .use(healthz)
    .use(codeEndpoint)
    .use(rootRedirectEndpoint)
    .use(v1Endpoints)
    .listen(port);
