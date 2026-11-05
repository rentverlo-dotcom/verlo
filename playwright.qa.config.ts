import { defineConfig, devices } from '@playwright/test'

const QA_URL = 'https://verlopunto0-b86tp5jnf-verlos-projects-b9e9c595.vercel.app'
const target = process.env.PLAYWRIGHT_QA_BASE_URL || QA_URL

// No fallback to verlo.lat. Only the verified QA deployment can be tested.
if (target !== QA_URL) {
  throw new Error('QA test target is not the verified QA deployment. Refusing to run.')
}

export default defineConfig({
  testDir: './tests/qa',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: target,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'qa-chromium', use: { ...devices['Desktop Chrome'] } }],
})
