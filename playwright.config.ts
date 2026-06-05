import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load backend/.env.test into process.env so test files can read env vars
// (the webServer gets them via --env-file, but the test process does not)
const testEnvPath = path.join(__dirname, 'backend/.env.test');
if (fs.existsSync(testEnvPath)) {
	for (const line of fs.readFileSync(testEnvPath, 'utf-8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		process.env[key] ??= val;
	}
}

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
		screenshot: 'on',
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
