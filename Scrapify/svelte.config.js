import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// const BASE = process.env.NODE_ENV === 'development' ? '' : '/scrapify';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		csrf: {
			checkOrigin: false
		},
		adapter: adapter(),
		// paths: { base: BASE },
		alias: {
			'@/*': './src/lib/*'
		}
	}
};

export default config;
