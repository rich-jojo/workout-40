import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL,
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure'
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- --port 4173',
    url: baseURL,
    reuseExistingServer: false
  },
  projects: [
    {
      name: 'android',
      use: { ...devices['Pixel 7'] }
    }
  ]
});
