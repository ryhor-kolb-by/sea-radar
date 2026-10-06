import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: BASE_URL,
  },
  projects: [
    {
      name: 'chromium',
      testMatch: ['**/selection.spec.ts', '**/*.browser.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'node',
      testMatch: '**/*.synthetic.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
  },
});
