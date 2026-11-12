<script lang="ts">
	import { ImageOff } from '@lucide/svelte';
	import * as Dialog from '@/components/ui/dialog';

	let {
		group
	}: {
		group?: { id: number; photoFile: string | null; updatedAt: Date | string };
	} = $props();

	// Remember which URL failed, so a replaced photo (new URL) is tried again.
	let failedSrc = $state<string | null>(null);
	let isPreviewOpen = $state(false);
	// The URL is versioned by updatedAt so a replaced photo is never served from cache.
	let src = $derived(
		group?.photoFile
			? `/api/partgroup-photo/${group.id}?v=${new Date(group.updatedAt).getTime()}`
			: null
	);
</script>

{#if src && src !== failedSrc}
	<button
		type="button"
		title="Zväčšiť fotku"
		class="relative block size-full shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted"
		onclick={() => (isPreviewOpen = true)}
	>
		<!-- Blurred copy fills the letterbox bands with the photo's own colors (same URL, served from cache) -->
		<img
			{src}
			alt=""
			aria-hidden="true"
			loading="lazy"
			class="absolute inset-0 size-full scale-125 object-cover blur-lg"
		/>
		<img
			{src}
			alt=""
			loading="lazy"
			class="relative size-full object-contain"
			onerror={() => (failedSrc = src)}
		/>
	</button>

	<Dialog.Root bind:open={isPreviewOpen}>
		<Dialog.Content class="w-auto max-w-[95vw] p-2 sm:max-w-[95vw]">
			<Dialog.Title class="sr-only">Fotka dielu</Dialog.Title>
			<img {src} alt="Fotka dielu" class="max-h-[90vh] max-w-full rounded-md object-contain" />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<div
		class="size-full shrink-0 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/40"
	>
		<ImageOff class="size-8" />
	</div>
{/if}
