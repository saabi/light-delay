import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.postgres.test.ts'],
		fileParallelism: false,
		expect: { requireAssertions: true }
	}
});
