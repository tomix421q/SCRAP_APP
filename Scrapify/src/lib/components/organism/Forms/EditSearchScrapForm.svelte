<script lang="ts">
	import { enhance } from '$app/forms';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import { currentConfirmDeleteId, editSearchData } from '@/stores/stores';
	import { onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/(Client)/search/$types';

	let { data, form }: { data: any; form: ActionData } = $props();

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
		// clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect(partId);
</script>

<form
	action={'?/editSearchScrapRecord'}
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
	class="formNormalize"
>
	<h2 class="text-center font-semibold text-2xl text-warning mb-6">Edit scrap</h2>

	<!-- if edit  -->
	<input type="text" hidden name="scrapRecordId" bind:value={idEditScrapRecord} />
	<!-- -->
	<!-- part COMBO -->
	<article class="flex justify-between items-center gap-2">
		{#await data.allPartsPromise}
			<span>Loading...</span>
		{:then parts}
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
		{/await}
	</article>
	<!-- -->
	<!-- scrap code COMBO -->
	<article class="flex justify-between items-center gap-2">
		{#await data.scrapCodesPromise}
			<span>Loading...</span>
		{:then scrapCodes}
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
			class="inputNormalize max-w-[350px]"
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
			class="inputNormalize max-w-[350px]"
			bind:value={quantity}
		/>
	</article>
	<!-- -->
	<!-- input createdBy -->
	<article class="flex justify-between items-center gap-2">
		<Label for="operatorId" class="text-sm md:text-lg">Operator ID</Label>

		<Input
			placeholder="Operator id"
			name="operatorId"
			id="operatorId"
			class="inputNormalize max-w-[350px]"
			bind:value={operatorId}
		/>
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
