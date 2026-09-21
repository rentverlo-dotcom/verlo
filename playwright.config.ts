import { defineConfig, devices } from "playwright/test"

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://verlo.lat"

export default defineConfig({
  testDir: "./tests",

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
})
