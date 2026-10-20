<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import Button from '@/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import { Input } from '@/components/ui/input';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import NewPartTable from '@/components/organism/Tables/NewPartTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId } from '@/stores/stores';
	import { onMount } from 'svelte';
	import Filter from '@/components/organism/Filter.svelte';

	let { data, form }: PageProps = $props();
	let { parts, totalPages, partsCount } = $derived(data.data);
	let isSubmitting = $state(false);

	// id
	let isImport = $state(false);
	let idEditPart = $state<number>();
	let descriptionInput = $state<string | null>('');
	let partProdNumberId = $state('');

	async function clearEditForm() {
		idEditPart = undefined;
		descriptionInput = '';
		partProdNumberId = '';
	}

	$effect(() => {
		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});
	$effect(() => {
		if (isImport) {
			form = undefined!;
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect($editPartData);
</script>

<article class="flex gap-8">
	<ToNavigateBtn text="Back to admin panel" href="/admin" />
	<div class="flex gap-1 items-center h-fit text-muted-foreground text-sm uppercase">
		<!-- <Button
			variant="link"
			size="icon"
			class="rounded-xl transition-all"
			onclick={() => (isImport = !isImport)}
		>
			{#if isImport}
				<ToggleLeft class="size-10 stroke-1" title="Import parts" />
			{:else}
				<ToggleRight class="size-10 stroke-1" title="Import parts" />
			{/if}
		</Button>
		{isImport ? 'Import' : 'Create'} -->
	</div>
</article>

<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- CREATE & EDIT PART -->
	<section class="w-full items-start flex max-md:flex-col gap-5 justify-between">
		{#if false}
			<form
				method="POST"
				action={idEditPart ? '?/editPart' : '?/createPart'}
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update, result }) => {
						if (result?.type === 'success') {
							clearEditForm();
						}
						await update();
						isSubmitting = false;
						// if ($isEditing) {
						// 	clearEditForm();
						// }
					};
				}}
				class="formNormalize sm:w-xl"
			>
				<div class="flex">
					<h1 class="mx-auto mb-6 text-2xl">{idEditPart ? 'Edit part' : 'Create new part'}</h1>
				</div>

				<div>
					<ResultInfo data={form} />
				</div>
				<!-- if edit  -->
				<input type="text" hidden name="partId" bind:value={idEditPart} />

				<!--  -->
				<!-- Part inputs !!! -->
				<article class="flex flex-col lg:flex-row justify-between gap-2">
					<Label for="partNumber" class="text-sm md:text-lg">Part number</Label>
					<Input
						type="text"
						name="partNumber"
						id="partNumber"
						bind:value={partProdNumberId}
						placeholder="Insert part number..."
						class="inputNormalize lg:w-[350px] text-xl! text-warning placeholder:text-sm"
						autocomplete={'off'}
						required
					/>
				</article>

				<!--  -->
				<!-- Description -->
				<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
					<Label for="description" class="text-sm md:text-lg"
						>Description <span class="text-xs text-chart-info">[Optional]</span></Label
					>
					<Input
						type="text"
						max={64}
						alt="description"
						class="inputNormalize max-w-[350px]"
						placeholder="Short info..."
						bind:value={descriptionInput}
					/>

					<input type="hidden" name="description" required bind:value={descriptionInput} />
				</article>

				<Button type="submit" class="mt-10 ">
					{#if isSubmitting}
						<span>Submitting...</span>
					{:else}
						{idEditPart ? 'Edit part' : 'Create part'}
					{/if}
				</Button>
				{#if idEditPart}
					<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
				{/if}
			</form>
		{/if}

		<!--  -->
		<!-- Filter -->
		<section class="flex flex-col gap-4">
			<Filter whereUse="part" />
		</section>
	</section>

	<!--  -->
	<!-- PARTS LIST -->
	<section class="">
		<NewPartTable {parts} {partsCount} headerText="Parts list" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
