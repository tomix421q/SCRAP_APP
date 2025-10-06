<script lang="ts">
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import type { PageProps } from './$types';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { CopyPlus, X } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import ScrapTable from '@/components/organism/Tables/SearchScrapTable.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { tick } from 'svelte';

	let { data, form }: PageProps = $props();
	let { processes, parts, scrapCodes, scrapRecords, totalPartsQnt } = $derived(data.data);
	const user = $derived(data.user);

	let isSubmitting = $state(false);

	let partId = $state('');
	let scrapId = $state('');
	let description = $state('');
	let quantity = $state('');
	let operatorId = $state('');

	let resetProcessCombo = $state(false);
	let resetPartCombo = $state(false);
	let resetScrapCodeCombo = $state(false);

	const fillLoggedOperator = () => {
		let getId = localStorage.getItem('operatorId');
		operatorId = getId ? getId : 'empty';
		if (operatorId === 'empty') {
			goto('/');
		}
	};

	let filterOptions: { processId: string } = $state({
		processId: ''
	});

	function applyFilter() {
		const params = new URLSearchParams();
		if (filterOptions.processId) params.set('processId', filterOptions.processId.toString());

		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}
	async function clearFilter() {
		filterOptions.processId = '';
		resetProcessCombo = true;
		await tick();
		resetProcessCombo = false;
	}

	$effect(() => {
		if (typeof filterOptions.processId) {
			applyFilter();
		}
	});

	// $inspect(user);
</script>

<main class="flex flex-col lg:flex-wrap gap-10 relative">
	<div class="flex flex-col lg:flex-row justify-center gap-6">
		<!--  -->
		<!-- CREATE SCRAP RECORD -->
		<section class="w-full sm:w-xl">
			<form
				action="?/createScrap"
				method="POST"
				use:enhance={() => {
					isSubmitting = true;

					return async ({ update, result }) => {
						if (result?.type === 'success') {
							resetPartCombo = true;
							resetScrapCodeCombo = true;
						}
						await update();
						isSubmitting = false;
						resetPartCombo = false;
						resetScrapCodeCombo = false;
					};
				}}
				class="formNormalize"
			>
				<h2 class="text-center font-semibold text-2xl text-primary">Vytvorit scrap</h2>
				<!-- Result -->
				<div>
					<ResultInfo data={form} />
				</div>

				<!-- -->
				<!-- process COMBO -->
				<article class="flex justify-between items-center gap-2">
					<Label for="processId" class="text-sm md:text-lg"
						>Process <span class="text-xs text-chart-info tracking-widest">[Filter]</span></Label
					>

					<div class="flex gap-2">
						<Button
							size="icon"
							variant="ghost"
							title="Vymazat filter"
							class="text-destructive my-auto hover:text-destructive {filterOptions.processId
								? 'flex'
								: 'hidden'}"
							onclick={() => clearFilter()}><X /></Button
						>

						<Combobox
							dataBox={processes}
							bind:value={filterOptions.processId}
							reset={resetProcessCombo}
							id="processId"
							nameLabel="name"
						/>
					</div>
				</article>
				<!-- -->
				<!-- part COMBO -->
				<article class="flex justify-between items-center gap-2">
					<Label for="partId" class="text-sm md:text-lg">Part</Label>
					<div class="flex gap-2">
						<Combobox
							dataBox={parts}
							bind:value={partId}
							reset={resetPartCombo}
							id="partId"
							nameLabel="partnumSideColor"
						/>
					</div>
					<input type="hidden" name="partId" required bind:value={partId} />
				</article>
				<!-- -->
				<!-- scrap code COMBO -->
				<article class="flex justify-between items-center gap-2">
					<Label for="scrapCodeId" class="text-sm md:text-lg">Scrap Code</Label>
					<div class="flex gap-2">
						<Combobox
							dataBox={scrapCodes}
							bind:value={scrapId}
							reset={resetScrapCodeCombo}
							id="scrapCodeId"
							nameLabel="codeName"
						/>
					</div>
					<input type="hidden" name="scrapCodeId" required bind:value={scrapId} />
				</article>
				<!-- -->
				<!-- input description -->
				<article class="flex justify-between items-center gap-2">
					<Label for="description" class="text-sm md:text-lg">Opis</Label>
					<Input
						placeholder="Description"
						name="description"
						id="description"
						class="inputNormalize max-w-[250px]"
						bind:value={description}
					/>
				</article>
				<!-- -->
				<!-- input quantity -->
				<article class="flex justify-between items-center gap-2">
					<Label for="quantity" class="text-sm md:text-lg">Mnozstvo</Label>
					<Input
						placeholder="Quantity"
						name="quantity"
						id="quantity"
						class="inputNormalize max-w-[250px]"
						bind:value={quantity}
					/>
				</article>
				<!-- -->
				<!-- input createdBy -->
				<article class="flex justify-between items-center gap-2">
					<Label for="operatorId" class="text-sm md:text-lg">Operator ID</Label>
					<div class="flex w-[290px]">
						<Button
							size="icon"
							variant="ghost"
							class="my-auto text-chart-success hover:text-chart-success"
							title="Doplnit ID operatora"
							onclick={() => {
								fillLoggedOperator();
							}}><CopyPlus /></Button
						>
						<Input
							placeholder="Operator id"
							name="operatorId"
							id="operatorId"
							class="inputNormalize ml-2"
							bind:value={operatorId}
						/>
					</div>
				</article>

				<Button type="submit" class="mt-10 ">
					{#if isSubmitting}
						<span>Submitting...</span>
					{:else}
						Vytvorit scrap
					{/if}
				</Button>
			</form>
		</section>
	</div>

	<section>
		<ScrapTable
			findRecords={scrapRecords}
			totalRecords={scrapRecords.length}
			headerText={'Poslednych 20 zaznamov'}
			userInfo={user}
		/>
	</section>
</main>
