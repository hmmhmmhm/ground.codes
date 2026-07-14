import { Elysia } from "elysia";
import { healthz, readyz } from "./endpoints/healthz.js";
import {
  createSwaggerEndpoint,
  openApiReferenceEndpoint,
  swaggerRedirectEndpoint,
} from "./endpoints/swagger.js";
import { createCorsEndpoint } from "./endpoints/cors.js";
import { codeEndpoint } from "./endpoints/code.js";
import { docsEndpoint } from "./endpoints/docs.js";
import { legacyEndpoints, v1Endpoints } from "./endpoints/v1/v1-endpoints.js";
import { formatApiError } from "./endpoints/v1/api-error.js";
import {
  createMetricsEndpoint,
  type MetricsOptions,
} from "./endpoints/metrics.js";
import {
  createRateLimitEndpoint,
  getDefaultRateLimit,
  RateLimitOptions,
} from "./endpoints/rate-limit.js";

interface AppOptions {
  port?: string | number;
  rateLimit?: RateLimitOptions | null;
  corsOrigins?: string[];
  metrics?: MetricsOptions;
}

/**
 * Create an Elysia application instance.
 *
 * @param portOrOptions Optional port or app options. Omit this in tests to use `app.handle()`.
 * @returns An Elysia application instance.
 */
export const createApp = (portOrOptions?: string | number | AppOptions) => {
  const options: AppOptions =
    typeof portOrOptions === "object" ? portOrOptions : { port: portOrOptions };
  const rateLimit =
    "rateLimit" in options ? options.rateLimit : getDefaultRateLimit();
  const metricsEndpoint = createMetricsEndpoint(options.metrics);

  const app = new Elysia({ aot: false })
    .use(metricsEndpoint)
    .onError(({ error, code, set }) => formatApiError(error, code, set))
    .use(createCorsEndpoint(options.corsOrigins))
    .use(createRateLimitEndpoint(rateLimit))
    .use(swaggerRedirectEndpoint)
    .use(openApiReferenceEndpoint)
    .use(docsEndpoint)
    .use(createSwaggerEndpoint())
    .use(healthz)
    .use(readyz)
    .use(v1Endpoints)
    .use(legacyEndpoints)
    .use(codeEndpoint);

  const installCompletionBoundary = () => {
    const fetch = app.fetch;
    const handle = async (request: Request) => {
      const response = await fetch(request);
      metricsEndpoint.completeResponse(request, response);
      return response;
    };
    Object.defineProperty(app, "fetch", {
      value: handle,
      configurable: true,
      writable: true,
    });
    app.handle = handle;
  };

  const compile = app.compile.bind(app);
  app.compile = () => {
    compile();
    installCompletionBoundary();
    return app;
  };
  installCompletionBoundary();

  return options.port === undefined ? app : app.listen(options.port);
};
