import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.VITE_PORT || '5173';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
