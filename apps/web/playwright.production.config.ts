import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  workers: 1,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "env -u FORCE_COLOR pnpm --filter api-ground-codes start",
      cwd: "../..",
      url: "http://127.0.0.1:3000/readyz",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        "env -u FORCE_COLOR NEXT_PUBLIC_GROUND_CODES_API_URL=http://127.0.0.1:3000 pnpm --filter web build && env -u FORCE_COLOR NEXT_PUBLIC_GROUND_CODES_API_URL=http://127.0.0.1:3000 pnpm --filter web exec next start -p 3001",
      cwd: "../..",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
