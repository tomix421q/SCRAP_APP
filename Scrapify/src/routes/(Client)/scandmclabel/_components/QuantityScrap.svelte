<script lang="ts">
	import GroupPhoto from './GroupPhoto.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import type { ScrapManager } from './ScrapManager.svelte';
	import { GRID_COLS_CLASS, viewStore } from '@/stores/viewStore.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import { Minus, Plus, X } from '@lucide/svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';

	let {
		scrapManager
	}: {
		scrapManager: ScrapManager;
	} = $props();

	const adjustQuantity = (row: (typeof scrapManager.scrapPayload)[number], num: number) => {
		const current = Number(row.quantity ?? 0);
		row.quantity = Math.max(0, current + num);
	};

	// $inspect(scrapManager.relevantPayload);
</script>

<div class="">
	<!-- <h2 class="text-2xl font-bold">Quantity scrap</h2> -->

	{#if scrapManager.scrapPayload.length === 0}
		<p class="text-muted-foreground">
			Pre label QNT-SCRAP nie sú nakonfigurované žiadne skupiny dielov.
		</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 {GRID_COLS_CLASS[viewStore.grid.qntScrap]}">
			{#each scrapManager.scrapPayload as row (row.groupId)}
				{@const groupDef = scrapManager.scanData?.groups.find((g) => g.id === row.groupId)}
				<div
					class="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 shadow-xl drop-shadow-lg bg-chart-3/10"
				>
					<section class="flex flex-wrap gap-5 min-w-0">
						<GroupPhoto group={groupDef} />
						<div class="lg:min-w-xs min-w-0 text-wrap">
							<p class="truncate font-semibold" title={row.interfaceName}>{row.interfaceName}</p>
							<p class="text-sm text-muted-foreground">{row.groupName}</p>
						</div>

						<article class="gap-2 flex flex-col">
							<!--  -->
							<!-- Part number selection -->
							<div class="flex gap-1">
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
									width="lg"
								/>
								<Button
									type="button"
									title="Remove item"
									size="icon"
									variant="ghost"
									class={row.replacementPartMaterial && row.replacementPartMaterial !== 'empty' //replacement is selected PN for this mode (qnt-scrap)
										? 'flex text-destructive bg-chart-5 hover:bg-chart-5/90'
										: 'hidden'}
									onclick={() => scrapManager.setReplacementPart(row.groupId, 'empty')}
								>
									<X />
								</Button>
							</div>

							<!--  -->
							<!-- Scrap code selection -->
							<div class="flex gap-1">
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
							</div>
						</article>
					</section>

					<!-- Input -->
					<article class="flex flex-wrap items-center gap-2">
						<Label class="flex shrink-0 items-center gap-2">
							<span class="text-lg">Množstvo</span>
						</Label>

						<Input
							type="number"
							min="0"
							step="1"
							class="w-20 text-center text-xl! text-warning"
							bind:value={row.quantity}
							aria-label={`Množstvo pre ${row.interfaceName}`}
						/>
						<section class="flex items-center gap-6">
							<!-- +1 -1 -->
							<div class="flex items-center gap-1">
								<Button
									type="button"
									size="icon"
									class="rounded-full"
									variant="secondary"
									onclick={() => adjustQuantity(row, -1)}
								>
									<Minus />
								</Button>
								<Button
									type="button"
									size="icon"
									class="rounded-full"
									variant="default"
									onclick={() => adjustQuantity(row, 1)}
								>
									<Plus />
								</Button>
							</div>
							<!-- +10 -10 -->
							<div class="flex items-center gap-1">
								<Button
									type="button"
									size="icon"
									class="rounded-full"
									variant="secondary"
									onclick={() => adjustQuantity(row, -10)}
								>
									<Minus class="size-8 stroke-3" />
								</Button>
								<Button
									type="button"
									size="icon"
									class="rounded-full"
									variant="default"
									onclick={() => adjustQuantity(row, 10)}
								>
									<Plus class="size-8 stroke-3" />
								</Button>
							</div>

							<Button
								type="button"
								size="icon"
								class="rounded-full"
								variant="destructive"
								onclick={() => (row.quantity = 0)}
							>
								<X />
							</Button>
						</section>
					</article>
				</div>
			{/each}
		</div>
	{/if}
</div>
