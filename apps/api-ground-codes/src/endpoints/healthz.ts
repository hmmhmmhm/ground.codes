import Elysia, { t } from "elysia";

export const healthz = new Elysia().get(
  "/healthz",
  async () => {
    return "OK";
  },
  {
    detail: {
      tags: ["Health"],
      summary: "Health Check",
      description: "Health check endpoint",
    },
    response: t.String({
      description: "Health check response",
      example: "OK",
    }),
  }
);

export const readyz = new Elysia().get(
  "/readyz",
  async ({ set }) => {
    set.headers["cache-control"] = "no-store";

    return {
      status: "ready",
      service: "api-ground-codes",
    };
  },
  {
    detail: {
      tags: ["Health"],
      summary: "Readiness Check",
      description: "Deployment readiness endpoint",
    },
    response: t.Object({
      status: t.String({
        example: "ready",
      }),
      service: t.String({
        example: "api-ground-codes",
      }),
    }),
  }
);
