<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import type { ScrapManager } from './ScrapManager.svelte';
	import { ArrowRight, X } from '@lucide/svelte';

	let {
		scrapManager
	}: {
		scrapManager: ScrapManager;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	{#each scrapManager.scrapPayload as row (row.groupId)}
		{@const groupDef = scrapManager.scanData?.groups.find((g) => g.id === row.groupId)}
		<div
			class="border p-4 rounded-lg flex flex-col gap-3 transition-colors {row.selectedScrapCode
				? 'bg-destructive/60'
				: ''} {row.isOtherVariant && row.replacementPartMaterial === 'empty'
				? ' bg-warning/60'
				: ''}"
		>
			<!-- TOP -->
			<article class="flex justify-between items-center">
				<p class="font-bold text-lg flex items-center gap-2">
					{row.groupName}
				</p>
			</article>

			<!-- BOTTOM -->
			<article class="flex">
				{#if !row.isOtherComponent}
					<div class="flex flex-wrap gap-2">
						<Combobox
							dataBox={groupDef?.scrapCodes ?? []}
							nameLabel="codeName"
							value={row.selectedScrapId?.toString()}
							onchange={(val) => scrapManager.selectScrap(row.groupId, Number(val))}
							firstText="Zvoľte dôvod scrapu"
						/>
						<Button
							type="button"
							title="Remove item"
							size="icon"
							variant="ghost"
							class={row.selectedScrapId
								? 'flex text-destructive bg-gray-800 hover:bg-gray-900'
								: 'invisible'}
							onclick={() => scrapManager.clearScrapRow(row.groupId)}
						>
							<X />
						</Button>

						{#if row.isOtherVariant}
							<section class="flex items-center">
								<ArrowRight class="size-8 stroke-3 stroke-primary animate-pulse" />
								<Combobox
									dataBox={groupDef?.materials.map((material) => ({
										id: material.material,
										name: `${material.material}`
									})) ?? []}
									nameLabel="name"
									value={row.replacementPartMaterial === 'empty' ? '' : row.replacementPartMaterial}
									onchange={(val) => scrapManager.setReplacementPart(row.groupId, val)}
									firstText="Vyberte správny diel"
								/>
							</section>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Dovod scrapu, iny komponent.</p>
				{/if}
			</article>
		</div>
	{/each}
</div>
