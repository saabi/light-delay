import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.postgres.test.ts', 'src/authoring.test.ts'],
		fileParallelism: false,
		env: { AUTHORING_CONTRACT_BACKEND: 'postgres' },
		expect: { requireAssertions: true }
	}
});
