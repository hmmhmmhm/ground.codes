import swagger from "@elysiajs/swagger";
import Elysia, { redirect } from "elysia";

const publicDocPathsToHide = [
  "/json",
  "/encode",
  "/decode",
  "/search",
  "/docs",
  "/reference",
  "/openapi",
  "/region/around",
  "/region/info",
  "/{path}",
];

const scalarReferenceConfig = {
  theme: "mars" as const,
  darkMode: true,
  forceDarkModeState: "dark" as const,
  hideClientButton: true,
  hideDarkModeToggle: true,
  hideModels: true,
  hiddenClients: true as const,
  defaultHttpClient: {
    targetKey: "shell" as const,
    clientKey: "curl",
  },
  customCss: `
    .scalar-mcp-layer,
    .scalar-mcp-layer-link,
    .gitbook-show.scalar-version-number,
    .references-developer-tools,
    .agent-button-container,
    button[id^="headlessui-popover-button-scalar-refs-"],
    button.bg-sidebar-b-search.whitespace-nowrap,
    a[href*="scalar.com"],
    [aria-label="Deploy"],
    [aria-label="Share"],
    [aria-label="Configure"],
    [aria-label="Developer Tools"],
    [aria-label="Ask AI"] {
      display: none !important;
    }
  `,
  favicon: "/favicon.ico",
};

export const swaggerEndpoint = swagger({
  path: "/openapi-json",
  exclude: publicDocPathsToHide,
  scalarConfig: scalarReferenceConfig,
  documentation: {
    info: {
      title: "Ground Codes API Documentation",
      description:
        "Production API documentation for Ground Codes. Use the versioned `/v1/*` endpoints for new integrations. Quick start: POST `/v1/encode` with `{ \"lat\": 37.566, \"lng\": 126.978, \"language\": \"english\", \"regionLevel\": 2 }`, then POST `/v1/search` with the returned code or share it as `https://ground.codes/{encoded-code}`. Earth share URLs are code-only; Moon and Mars use `/moon/{encoded-code}` and `/mars/{encoded-code}`.",
      version: "1.0.0",
    },
    tags: [
      {
        name: "Code",
        description: "Encode & Decode endpoint",
      },
      {
        name: "Health",
        description: "Endpoint to check the health of the server.",
      },
    ],
    // 서버 설정 추가
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
  },
});

const openApiReferenceHtml = `<!doctype html>
<html>
  <head>
    <title>Ground Codes API Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; }
      ${scalarReferenceConfig.customCss}
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi-json/json"
      data-configuration='${JSON.stringify({
        spec: { url: "/openapi-json/json" },
        ...scalarReferenceConfig,
        _integration: "ground-codes",
      })}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.min.js" crossorigin></script>
  </body>
</html>`;

export const openApiReferenceEndpoint = new Elysia()
  .get(
    "/openapi/",
    ({ set }) => {
      set.headers["cache-control"] = "public, max-age=300";
      set.headers["content-type"] = "text/html; charset=utf-8";
      return openApiReferenceHtml;
    },
    {
      detail: {
        hide: true,
      },
    },
  )
  .get(
    "/openapi/json",
    () => redirect("/openapi-json/json"),
    {
      detail: {
        hide: true,
      },
    },
  );

export const swaggerRedirectEndpoint = new Elysia()
  .get(
    "/json",
    () => redirect("/openapi-json/json"),
    {
      detail: {
        hide: true,
      },
    },
  )
  .get(
    "/reference",
    () => redirect("/openapi/"),
    {
      detail: {
        hide: true,
      },
    },
  )
  .get(
    "/swagger",
    () => redirect("/openapi/"),
    {
      detail: {
        hide: true,
      },
    },
  )
  .get(
    "/swagger/",
    () => redirect("/openapi/"),
    {
      detail: {
        hide: true,
      },
    },
  )
  .get(
    "/swagger/json",
    () => redirect("/openapi-json/json"),
    {
      detail: {
        hide: true,
      },
    },
  );
