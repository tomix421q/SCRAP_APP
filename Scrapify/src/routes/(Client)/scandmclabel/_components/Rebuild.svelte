<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import type { ScrapManager } from './ScrapManager.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import { ArrowRight, X } from '@lucide/svelte';

	let {
		scrapManager
	}: {
		scrapManager: ScrapManager;
	} = $props();


	// $inspect(scrapManager.mode);
</script>

<div class="grid grid-cols-2 gap-4">
	{#each scrapManager.scrapPayload as row (row.groupId)}
		{@const groupDef = scrapManager.scanData?.groups.find((g) => g.id === row.groupId)}
		<div
			class="border backdrop-blur-2xl shadow-2xl p-2 rounded-lg flex flex-col gap-3 transition-colors {row.isOtherComponent
				? 'bg-muted/30 border-warning/50'
				: ''} {row.isOtherVariant &&
			(!row.replacementPartMaterial ||
				row.replacementPartMaterial === '' ||
				row.replacementPartMaterial === 'empty')
				? 'bg-warning'
				: row.selectedScrapCode || row.isOtherVariant
					? 'bg-destructive'
					: ''}"
		>
			<!-- TOP -->
			<article class="flex gap-4 justify-between">
				<p class="font-extrabold text-xl items-center gap-1 flex">
					<span class="truncate" title={row.interfaceName}>{row.interfaceName}</span>
					{#if row.isRebuildGroup}
						<span class="bg-black text-xs uppercase p-1 rounded-lg text-chart-3 mx-2">Rebuild</span>
					{:else}
						<span class="bg-black text-xs uppercase p-1 rounded-lg text-chart-2">Small</span>
					{/if}
				</p>

				<div class="flex gap-4">
					<section class="flex items-center gap-2 bg-chart-5 rounded-lg p-1.5">
						<Label
							for={`other-variant-${row.groupId}`}
							class="text-sm cursor-pointer font-semibold {row.isOtherVariant
								? 'text-secondary-foreground'
								: 'text-muted-foreground'}"
						>
							Iný variant
						</Label>
						<Checkbox
							id={`other-variant-${row.groupId}`}
							checked={row.isOtherVariant}
							onCheckedChange={(checked) =>
								scrapManager.setOtherVariant(row.groupId, Boolean(checked))}
							class="size-5! ring-2 ring-primary **:size-5"
						/>
					</section>
					<section class="flex items-center gap-2 bg-chart-5 rounded-lg p-1.5">
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
							class="size-5! ring-2 ring-primary **:size-5"
						/>
					</section>
				</div>
			</article>

			<!-- BOTTOM -->
			<article class="flex">
				{#if !row.isOtherComponent}
					<div class="flex flex-wrap gap-2">
						{#if row.isOtherVariant}
							<div
								class="max-sm:w-full rounded-lg bg-chart-5 px-3 py-2 h-9 text-info font-semibold text-sm"
							>
								Iný variant
							</div>
						{:else}
							<Combobox
								dataBox={groupDef?.scrapCodes.map((sc) => ({
									id: sc.code,
									name: `${sc.code} ${sc.description ? '-' : ''} ${sc.description ?? ''}`
								})) ?? []}
								nameLabel="name"
								width="lg"
								value={row.selectedScrapCode?.toString() ?? ''}
								onchange={(val) => scrapManager.selectScrap(row.groupId, val)}
								firstText="Zvoľte dôvod scrapu"
							/>
						{/if}
						<Button
							type="button"
							title="Remove item"
							size="icon"
							variant="ghost"
							class={row.selectedScrapCode
								? 'flex text-destructive bg-chart-5 hover:bg-chart-5/90'
								: 'hidden'}
							onclick={() => scrapManager.clearScrapRow(row.groupId)}
						>
							<X />
						</Button>

						{#if row.isOtherVariant}
							<section class="flex items-center">
								<Combobox
									dataBox={groupDef?.materials.map((material) => ({
										id: material.material,
										name: `${material.material} ${material.description ? '-' : ''} ${material.description ?? ''}`
									})) ?? []}
									nameLabel="name"
									value={row.replacementPartMaterial === 'empty'
										? ''
										: (row.replacementPartMaterial ?? '')}
									onchange={(val) => scrapManager.setReplacementPart(row.groupId, val)}
									firstText="Vyberte správny diel"
									width="sm"
								/>
							</section>
						{/if}
					</div>
				{:else}
					<p
						class="max-sm:w-full rounded-lg bg-chart-5 px-3 py-2 h-9 text-info font-semibold text-sm"
					>
						Dovod scrapu, iny komponent.
					</p>
				{/if}
			</article>
		</div>
	{/each}
</div>
