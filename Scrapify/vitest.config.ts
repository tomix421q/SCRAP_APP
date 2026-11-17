import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Tests live in the top-level `tests/` folder so they never mix with app sources.
export default defineConfig({
	plugins: [sveltekit()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'server',
					include: ['tests/**/*.test.ts'],
					exclude: ['tests/**/*.svelte.test.ts'],
					environment: 'node'
				}
			},
			{
				// Client-side state classes (`*.svelte.ts`) need client-compiled runes to be reactive.
				extends: true,
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					include: ['tests/**/*.svelte.test.ts'],
					environment: './tests/env/svelte-client.ts'
				}
			}
		]
	}
});
