<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { GRID_OPTIONS, viewStore, type GridSize } from '@/stores/viewStore.svelte';
	import { Columns2, Columns3, RotateCcw, Square } from '@lucide/svelte';
	import type { ScrapManager, ScrapMode } from './ScrapManager.svelte';

	let {
		scrapManager,
		isSubmitting,
		resetAll
	}: {
		scrapManager: ScrapManager;
		isSubmitting: boolean;
		resetAll: () => void;
	} = $props();

	const GRID_ICONS = { 1: Square, 2: Columns2, 3: Columns3 } satisfies Record<GridSize, unknown>;
</script>

{#snippet gridSwitch(mode: ScrapMode)}
	{#each GRID_OPTIONS[mode] as size (size)}
		{@const Icon = GRID_ICONS[size]}
		<Button
			type="button"
			size="icon"
			title={`${size} ${size === 1 ? 'stĺpec' : 'stĺpce'}`}
			variant={viewStore.grid[mode] === size ? 'default' : 'outline'}
			onclick={() => viewStore.setGrid(mode, size)}
		>
			<Icon />
		</Button>
	{/each}
{/snippet}

{#if scrapManager.mode}
	<aside
		class="fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border bg-card/90 p-2 shadow-lg backdrop-blur border-border"
	>
		<Button
			type="button"
			size="icon"
			variant="destructive"
			title="Opakovať"
			disabled={isSubmitting}
			onclick={resetAll}
		>
			<RotateCcw />
		</Button>

		<section class="flex gap-1 border-l border-border pl-2 max-md:hidden">
			{@render gridSwitch(scrapManager.mode)}
		</section>

		<Button type="submit" form="scrap" disabled={isSubmitting || !scrapManager.canSubmit}>
			{#if isSubmitting}
				<span>Prebieha vytvorenie scrapu...</span>
			{:else}
				{scrapManager.mode === 'qntScrap'
					? 'Uložiť quantity scrap'
					: `Vytvoriť ${scrapManager.mode === 'rebuild' ? 're-build' : 'scrap'}`}
			{/if}
		</Button>
	</aside>
{/if}
