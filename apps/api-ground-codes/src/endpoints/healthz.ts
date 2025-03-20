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
