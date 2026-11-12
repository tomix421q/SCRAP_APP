import { readFileSync } from 'node:fs';

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

import { defineConfig } from 'vite';

// Single source of truth for the app version is package.json.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string;
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Replaced at build time with the string literal, e.g. "4.3.5".
	define: {
		__APP_VERSION__: JSON.stringify(version),
		// ISO timestamp of the build, shown as "Last update" in the header.
		__APP_BUILD_TIME__: JSON.stringify(new Date().toISOString())
	}
});
