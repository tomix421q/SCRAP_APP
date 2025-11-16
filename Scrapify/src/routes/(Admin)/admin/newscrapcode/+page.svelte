<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import NewScrapCodeTable from '@/components/organism/Tables/NewScrapCodeTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editScrapData } from '@/stores/stores';
	import { onMount } from 'svelte';
	import type { FilterType } from '@/utils/types';
	import Filter from '@/components/organism/Filter.svelte';

	let { data, form }: PageProps = $props();
	let { scrapCodes, processes, scrapCodeCount, totalPages } = $derived(data.data);
	let isSubmitting = $state(false);

	// ids
	let idEditScrapCode = $state<number>();
	let processId = $state('');
	let scrapcodeNum = $state('');
	let scrapcodeName = $state('');
	let scrapDescription = $state('');

	//reset combo
	let resetProcessCombo = $state(false);

	function clearEditForm() {
		idEditScrapCode = undefined;
		// processId = '';
		scrapcodeNum = '';
		scrapcodeName = '';
		scrapDescription = '';
		$editScrapData = undefined;
	}

	$effect(() => {
		if ($editScrapData) {
			form = null;
			idEditScrapCode = $editScrapData.id;
			if ($editScrapData.processId) processId = $editScrapData.processId.toString();
			scrapcodeNum = $editScrapData.code;
			scrapcodeName = $editScrapData.name;
			if ($editScrapData.description) scrapDescription = $editScrapData.description;
		}

		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect(processId);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- FORM -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			action={idEditScrapCode ? '?/editScrap' : '?/createScrap'}
			method="POST"
			class="formNormalize"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result.type === 'success') {
						// resetProcessCombo = true;
						clearEditForm();
					}
					await update();
					isSubmitting = false;
					// resetProcessCombo = false;
				};
			}}
		>
			<h1 class="mx-auto mb-6 text-2xl">
				{idEditScrapCode ? 'Edit scrap code' : 'Create screp code'}
			</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="scrapCodeId" bind:value={idEditScrapCode} />

			<!--  -->
			<!-- process COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="processId" class="text-sm md:text-lg">Process</Label>
				<div class="flex gap-2">
					<Combobox
						dataBox={processes}
						bind:value={processId}
						reset={resetProcessCombo}
						id="processId"
					/>
				</div>
				<input type="hidden" name="processId" required bind:value={processId} />
			</article>
			<!--  -->
			<!-- Inputs -->
			<!--  -->
			<!-- Code -->
			<article class="flex justify-between items-center gap-2">
				<Label for="scrapcodeNum" class="text-sm sm:text-xl">Code</Label>
				<Input
					type="text"
					name="scrapcodeNum"
					id="scrapcodeNum"
					bind:value={scrapcodeNum}
					placeholder="Insert scrap code"
					class="inputNormalize lg:w-[350px]"
					required
				/>
			</article>
			<!-- Name -->
			<article class="flex justify-between items-center gap-2">
				<Label for="scrapcodeName" class="text-sm sm:text-xl">Name</Label>
				<Input
					type="text"
					name="scrapcodeName"
					id="scrapcodeName"
					bind:value={scrapcodeName}
					placeholder="Insert scrap code name"
					class="inputNormalize lg:w-[350px]"
					required
				/>
			</article>
			<!-- Description -->
			<article class="flex justify-between items-center gap-2">
				<Label for="scrapDescription" class="text-sm sm:text-xl">Description</Label>
				<Input
					type="text"
					name="scrapDescription"
					id="scrapDescription"
					bind:value={scrapDescription}
					placeholder="Scrap description (optional)"
					class="inputNormalize lg:w-[350px]"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					{idEditScrapCode ? 'Edit scrap code' : 'Create scrap code'}
				{/if}
			</Button>
			{#if idEditScrapCode}
				<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
			{/if}
		</form>
		<!-- Filter -->
		<section>
			<Filter allProcesses={processes} whereUse="scrapCode" />
		</section>
	</section>

	<!--  -->
	<!-- Scrap Code LIST -->
	<section class="">
		<NewScrapCodeTable
			{scrapCodes}
			{totalPages}
			{scrapCodeCount}
			{processes}
			headerText="Codes list"
		/>
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
