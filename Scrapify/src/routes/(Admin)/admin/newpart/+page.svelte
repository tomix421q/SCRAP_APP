<script lang="ts">
	import type { Part, Process, Project } from '@prisma/client';
	import { PART_SIDES, type PartSide, type PartWithRelation } from '@/utils/types';
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
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	interface CustomPageData {
		parts: PartWithRelation[];
		projects: Project[];
		processes: Process[];
		totalPages: number;
		partsCount: number;
	}

	let { data, form }: PageProps = $props();
	let { parts, processes, projects, totalPages, partsCount } = $derived(
		data.data
	) as CustomPageData;
	let isSubmitting = $state(false);

	// id
	let idEditPart = $state<number>();
	let processId = $state('');
	let projectId = $state('');
	let partProdNumberId = $state('');
	let partSide = $state('') as PartSide;

	//reset
	let resetProcessCombo = $state(false);
	let resetPartSideCombo = $state(false);

	async function clearEditForm() {
		idEditPart = undefined;
		processId = '';
		projectId = '';
		partProdNumberId = '';
		partSide = '' as PartSide;
		$editPartData = undefined;
		// const url = new URL($page.url)
		// url.searchParams.delete('processId')
		// await goto(`${url.pathname}${url.search}`, { keepFocus: true, noScroll: true });
	}

	$effect(() => {
		if ($editPartData) {
			form = null;
			idEditPart = $editPartData.id;
			processId = $editPartData.processId.toString();
			projectId = $editPartData.projectId.toString();
			partProdNumberId = $editPartData.partNumber;
			partSide = $editPartData.side as PartSide;
		}
	});
	$effect(() => {
		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});
	$effect(() => {
		if (processId) {
			if (processId !== $editPartData?.processId.toString()) {
				projectId = '';
			}
			const params = new URLSearchParams();
			params.set('processId', processId.toString());
			goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect(projectId);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- CREATE & EDIT PART -->
	<section class="w-full">
		<form
			method="POST"
			action={idEditPart ? '?/editPart' : '?/createPart'}
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					if (result?.type === 'success' || result?.type === 'failure') {
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

			<!-- process COMBO -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="processId" class="text-sm md:text-lg">Process</Label>
				<Combobox
					dataBox={processes}
					bind:value={processId}
					reset={resetProcessCombo}
					id="processId"
				/>
				<input type="hidden" name="processId" required bind:value={processId} />
			</article>
			<!--  -->
			<!-- project dynamic combo -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="projectId" class="text-sm md:text-lg">Project</Label>
				<Combobox
					dataBox={projects}
					bind:value={projectId}
					reset={resetProcessCombo}
					id="projectId"
				/>
				<input type="hidden" name="projectId" required bind:value={projectId} />
			</article>
			<!--  -->
			<!-- Side [optional] -->
			<article class="flex flex-col justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="partSide" class="text-sm md:text-lg"
					>Side <span class="text-xs text-chart-info">[Optional]</span></Label
				>
				<Combobox
					dataBox={PART_SIDES}
					bind:value={partSide}
					reset={resetPartSideCombo}
					id={'partSide'}
				/>
				<input type="hidden" name="partSide" required bind:value={partSide} />
			</article>
			<!--  -->
			<!-- Part inputs !!! -->
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm md:text-lg">Part number</Label>
				<Input
					type="text"
					name="partNumber"
					id="partNumber"
					bind:value={partProdNumberId}
					placeholder="Insert part number"
					class="inputNormalize lg:w-[350px]"
					required
				/>
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
