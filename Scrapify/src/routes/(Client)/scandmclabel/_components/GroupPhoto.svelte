<script lang="ts">
	let {
		group
	}: {
		group?: { id: number; photoFile: string | null; updatedAt: Date | string };
	} = $props();

	// Remember which URL failed, so a replaced photo (new URL) is tried again.
	let failedSrc = $state<string | null>(null);
	// The URL is versioned by updatedAt so a replaced photo is never served from cache.
	let src = $derived(
		group?.photoFile
			? `/api/partgroup-photo/${group.id}?v=${new Date(group.updatedAt).getTime()}`
			: null
	);
</script>

{#if src && src !== failedSrc}
	<img
		{src}
		alt=""
		loading="lazy"
		class="size-max h-full shrink-0 rounded-lg border border-border object-cover"
		onerror={() => (failedSrc = src)}
	/>
{/if}
