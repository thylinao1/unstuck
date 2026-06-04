import { defineConfig, devices } from '@playwright/test'

// Runs against the live deploy by default. For local runs:
//   npm run build && npm start   (in one shell)
//   E2E_BASE_URL=http://localhost:3000 npm run test:e2e
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://unstuck-theta.vercel.app',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
