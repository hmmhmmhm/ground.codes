import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter api-ground-codes start",
      cwd: "../..",
      url: "http://127.0.0.1:3000/readyz",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        "NEXT_PUBLIC_GROUND_CODES_API_URL=http://127.0.0.1:3000 pnpm --filter web exec next dev -p 3001",
      cwd: "../..",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
