import { defineConfig, devices } from '@playwright/test'

// Explicitly pin the independently verified QA deployment; never default to Production.
const QA_URL = 'https://verlopunto0-1oy0qgpf3-verlos-projects-b9e9c595.vercel.app'
const target = process.env.PLAYWRIGHT_QA_BASE_URL || QA_URL

if (target !== QA_URL) {
  throw new Error('Unverified QA test URL: refusing to run against a different deployment')
}

export default defineConfig({
  testDir: './tests/qa',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: target,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'qa-chromium', use: { ...devices['Desktop Chrome'] } }],
})
