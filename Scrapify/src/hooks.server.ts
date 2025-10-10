import { building, dev } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/auth/auth';

export async function handle({ event, resolve }) {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}
	const response = await svelteKitHandler({ event, resolve, auth, building });

	// response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	// response.headers.set('Pragma', 'no-cache');
	// response.headers.set('Expires', '0');
	return response;
}
