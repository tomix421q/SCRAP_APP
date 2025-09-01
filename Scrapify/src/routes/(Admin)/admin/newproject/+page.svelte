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

	let { form, data }: PageProps = $props();
	let { projects, halls } = $derived(data.data);

	let isSubmitting = $state(false);
	let hallId = $state('');
	let resetHallCombo = $state(false);
	let projectName = $state('');
	let projectDescription = $state('');
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- CREATE PROJECT -->
	<section class="w-full sm:w-lg mx-auto">
		<form
			method="POST"
			action="?/createProject"
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					// await new Promise((resolve) => setTimeout(resolve, 5000));
					if (result?.type === 'success') {
						resetHallCombo = true;
					}
					await update();
					isSubmitting = false;
					resetHallCombo = false;
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-10 text-2xl">Create new project</h1>
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
					Create project
				{/if}
			</Button>
		</form>
	</section>

	<!--  -->
	<!-- PROCESS LIST -->
	<section class="flex listNormalize flex-col gap-2 w-full lg:min-w-3xl max-h-[500px]">
		<h2 class="text-2xl text-center mb-6">Actuall project list</h2>
		{#each projects as project}
			<div class="flex gap-2">
				<p class="min-w-[80px] text-muted-foreground">
					ID: <span class="text-primary">{project.id}</span>
				</p>
				<p class="text-muted-foreground">Name: <span class="text-primary">{project.name}</span></p>
			</div>
		{/each}
	</section>
</main>
