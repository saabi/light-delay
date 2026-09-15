import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideOptions, resolveBase } from './paraglide.config.mjs';

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
				base,
				relative: false
			},
			prerender: {
				handleHttpError: ({ path, status, message }) => {
					if (status === 404 && path.startsWith('/assets/')) return;
					throw new Error(message);
				}
			}
		}),
		paraglideVitePlugin(paraglideOptions(base))
	],
	server: {
		proxy: {
			'/v1/imitation': {
				target: 'http://127.0.0.1:8765',
				changeOrigin: false
			}
		}
	},
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
