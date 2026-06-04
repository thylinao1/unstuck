import { defineConfig, devices } from '@playwright/test'

// Runs against a LOCAL build by default (no production billing, no coupling CI to
// prod uptime). Point at the live deploy explicitly for a smoke test:
//   E2E_BASE_URL=https://unstuck-theta.vercel.app npm run test:e2e
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const isLocal = baseURL.includes('localhost')

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Build + start a local server for the suite, reusing one if it's already up.
  // Skipped when an explicit remote E2E_BASE_URL is given.
  webServer: isLocal
    ? {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
