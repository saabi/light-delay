import { defineConfig } from '@playwright/test';

// Run after build, with TEST_DATABASE_URL pointing only at a disposable/test DB.
export default defineConfig({
	testMatch: '**/authoring-n1.postgres.browser.ts',
	workers: 1,
	timeout: 30000,
	use: {
		launchOptions: process.env.STUDIO_TEST_BROWSER
			? { executablePath: process.env.STUDIO_TEST_BROWSER }
			: {}
	}
});
