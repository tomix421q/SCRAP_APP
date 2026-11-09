import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Tests live in the top-level `tests/` folder so they never mix with app sources.
export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node'
	}
});
