<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { GRID_OPTIONS, viewStore, type GridSize } from '@/stores/viewStore.svelte';
	import { Columns2, Columns3, Columns4, RotateCcw, Square, ArrowUp, Maximize, Minimize } from '@lucide/svelte';
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

	let gridOpen = $state(false);

	let fullscreenSupported = $state(false);
	let isFullscreen = $state(false);

	$effect(() => {
		fullscreenSupported = document.fullscreenEnabled;
		const sync = () => (isFullscreen = document.fullscreenElement !== null);
		sync();
		document.addEventListener('fullscreenchange', sync);
		return () => document.removeEventListener('fullscreenchange', sync);
	});

	async function toggleFullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await document.documentElement.requestFullscreen();
		} catch (error) {
			console.error('Fullscreen toggle failed', error);
		}
	}

	const GRID_ICONS = { 1: Square, 2: Columns2, 3: Columns3, 4: Columns4 } satisfies Record<
		GridSize,
		unknown
	>;
</script>

{#snippet gridSwitch(mode: ScrapMode)}
	{#each GRID_OPTIONS[mode] as size (size)}
		{@const Icon = GRID_ICONS[size]}
		<Button
			type="button"
			size="icon"
			title={`${size} ${size === 1 ? 'stĺpec' : 'stĺpce'}`}
			variant="outline"
			class={viewStore.grid[mode] === size
				? 'border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background'
				: ''}
			onclick={() => {
				viewStore.setGrid(mode, size);
				gridOpen = false;
			}}
		>
			<Icon />
		</Button>
	{/each}
{/snippet}

{#if scrapManager.mode}
	{@const ActiveIcon = GRID_ICONS[viewStore.grid[scrapManager.mode]]}
	<aside
		class="fixed bottom-4 left-4 max-sm:right-4 z-20 flex items-center gap-2 rounded-lg border-2 border-primary/50 bg-card/95 p-2 shadow-2xl ring-4 ring-background backdrop-blur"
	>
		<Button
			type="button"
			size="icon"
			variant="outline"
			class="border-destructive/50 text-destructive"
			title="Opakovať"
			disabled={isSubmitting}
			onclick={resetAll}
		>
			<RotateCcw />
		</Button>

		<Button
			type="button"
			size="icon"
			variant="outline"
			title="Hore"
			onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
		>
			<ArrowUp />
		</Button>

		{#if fullscreenSupported}
			<Button
				type="button"
				size="icon"
				variant="outline"
				title={isFullscreen ? 'Ukončiť celú obrazovku' : 'Celá obrazovka'}
				class="max-sm:hidden"
				onclick={toggleFullscreen}
			>
				{#if isFullscreen}<Minimize />{:else}<Maximize />{/if}
			</Button>
		{/if}

		<Popover.Root bind:open={gridOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						type="button"
						size="icon"
						variant="outline"
						title="Rozloženie"
						class="max-md:hidden"
					>
						<ActiveIcon />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content side="top" align="center" class="flex w-auto gap-1 p-2">
				{@render gridSwitch(scrapManager.mode)}
			</Popover.Content>
		</Popover.Root>

		<Button
			type="submit"
			form="scrap"
			class="max-sm:flex-1 max-sm:min-w-0 max-sm:whitespace-normal font-semibold disabled:border disabled:border-dashed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
			disabled={isSubmitting || !scrapManager.canSubmit}
		>
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
