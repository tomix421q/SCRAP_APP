<script lang="ts">
	import type { Hall, Part, Process, Project } from '@prisma/client';
	import { PART_SIDES, type PartSide } from '@/utils/types';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Plus } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { Input } from '@/components/ui/input';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import NewPartTable from '@/components/organism/Tables/NewPartTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editPartData } from '@/stores/stores';
	import { onMount } from 'svelte';

	interface CustomPageData {
		parts: Part[];
		processes: Process[];
		totalPages: number;
		partsCount: number;
	}

	let { data, form }: PageProps = $props();
	let { parts, processes, totalPages, partsCount } = $derived(data.data) as CustomPageData;
	let isSubmitting = $state(false);

	// id
	let idEditPart = $state<number>();
	let processId = $state('');
	let partProdNumberId = $state('');
	let partSide = $state('') as PartSide;

	//reset
	let resetProcessCombo = $state(false);
	let resetPartSideCombo = $state(false);

	function clearEditForm() {
		idEditPart = undefined;
		processId = '';
		partProdNumberId = '';
		partSide = '' as PartSide;
		$editPartData = undefined;
	}

	$effect(() => {
		if ($editPartData) {
			form = null;
			idEditPart = $editPartData.id;
			processId = $editPartData.processId.toString();
			partProdNumberId = $editPartData.partNumber;
			partSide = $editPartData.side as PartSide;
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
	<!-- CREATE & EDIT PART -->
	<section class="w-full sm:w-lg">
		<form
			method="POST"
			action={idEditPart ? '?/editPart' : '?/createPart'}
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					if (result?.type === 'success') {
						resetProcessCombo = true;
						resetPartSideCombo = true;
					}
					await update();
					isSubmitting = false;
					resetProcessCombo = false;
					resetPartSideCombo = false;
					clearEditForm();
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-6 text-2xl">{idEditPart ? 'Edit part' : 'Create new part'}</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="partId" bind:value={idEditPart} />

			<!-- process COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="processId" class="text-sm md:text-lg">Process</Label>
				{#if idEditPart}
					{@const actuallPart = processes.find((process) => process.id === Number(processId))}
					<p class=" ml-auto text-sm text-chart-1">
						<span>{actuallPart ? actuallPart.name : 'Unknown part'}</span>
					</p>
				{/if}
				<div class="flex gap-2">
					<Combobox
						dataBox={processes}
						bind:value={processId}
						reset={resetProcessCombo}
						id="processId"
					/>
					<Button size="icon" href="/admin/newprocess"><Plus /></Button>
				</div>
				<input type="hidden" name="processId" required bind:value={processId} />
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
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="partSide" class="text-sm md:text-lg"
					>Side <span class="text-xs text-muted-foreground">[Optional]</span></Label
				>
				{#if idEditPart}
					<p class=" ml-auto text-sm text-chart-1">
						<span>{partSide ? partSide : 'Empty'}</span>
					</p>
				{/if}
				<div class="flex gap-2 w-[240px]">
					<Combobox
						dataBox={PART_SIDES}
						bind:value={partSide}
						reset={resetPartSideCombo}
						id={'partSide'}
					/>
				</div>
				<input type="hidden" name="partSide" required bind:value={partSide} />
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
