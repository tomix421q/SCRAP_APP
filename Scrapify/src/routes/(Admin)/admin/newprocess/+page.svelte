<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { enhance } from '$app/forms';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Plus } from '@lucide/svelte';
	import type { Hall, Process, Project } from '@prisma/client';
	import type { PageProps } from './$types';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';

	interface CustomPageData {
		processes: Process[];
		projects: Project[];
		halls: Hall[];
	}

	let { data, form }: PageProps = $props();
	let { processes, projects, halls } = $derived(data.data) as CustomPageData;

	let isSubmitting = $state(false);

	// id
	let hallId = $state('');
	let projectId = $state('');

	// reset
	let resetHallCombo = $state(false);
	let resetProjectCombo = $state(false);

	let projectName = $state('');
	let projectDescription = $state('');

	// $inspect(form);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10 mx-auto">
	<section class="w-full sm:w-lg">
		<form
			method="POST"
			action="?/createProcess"
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					// await new Promise((resolve) => setTimeout(resolve, 5000));
					if (result?.type === 'success') {
						resetHallCombo = true;
						resetProjectCombo = true;
					}
					await update();
					isSubmitting = false;
					resetHallCombo = false;
					resetProjectCombo = false;
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-10 text-2xl">Create new process</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!--  -->
			<!-- hall COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="hallId" class="text-sm md:text-lg">Hall</Label>
				<div class="flex gap-2">
					<Combobox dataBox={halls} bind:value={hallId} reset={resetHallCombo} id="hallId" />
					<Button size="icon" href="/admin/newhall"><Plus /></Button>
				</div>
				<input type="hidden" name="hallId" required bind:value={hallId} />
			</article>
			<!--  -->
			<!-- project COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="projectId" class="text-sm md:text-lg">Project</Label>
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
					bind:value={projectName}
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
					bind:value={projectDescription}
					class="inputNormalize max-w-[240px]"
					placeholder="Process description (optional)"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Create project
				{/if}
			</Button>
		</form>
	</section>

	<!--  -->
	<!-- PROJECT LIST -->
	<section class="flex listNormalize flex-col gap-2 w-full lg:min-w-3xl max-h-[500px]">
		<h2 class="text-2xl text-center mb-6">Actuall process list</h2>
		{#each processes as process}
			<div class="flex gap-2">
				<p class="min-w-[80px] text-muted-foreground">
					ID: <span class="text-primary">{process.id}</span>
				</p>
				<p class="text-muted-foreground">Name: <span class="text-primary">{process.name}</span></p>
			</div>
		{/each}
	</section>
</main>
