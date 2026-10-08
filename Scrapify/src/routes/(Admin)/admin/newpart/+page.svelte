<script lang="ts">
	import { PART_SIDES, type PartSide } from '@/utils/types';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import { Input } from '@/components/ui/input';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import NewPartTable from '@/components/organism/Tables/NewPartTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editPartData, isEditing } from '@/stores/stores';
	import { onMount, untrack } from 'svelte';
	import Filter from '@/components/organism/Filter.svelte';
	import { X } from '@lucide/svelte';
	import { page } from '$app/state';

	let { data, form }: PageProps = $props();
	let { parts, processes, projects, totalPages, partsCount, groups } = $derived(data.data);
	let isSubmitting = $state(false);

	// id
	let idEditPart = $state<number>();
	let descriptionInput = $state<string | null>('');
	let partProdNumberId = $state('');
	let partSide = $state('') as PartSide;
	let groupId = $state('');

	//reset
	let resetProcessCombo = $state(false);
	let resetPartSideCombo = $state(false);

	async function clearEditForm() {
		idEditPart = undefined;
		descriptionInput = '';
		partProdNumberId = '';
		partSide = '' as PartSide;
		$editPartData = undefined;
	}

	// function updateFilterParams(procId: string, projId: string) {
	// 	const params = new URLSearchParams(page.url.searchParams);
	// 	const currentUrlProc = params.get('description') ?? '';

	// 	if (currentUrlProc === procId && currentUrlProj === (projId || '')) {
	// 		return;
	// 	}
	// 	if (procId) {
	// 		params.set('processId', procId);
	// 	} else {
	// 		params.delete('processId');
	// 	}

	// 	if (projId) {
	// 		params.set('projectId', projId);
	// 	} else {
	// 		params.delete('projectId');
	// 	}
	// 	goto(`?${params.toString()}`, {
	// 		keepFocus: true,
	// 		noScroll: true,
	// 		replaceState: true
	// 	});
	// }

	$effect(() => {
		if ($editPartData) {
			form = null;
			idEditPart = $editPartData.id;
			partProdNumberId = $editPartData.partNumber;
			descriptionInput = $editPartData.description;
			partSide = $editPartData.side as PartSide;
		}
	});
	$effect(() => {
		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});
	$effect(() => {
		const curDesc = descriptionInput;
		untrack(() => {
			const edit = $editPartData?.id.toString();
			if (edit && curDesc !== descriptionInput) {
				descriptionInput = '';
			}
			// if(edit)

			// updateFilterParams(curProc, curProj);
		});
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect($editPartData);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- CREATE & EDIT PART -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			method="POST"
			action={idEditPart ? '?/editPart' : '?/createPart'}
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result?.type === 'success') {
						// descriptionInput = '';
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
			<h1 class="mx-auto mb-6 text-2xl">{idEditPart ? 'Edit part' : 'Create new part'}</h1>
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

			<!--  -->
			<!-- Side [optional] -->
			<article class="flex flex-col justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="partSide" class="text-sm md:text-lg"
					>Side <span class="text-xs text-chart-info">[Optional]</span></Label
				>
				<div class="flex gap-2">
					{#if partSide}
						<Button
							title="Remove filter"
							size="icon"
							variant="ghost"
							class="flex text-destructive bg-destructive/10 hover:bg-destructive/50"
							onclick={() => {
								partSide = '' as PartSide;
							}}><X /></Button
						>
					{/if}
					<Combobox
						dataBox={PART_SIDES}
						bind:value={partSide}
						reset={resetPartSideCombo}
						id={'partSide'}
					/>
				</div>

				<input type="hidden" name="partSide" required bind:value={partSide} />
			</article>

			<!--  -->
			<!-- Part group !!! -->
			<article class="flex justify-between items-center gap-2">
				<Label for="groupId" class="text-sm md:text-lg"
					>Part group <span class="text-xs text-chart-info">[Optional]</span></Label
				>
				<div class="flex gap-2">
					{#if groupId}
						<Button
							title="Remove filter"
							size="icon"
							variant="ghost"
							class="flex text-destructive bg-destructive/10 hover:bg-destructive/50"
							onclick={() => {
								groupId = '';
							}}><X /></Button
						>
					{/if}
					<Combobox dataBox={groups} bind:value={groupId} reset={resetProcessCombo} id="groupId" />
				</div>

				<input type="hidden" name="groupId" required bind:value={groupId} />
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
		<!--  -->
		<!-- Filter -->
		<section>
			<Filter whereUse="part" />
		</section>
	</section>

	<!--  -->
	<!-- PARTS LIST -->
	<section class="">
		<NewPartTable {parts} {totalPages} {partsCount} headerText="Parts list" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
