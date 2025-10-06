<script lang="ts">
	import Filter from '@/components/organism/Filter.svelte';
	import type { PageProps } from './$types';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import ScrapTable from '@/components/organism/Tables/SearchScrapTable.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { enhance } from '$app/forms';
	import Label from '@/components/ui/label/label.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { currentConfirmDeleteId, editSearchData } from '@/stores/stores';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let { data, form }: PageProps = $props();
	let { findRecords, totalRecords, totalPages, allProcesses, totalPartQnt, user } = $derived(data);

	let idEditScrapRecord = $state<number>();
	let isSubmitting = $state(false);

	let partId = $state('');
	let scrapId = $state('');
	let description = $state('');
	let quantity = $state('');
	let operatorId = $state('');

	// let resetProcessCombo = $state(false);
	let resetPartCombo = $state(false);
	let resetScrapCodeCombo = $state(false);

	function clearEditForm() {
		idEditScrapRecord = undefined;
		partId = '';
		scrapId = '';
		description = '';
		quantity = '';
		operatorId = '';
		$editSearchData = undefined;
	}

	$effect(() => {
		if ($editSearchData) {
			form = null;
			idEditScrapRecord = $editSearchData.id;
			partId = $editSearchData.partId.toString();
			scrapId = $editSearchData.scrapCode.id.toString();
			if ($editSearchData.description) description = $editSearchData.description.toString();
			quantity = $editSearchData.quantity.toString();
			operatorId = $editSearchData.createdBy;
		}

		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect(idEditScrapRecord);
</script>

<main class="">
	<div>
		<!-- Result info -->
		<section class="max-w-4xl mx-auto">
			<ResultInfo data={form} />
		</section>

		<!-- Filter || Edit form -->
		<section class="max-w-4xl! mx-auto">
			<!-- Filter -->
			{#if $editSearchData}
				<div transition:slide class="lg:min-h-[400px]">
					<form
						action="?/editSearchScrapRecord"
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
								clearEditForm();
							};
						}}
						class="formNormalize w-full gap-4"
					>
						<h2 class="text-center font-semibold text-2xl text-primary">Edit scrap</h2>

						<!-- if edit  -->
						<input type="text" hidden name="scrapRecordId" bind:value={idEditScrapRecord} />
						<!-- -->
						<!-- part COMBO -->
						<article class="flex justify-between items-center gap-2">
							{#await data.allPartsPromise}
								<span>Loading...</span>
							{:then parts}
								<Label for="partId" class="text-sm md:text-lg">Part</Label>
								<!-- if edit -->
								{#if idEditScrapRecord}
									{@const actuallPart = parts.find((part) => part.id === Number(partId))}
									<p class=" ml-auto text-sm text-chart-1">
										<span>{actuallPart ? actuallPart.partNumber : 'Unknown PN'}</span>
									</p>
								{/if}
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
							{/await}
						</article>
						<!-- -->
						<!-- scrap code COMBO -->
						<article class="flex justify-between items-center gap-2">
							{#await data.scrapCodesPromise}
								<span>Loading...</span>
							{:then scrapCodes}
								<Label for="scrapCodeId" class="text-sm md:text-lg">Scrap Code</Label>
								{#if idEditScrapRecord}
									{@const actuallScrapCode = scrapCodes.find(
										(scrapCode) => scrapCode.id === Number(scrapId)
									)}
									<p class=" ml-auto text-sm text-chart-1">
										<span>{actuallScrapCode ? actuallScrapCode.code : 'Unknown scrap'}</span>
									</p>
								{/if}
								<div class="flex gap-2">
									<Combobox
										dataBox={scrapCodes}
										bind:value={scrapId}
										reset={resetScrapCodeCombo}
										id="scrapCodeId"
										nameLabel="codeName"
									/>
								</div>
							{/await}

							<input type="hidden" name="scrapCodeId" required bind:value={scrapId} />
						</article>
						<!-- -->
						<!-- input description -->
						<article class="flex justify-between items-center gap-2">
							<Label for="description" class="text-sm md:text-lg">Description</Label>
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
							<Label for="quantity" class="text-sm md:text-lg">Quantity</Label>
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
								<Input
									placeholder="Operator id"
									name="operatorId"
									id="operatorId"
									class="inputNormalize ml-2"
									bind:value={operatorId}
								/>
							</div>
						</article>

						<div class="flex justify-center w-full gap-4 items-center mt-4">
							<Button type="submit">
								{#if isSubmitting}
									<span>Submitting...</span>
								{:else}
									Edit scrap record
								{/if}
							</Button>

							<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
						</div>
					</form>
				</div>
			{:else}
				<div transition:slide>
					<Filter {allProcesses} />
				</div>
			{/if}

			<!-- If edit -->
		</section>
	</div>

	<!--  -->
	<!-- Table -->
	<section class="">
		<ScrapTable
			{findRecords}
			{totalRecords}
			partsQnt={totalPartQnt._sum.quantity}
			userInfo={user}
		/>
	</section>

	<!-- PAGINATION -->
	<section>
		<Pagination {totalPages} />
	</section>
</main>
