<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import type { ScrapManager } from './ScrapManager.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import {
		ArrowLeft,
		ArrowRight,
		LucidePlusCircle,
		Minus,
		Plus,
		PlusCircle,
		PlusCircleIcon,
		X
	} from '@lucide/svelte';
	import Button from '@/components/ui/button/button.svelte';

	let {
		scrapManager
	}: {
		scrapManager: ScrapManager;
	} = $props();

	const adjustQuantity = (row: (typeof scrapManager.scrapPayload)[number], num: number) => {
		const current = Number(row.quantity ?? 0);
		row.quantity = Math.max(0, current + num);
	};

	$inspect(scrapManager.relevantPayload);
</script>

<div class="">
	<!-- <h2 class="text-2xl font-bold">Quantity scrap</h2> -->

	{#if scrapManager.scrapPayload.length === 0}
		<p class="text-muted-foreground">
			Pre label QNT-SCRAP nie sú nakonfigurované žiadne skupiny dielov.
		</p>
	{:else}
		<div class="grid grid-cols-1 gap-4">
			{#each scrapManager.scrapPayload as row (row.groupId)}
				<div class="flex items-center justify-between gap-4 rounded-lg border p-4">
					<div class="min-w-0">
						<p class="truncate font-semibold" title={row.interfaceName}>{row.interfaceName}</p>
						<p class="text-sm text-muted-foreground">{row.groupName}</p>
					</div>

					<!-- Input -->
					<article class="flex gap-2">
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
