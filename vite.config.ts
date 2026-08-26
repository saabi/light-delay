import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

function resolveBase(configuredBase: string | undefined): '' | `/${string}` {
	if (!configuredBase || configuredBase === '/') return '';
	if (!configuredBase.startsWith('/') || configuredBase.endsWith('/')) {
		throw new Error('BASE_PATH must start with "/" and must not end with "/"');
	}
	return configuredBase as `/${string}`;
}

const base = resolveBase(process.env.BASE_PATH);

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				fallback: '404.html'
			}),
			paths: {
				base
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
