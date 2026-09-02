import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",

  use: {
    baseURL: "https://verlo.lat",
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
