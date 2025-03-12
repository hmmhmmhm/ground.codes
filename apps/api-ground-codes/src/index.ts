import { createApp } from "./app.js";
import { load } from "@ground-codes/geoint";

void (async function () {
  console.clear();

  // * Print initialization message
  console.log("🚀 Initializing Ground Codes API server...");

  // * Load region data
  await load();

  // * Create the app
  const app = createApp(process.env.PORT ?? 3000);

  console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
  );
})();
