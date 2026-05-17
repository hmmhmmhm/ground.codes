import { readFile, writeFile } from "node:fs/promises";

const routesUrl = new URL("../.vercel/output/static/_routes.json", import.meta.url);
const routes = JSON.parse(await readFile(routesUrl, "utf8"));

const patchedRoutes = {
  version: routes.version ?? 1,
  description: `${routes.description ?? "Built with @cloudflare/next-on-pages."} Function routes are limited so share URLs can use the static app shell.`,
  include: ["/api/*", "/robots.txt", "/sitemap.xml"],
  exclude: ["/_next/static/*"],
};

await writeFile(routesUrl, `${JSON.stringify(patchedRoutes)}\n`);
console.log("Patched Cloudflare Pages function routes for static share URLs.");
