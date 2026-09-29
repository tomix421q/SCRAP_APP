<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import type { PageProps } from './$types';
	import { tick } from 'svelte';
	import { AlertTriangle, RefreshCw, X } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Button from '@/components/ui/button/button.svelte';
	import { playBeep } from '@/utils/frontHelp';
	import type { LabelGroupsWithRelationsScan } from '@/utils/types';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';

	let { form }: PageProps = $props();

	// vars
	let barcodeValue = $state('');
	let isScanning = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let scanData = $derived(form?.data?.match);
	// let scrapCodes = $derived(form?.data?.scrapCodes);
	let scanDataInfo = $derived(form);
	let scrapCodesRecord = $state<Record<string, string>>({});

	// func
	async function refocus() {
		await tick();
		inputEl?.focus();
	}

	// efect
	$effect(() => {
		refocus();
	});

	// $inspect(scanData?.groups.flat());
</script>

<main class="flex flex-col items-center gap-3">
	<!-- SCANNER CARD -->

	<article class="formNormalize sm:w-xl mt-24 pb-8">
		<section class="flex items-center gap-3 mb-4">
			<h2 class="text-3xl mx-auto font-extrabold">Scan DMC label</h2>
		</section>

		<form
			method="POST"
			action="?/scanDmc"
			use:enhance={() => {
				isScanning = true;
				status = 'idle';
				return async ({ result, update }) => {
					isScanning = false;
					if (result.type === 'success' && result.data) {
						status = 'success';
						barcodeValue = '';
						playBeep('ok');
					} else if (result.type === 'failure') {
						status = 'error';
						playBeep('error');
						// toast.error(String(result.data?.error ?? 'Neznámy diel pre tento kód.'));
						inputEl?.select();
					}

					await update({ reset: false });
					await refocus();
				};
			}}
		>
			<div class="relative flex flex-col gap-8">
				<div class="min-h-[80px] p-1">
					<ResultInfo data={form} />
				</div>

				<Input
					bind:ref={inputEl}
					name="barcode"
					bind:value={barcodeValue}
					disabled={isScanning}
					placeholder={'Naskenuj diel'}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck={false}
					class="inputNormalize transition-all text-2xl! text-center text-warning font-extrabold! max-w-lg mx-auto"
				/>

				{#if isScanning}
					<div class="absolute right-4 top-1/2 -translate-y-1/2">
						<RefreshCw class="size-6 text-primary animate-spin" />
					</div>
				{/if}
			</div>
		</form>
	</article>
	<article class="w-fit"></article>

	<!-- VÝSLEDOK SKENOVANIA -->
	{#if scanDataInfo?.success && status === 'success'}
		<article class="formNormalize sm:w-xl">
			{#each scanData?.groups as group, index}
				<div class="flex items-center justify-between flex-col sm:flex-row gap-3">
					<p class="text-xl font-semibold">{group.name}</p>
					{#if scanData?.code}
						<!-- {@const availableScrapCodes = scrapCodes.filter((c) => c.name.includes(group.name))} -->
						<div class="flex gap-2">
							<Button
								title="Remove item"
								size="icon"
								variant="ghost"
								class={scrapCodesRecord[group.name]?.length > 0
									? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
									: 'hidden'}
								onclick={() => {
									scrapCodesRecord[group.name] = '';
								}}><X /></Button
							>
							<Combobox
								dataBox={group.scrapCodes}
								nameLabel="codeName"
								id="scrapCodes"
								bind:value={scrapCodesRecord[group.name]}
								reset
							/>
						</div>
					{/if}
				</div>
			{/each}
		</article>
	{:else if status === 'error'}
		<!-- <p>... </p> -->
	{/if}
</main>
