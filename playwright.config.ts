import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // The development server compiles routes on demand; serial smoke tests avoid
  // competing cold compilations and make navigation assertions deterministic.
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  expect: {
    timeout: 60_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev -- --port 3100",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
