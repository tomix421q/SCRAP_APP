import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// const BASE = process.env.NODE_ENV === 'development' ? '' : '/scrapify';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		csrf: {
			trustedOrigins: ['http://10.184.145.18:3001', 'http://localhost:3001']
		},
		adapter: adapter(),
		// Clients check for a new deploy every minute; see autoReloadOnUpdate in $lib/utils/appUpdate.svelte.ts.
		version: { pollInterval: 60_000 },
		// paths: { base: BASE },
		alias: {
			'@/*': './src/lib/*'
		}
	}
};

export default config;
