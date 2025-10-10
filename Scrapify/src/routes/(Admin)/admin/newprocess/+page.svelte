<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { enhance } from '$app/forms';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Plus } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import NewProcessTable from '@/components/organism/Tables/NewProcessTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editProcessData } from '@/stores/stores';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();
	let { processes, projects, totalPages, processCount } = $derived(data.data);
	let isSubmitting = $state(false);

	// id
	let idEditProcess = $state<number>();
	let projectId = $state('');
	let processName = $state('');
	let processDescription = $state('');

	// reset
	let resetProjectCombo = $state(false);

	function clearEditForm() {
		idEditProcess = undefined;
		projectId = '';
		processName = '';
		processDescription = '';
		$editProcessData = undefined;
	}

	$effect(() => {
		if ($editProcessData) {
			form = null;
			idEditProcess = $editProcessData.id;
			projectId = $editProcessData.projectId.toString();
			processName = $editProcessData.name;
			if ($editProcessData.description) processDescription = $editProcessData.description;
		}

		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	$inspect(projectId);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10 mx-auto">
	<!--  -->
	<!-- CREATE & EDIT PROCESS -->
	<section class="w-full sm:w-lg">
		<form
			method="POST"
			action={idEditProcess ? '?/editProcess' : '?/createProcess'}
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					// await new Promise((resolve) => setTimeout(resolve, 5000));
					if (result?.type === 'success' || result.type === 'failure') {
						resetProjectCombo = true;
					}
					await update();
					isSubmitting = false;
					resetProjectCombo = false;
					clearEditForm();
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-6 text-2xl">{idEditProcess ? 'Edit process' : 'Create new process'}</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="processId" bind:value={idEditProcess} />

			<!--  -->
			<!-- project COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="projectId" class="text-sm md:text-lg">Project</Label>
				<!-- if edit -->
				{#if idEditProcess}
					{@const actuallProject = projects.find((project) => project.id === Number(projectId))}
					<p class=" ml-auto text-sm text-chart-1">
						<span>{actuallProject ? actuallProject.name : 'Unknown project'}</span>
					</p>
				{/if}
				<div class="flex gap-2">
					<Combobox
						dataBox={projects}
						bind:value={projectId}
						reset={resetProjectCombo}
						id="projectId"
					/>
					<Button size="icon" href="/admin/newproject"><Plus /></Button>
				</div>
				<input type="hidden" name="projectId" required bind:value={projectId} />
			</article>
			<!--  -->
			<!-- Process -->
			<article class="flex justify-between items-center gap-2">
				<Label for="processName" class="text-xl">Name</Label>
				<Input
					type="text"
					name="processName"
					id="processName"
					bind:value={processName}
					placeholder="Insert process name"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="processDescription" class="text-xl">Description</Label>
				<Input
					type="text"
					name="processDescription"
					id="processDescription"
					bind:value={processDescription}
					class="inputNormalize max-w-[240px]"
					placeholder="Process description (optional)"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					{idEditProcess ? 'Edit process' : 'Create process'}
				{/if}
			</Button>
			{#if idEditProcess}
				<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
			{/if}
		</form>
	</section>

	<!--  -->
	<!-- PROJECT LIST -->
	<section class="">
		<NewProcessTable {processes} {totalPages} {processCount} headerText="Process list" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
