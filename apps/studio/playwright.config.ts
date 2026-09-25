import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1',
		env: { STUDIO_AUTHORING_STORE: 'memory' },
		port: 4173,
		timeout: 360000,
		reuseExistingServer: !process.env.CI
	},
	testMatch: '**/*.e2e.ts'
});
