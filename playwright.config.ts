import { defineConfig, devices } from "@playwright/test";

/**
 * Two projects (eng 7A): iPhone 14 on WebKit and desktop Chromium, plus a
 * reduced-motion variant of each. Tests run against a production build
 * (`next start`) so the raw-HTML hero island and static OG routes are the
 * real thing. PREVIEW_URL switches the logged-out preview check to a
 * deployed Vercel URL (T7).
 */
const port = Number(process.env.PW_PORT ?? 3210);
const baseURL = process.env.PREVIEW_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "test/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 14"] }, testIgnore: /reduced-motion/ },
    // Playwright's open-source Chromium has no H.264; branded Chrome does.
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } }, testIgnore: /reduced-motion/ },
    { name: "iphone-reduced-motion", use: { ...devices["iPhone 14"], contextOptions: { reducedMotion: "reduce" } }, testMatch: /reduced-motion/ },
    { name: "desktop-reduced-motion", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" } }, testMatch: /reduced-motion/ },
  ],
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: `SITE_STAGE=review npx next start -p ${port}`,
        url: `${baseURL}/dark`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
