import { env } from '$env/dynamic/public';
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	/** the base url of the server (optional if you're using the same domain) */
	baseURL: env.PUBLIC_PROD_URL
});
