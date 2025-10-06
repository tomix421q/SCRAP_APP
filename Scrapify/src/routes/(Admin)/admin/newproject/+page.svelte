<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Plus } from '@lucide/svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import NewProjectTable from '@/components/organism/Tables/NewProjectTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editProjectData, isEditing } from '@/stores/stores';
	import { onMount } from 'svelte';

	let { form, data }: PageProps = $props();
	let { projects, halls, totalPages, projectsCount } = $derived(data.data);
	let isSubmitting = $state(false);

	let idEditProject = $state<number>();
	let hallId = $state('');
	let projectName = $state('');
	let projectDescription = $state('');

	let resetHallCombo = $state(false);

	function clearEditForm() {
		idEditProject = undefined;
		hallId = '';
		projectName = '';
		projectDescription = '';
		$editProjectData = undefined;
	}

	$effect(() => {
		if ($editProjectData) {
			form = null;
			idEditProject = $editProjectData.id;
			hallId = $editProjectData.hallId.toString();
			projectName = $editProjectData.name;
			if ($editProjectData.description) projectDescription = $editProjectData.description;
		}

		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect($isEditing);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- CREATE & EDIT PROJECT -->
	<section class="w-full sm:w-lg">
		<form
			method="POST"
			action={idEditProject ? '?/editProject' : '?/createProject'}
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					if (result?.type === 'success') {
						resetHallCombo = true;
					}
					await update();
					isSubmitting = false;
					resetHallCombo = false;
					clearEditForm();
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-6 text-2xl">{idEditProject ? 'Edit Project' : 'Create new project'}</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="projectId" bind:value={idEditProject} />

			<!--  -->
			<!-- hall COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="hallId" class="text-sm md:text-lg">Hall</Label>
				<!-- if edit -->
				{#if idEditProject}
					{@const actualHall = halls.find((hall) => hall.id === Number(hallId))}
					<p class=" ml-auto text-sm text-chart-1">
						<span>{actualHall ? actualHall.name : 'Unknown hall'}</span>
					</p>
				{/if}
				<div class="flex gap-2">
					<Combobox dataBox={halls} bind:value={hallId} reset={resetHallCombo} id="hallId" />
					<Button size="icon" href="/admin/newhall"><Plus /></Button>
				</div>
				<input type="hidden" name="hallId" required bind:value={hallId} />
			</article>
			<!--  -->
			<!-- project -->
			<article class="flex justify-between items-center gap-2">
				<Label for="projectName" class="text-xl">Name</Label>
				<Input
					type="text"
					name="projectName"
					id="projectName"
					bind:value={projectName}
					placeholder="Insert project name"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="projectDescription" class="text-xl">Description</Label>
				<Input
					type="text"
					name="projectDescription"
					id="projectDescription"
					bind:value={projectDescription}
					class="inputNormalize max-w-[240px]"
					placeholder="Project description (optional)"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					{idEditProject ? 'Edit project' : 'Create project'}
				{/if}
			</Button>
			{#if idEditProject}
				<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
			{/if}
		</form>
	</section>

	<!--  -->
	<!-- PROCESS LIST -->
	<section class="">
		<NewProjectTable {projects} {totalPages} {projectsCount} headerText="Projects list" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
