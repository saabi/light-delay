import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1',
		env: { STUDIO_AUTHORING_STORE: 'memory' },
		port: 4173,
		timeout: 360000,
		reuseExistingServer: !process.env.CI
	},
	testMatch: '**/*.e2e.ts',
	/* One shared in-memory store: run serially, authoring flow first (it expects the initial text). */
	workers: 1,
	projects: [
		{ name: 'authoring', testMatch: '**/authoring.e2e.ts' },
		{
			name: 'write-correctness',
			testMatch: '**/write-correctness.e2e.ts',
			dependencies: ['authoring']
		},
		{ name: 'shell', testMatch: '**/shell.e2e.ts', dependencies: ['write-correctness'] },
		{ name: 'readability', testMatch: '**/readability.e2e.ts', dependencies: ['shell'] },
		{ name: 'commit', testMatch: '**/commit.e2e.ts', dependencies: ['readability'] },
		{ name: 'editor', testMatch: '**/editor.e2e.ts', dependencies: ['commit'] }
	],
	use: {
		launchOptions: process.env.STUDIO_TEST_BROWSER
			? { executablePath: process.env.STUDIO_TEST_BROWSER }
			: {}
	}
});
