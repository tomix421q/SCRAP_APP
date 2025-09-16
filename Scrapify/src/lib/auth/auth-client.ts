import { env } from '$env/dynamic/public';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import type { auth } from './auth';

export const authClient = createAuthClient({
	/** the base url of the server (optional if you're using the same domain) */
	baseURL: env.PUBLIC_PROD_URL,
	plugins: [inferAdditionalFields<typeof auth>()]
});
