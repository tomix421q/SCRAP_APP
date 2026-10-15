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

	// $inspect(scrapManager.scrapPayload);
	// $inspect(scrapManager.mode);
</script>

<div class="flex flex-col gap-4">
	{#each scrapManager.scrapPayload as row (row.groupId)}
		{@const groupDef = scrapManager.scanData?.groups.find((g) => g.id === row.groupId)}
		<div
			class="border p-4 rounded-lg flex flex-col gap-3 transition-colors {row.isOtherComponent
				? 'bg-muted/30 border-warning/50'
				: ''}"
		>
			<!-- TOP -->
			<article class="flex justify-between items-center">
				<p class="font-bold text-lg flex items-center gap-2">
					{row.groupName}
					{#if row.isRebuildGroup}
						<span class="bg-black text-xs uppercase p-1 rounded-lg text-chart-3">Rebuild</span>
					{:else}
						<span class="bg-black text-xs uppercase p-1 rounded-lg text-chart-2">Small</span>
					{/if}
				</p>

				{#if row.isRebuildGroup}
					<section class="flex items-center gap-2">
						<Label
							for={`other-comp-${row.groupId}`}
							class="text-sm cursor-pointer font-semibold {row.isOtherComponent
								? 'text-secondary-foreground'
								: 'text-muted-foreground'}"
						>
							Iný komponent
						</Label>
						<Checkbox
							id={`other-comp-${row.groupId}`}
							checked={row.isOtherComponent}
							onCheckedChange={(checked) =>
								scrapManager.setOtherComponent(row.groupId, Boolean(checked))}
							class="size-6! ring-2 ring-primary **:size-6"
						/>
					</section>
				{/if}
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
