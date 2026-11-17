// Node environment whose modules are compiled for the client, so Svelte runes (`$state`, `$derived`)
// in `.svelte.ts` classes are reactive. Server-compiled runes never recompute a `$derived`.
export default {
	name: 'svelte-client',
	viteEnvironment: 'client',
	setup() {
		return { teardown() {} };
	}
};
