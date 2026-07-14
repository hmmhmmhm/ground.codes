import { createApp } from "./app.js";

interface ServerApplication {
  server?: { hostname?: string; port?: string | number } | null;
}

interface StartServerOptions {
  port?: string | number;
  createApplication?: (port: string | number) => ServerApplication;
  clearConsole?: () => void;
  writeLog?: (message: string) => void;
}

export const startServer = ({
  port = process.env.PORT ?? 3000,
  createApplication = createApp,
  clearConsole = console.clear,
  writeLog = console.log,
}: StartServerOptions = {}) => {
  clearConsole();

  // * Print initialization message
  writeLog("🚀 Initializing Ground Codes API server...");

  // * Create the app
  const app = createApplication(port);

  writeLog(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
  );

  return app;
};

if (import.meta.main) startServer();
