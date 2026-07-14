import { describe, expect, test } from "bun:test";
import { startServer } from "./index.js";

describe("API server entrypoint", () => {
  test("starts the application with the configured port and existing console contract", () => {
    const messages: string[] = [];
    const ports: Array<string | number> = [];
    let clearCount = 0;
    const application = {
      server: { hostname: "127.0.0.1", port: 4310 },
    };

    const result = startServer({
      port: "4310",
      clearConsole: () => {
        clearCount += 1;
      },
      writeLog: (message) => messages.push(message),
      createApplication: (port) => {
        ports.push(port);
        return application;
      },
    });

    expect(result).toBe(application);
    expect(ports).toEqual(["4310"]);
    expect(clearCount).toBe(1);
    expect(messages).toEqual([
      "🚀 Initializing Ground Codes API server...",
      "🦊 Elysia is running at http://127.0.0.1:4310",
    ]);
  });

  test("keeps the environment and numeric default port semantics", () => {
    const previousPort = process.env.PORT;
    const ports: Array<string | number> = [];
    const start = () =>
      startServer({
        clearConsole: () => undefined,
        writeLog: () => undefined,
        createApplication: (port) => {
          ports.push(port);
          return {};
        },
      });

    try {
      process.env.PORT = "4321";
      start();
      delete process.env.PORT;
      start();
      expect(ports).toEqual(["4321", 3000]);
    } finally {
      if (previousPort === undefined) delete process.env.PORT;
      else process.env.PORT = previousPort;
    }
  });
});
