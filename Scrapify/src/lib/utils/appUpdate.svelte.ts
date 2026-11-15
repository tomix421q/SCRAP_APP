import { updated } from '$app/state';

/**
 * Hard-reloads the page as soon as a newly deployed app version is detected,
 * so no client keeps running old code against a new server.
 * Requires `kit.version.pollInterval` in svelte.config.js so `updated.current` turns true.
 * Unsaved form input is lost on reload; deploy when the app is not in active use.
 * Must be called during component initialisation (e.g. in the root layout).
 */
export function autoReloadOnUpdate(): void {
	$effect(() => {
		if (updated.current) location.reload();
	});
}
