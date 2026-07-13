import { createApp } from "./app.js";

void (async function () {
  console.clear();

  // * Print initialization message
  console.log("🚀 Initializing Ground Codes API server...");

  // * Create the app
  const app = createApp(process.env.PORT ?? 3000);

  console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
  );
})();
