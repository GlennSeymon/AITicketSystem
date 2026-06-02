import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
  webServer: [
    {
      command: 'bun --env-file .env.test src/index.ts',
      cwd: path.join(__dirname, 'backend'),
      url: 'http://localhost:3002/api/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'API_PORT=3002 bun run dev -- --port 3001',
      cwd: path.join(__dirname, 'frontend'),
      url: 'http://localhost:3001',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
