import { describe, expect, test } from "bun:test";
import * as workerModule from "./worker.js";

interface TestApp {
  handle(request: Request): Promise<Response>;
}

type CreateWorker = (dependencies?: {
  createApplication?: () => TestApp;
  installRegionStore?: (connectionString: string) => void;
  installRuntimeMetadata?: (env: Record<string, unknown>) => void;
}) => {
  fetch(request: Request, env: Record<string, unknown>): Promise<Response>;
};

const getCreateWorker = () =>
  (workerModule as unknown as { createWorker?: CreateWorker }).createWorker;

describe("Cloudflare Worker initialization", () => {
  test("does not construct a Response while evaluating the worker module", () => {
    const guardedImport = Bun.spawnSync(
      [
        "bun",
        "-e",
        `
          const NativeResponse = globalThis.Response;
          globalThis.Response = new Proxy(NativeResponse, {
            construct() {
              throw new Error("Response constructed during module evaluation");
            },
          });
          await import("./worker.ts");
        `,
      ],
      { cwd: import.meta.dir, stderr: "pipe", stdout: "pipe" },
    );

    expect(guardedImport.exitCode).toBe(0);
  });

  test("creates one application lazily after installing request environment", async () => {
    const createWorker = getCreateWorker();
    expect(createWorker).toBeFunction();
    if (!createWorker) return;

    const events: string[] = [];
    const app: TestApp = {
      async handle() {
        events.push("handle");
        return new Response("ok");
      },
    };
    const worker = createWorker({
      createApplication: () => {
        events.push("create");
        return app;
      },
      installRuntimeMetadata: () => events.push("metadata"),
      installRegionStore: () => events.push("region"),
    });

    expect(events).toEqual([]);

    const env = {
      HYPERDRIVE: { connectionString: "postgres://example" },
    };
    expect(
      await (
        await worker.fetch(new Request("http://localhost/readyz"), env)
      ).text(),
    ).toBe("ok");
    expect(
      await (
        await worker.fetch(new Request("http://localhost/healthz"), env)
      ).text(),
    ).toBe("ok");

    expect(events).toEqual([
      "metadata",
      "region",
      "create",
      "handle",
      "metadata",
      "handle",
    ]);
  });
});
