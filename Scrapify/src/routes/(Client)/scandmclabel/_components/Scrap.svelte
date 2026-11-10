<script lang="ts">
	import GroupPhoto from './GroupPhoto.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import type { ScrapManager } from './ScrapManager.svelte';
	import { GRID_COLS_CLASS, viewStore } from '@/stores/viewStore.svelte';
	import { X } from '@lucide/svelte';

	let {
		scrapManager
	}: {
		scrapManager: ScrapManager;
	} = $props();
</script>

<div class="grid grid-cols-1 gap-4 {GRID_COLS_CLASS[viewStore.grid.scrap]}">
	{#each scrapManager.scrapPayload as row (row.groupId)}
		{@const groupDef = scrapManager.scanData?.groups.find((g) => g.id === row.groupId)}
		{@const colorOtherComponent = row.isOtherComponent ? 'bg-red-500/50 border-warning/50' : ''}
		{@const colorOtherVariant =
			row.isOtherVariant &&
			(!row.replacementPartMaterial ||
				row.replacementPartMaterial === '' ||
				row.replacementPartMaterial === 'empty')
				? 'bg-warning'
				: row.selectedScrapCode || row.isOtherVariant
					? 'bg-red-500'
					: ''}

		<div
			class="border flex backdrop-blur-2xl shadow-2xl rounded-lg justify-between p-1 gap-3 transition-colors overflow-hidden h-full {colorOtherComponent} {colorOtherVariant}"
		>
			<div class="flex flex-col gap-2 min-w-0 flex-1">
				<!-- TOP -->
				<article class="flex flex-col gap-4 justify-between">
					<p class="font-extrabold text-xl items-center gap-1 flex-wrap flex z-20">
						<span class="wrap-break-word min-w-0" title={row.interfaceName}
							>{row.interfaceName}</span
						>
					</p>

					<div class="flex gap-4">
						<section class="flex items-center gap-2 bg-chart-5 rounded-lg p-0.5 px-1">
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
								class="size-4! ring-2 ring-primary **:size-5"
							/>
						</section>
						<section class="flex items-center gap-2 bg-chart-5 rounded-lg p-0.5 px-1">
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
								class="size-4! ring-2 ring-primary **:size-5"
							/>
						</section>
					</div>
				</article>

				<!-- BOTTOM -->
				<article class="flex w-full">
					{#if !row.isOtherComponent}
						<div class="flex flex-row gap-1 w-full">
							{#if !row.isOtherVariant}
								<div class="flex-1 min-w-0 [&_[role=combobox]]:w-full!">
									<Combobox
										dataBox={groupDef?.scrapCodes.map((sc) => ({
											id: sc.code,
											name: `${sc.code} ${sc.description ? '-' : ''} ${sc.description ?? ''}`
										})) ?? []}
										nameLabel="name"
										width="sm"
										value={row.selectedScrapCode?.toString() ?? ''}
										onchange={(val) => scrapManager.selectScrap(row.groupId, val)}
										firstText="Zvoľte dôvod scrapu"
									/>
								</div>
							{/if}
							<Button
								type="button"
								title="Remove item"
								size="icon"
								variant="ghost"
								class={row.selectedScrapCode
									? 'flex shrink-0 text-destructive bg-chart-5 hover:bg-chart-5/90'
									: 'hidden'}
								onclick={() => scrapManager.clearScrapRow(row.groupId)}
							>
								<X />
							</Button>

							{#if row.isOtherVariant}
								<section class="flex items-center flex-1 min-w-0">
									<div class="flex-1 min-w-0 [&_[role=combobox]]:w-full!">
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
									</div>
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

			<!-- Photo -->
			<div class=" -z-30 h-auto size-44 shrink-0">
				<GroupPhoto group={groupDef} />
			</div>
		</div>
	{/each}
</div>
