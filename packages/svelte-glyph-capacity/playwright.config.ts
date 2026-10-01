import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
	testDir: './tests',
	fullyParallel: false,
	use: {
		baseURL: 'http://127.0.0.1:4186',
		browserName: 'chromium',
		headless: true,
		launchOptions: executablePath ? { executablePath } : undefined
	},
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4186',
		url: 'http://127.0.0.1:4186/',
		reuseExistingServer: !process.env.CI
	}
});
