<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import type { ActionData } from '../$types';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import type { ScrapManager } from './ScrapManager.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import { ArrowRight, X } from '@lucide/svelte';

	type ScanSuccess = Extract<ActionData, { data: any }>;
	type MatchData = NonNullable<ScanSuccess['data']>['match'];

	let {
		scrapManager
	}: {
		scrapManager: ScrapManager;
	} = $props();

	$inspect(scrapManager.scrapPayload);
	// $inspect(scrapManager.mode);
</script>

<div class="flex flex-col gap-4">
	{#each scrapManager.scrapPayload as row (row.groupId)}
		{@const groupDef = scrapManager.scanData?.groups.find((g) => g.id === row.groupId)}
		<div
			class="border p-4 rounded-lg flex flex-col gap-3 transition-colors {row.selectedScrapCode
				? 'ring-destructive ring-2'
				: ''} {row.isOtherVariant && row.replacementPartId === 'empty'
				? 'ring-warning ring-2'
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
								? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
								: 'hidden'}
							onclick={() => scrapManager.clearScrapRow(row.groupId)}
						>
							<X />
						</Button>

						{#if row.isOtherVariant}
							<section class="flex items-center">
								<ArrowRight class="size-8 stroke-3 stroke-primary animate-pulse" />
								<Combobox
									dataBox={groupDef?.parts ?? []}
									nameLabel="partnumSideColor"
									value={row.replacementPartId === 'empty' ? '' : row.replacementPartId}
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
