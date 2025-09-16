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

	interface CustomPageData {
		parts: Part[];
		processes: Process[];
		projects: Project[];
		halls: Hall[];
		totalPages: number;
		partsCount: number;
	}

	let { data, form }: PageProps = $props();
	let { parts, processes, projects, halls, totalPages, partsCount } = $derived(
		data.data
	) as CustomPageData;

	let isSubmitting = $state(false);

	// id
	let hallId = $state('');
	let projectId = $state('');
	let processId = $state('');

	//reset
	let resetHallCombo = $state(false);
	let resetProjectCombo = $state(false);
	let resetProcessCombo = $state(false);
	let resetPartSideCombo = $state(false);

	let partProdNumberId = $state('');
	let partSide = $state('') as PartSide;
	// let partColor = $state('');

	// $inspect(partsCount);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- FORM -->
	<section class="w-full sm:w-lg">
		<form
			method="POST"
			action="?/createPart"
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					if (result?.type === 'success') {
						resetHallCombo = true;
						resetProjectCombo = true;
						resetProcessCombo = true;
						resetPartSideCombo = true;
					}
					await update();
					isSubmitting = false;
					resetHallCombo = false;
					resetProjectCombo = false;
					resetProcessCombo = false;
					resetPartSideCombo = false;
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-6 text-2xl">Create new part</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- hall COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="hallId" class="text-sm md:text-lg">Hall</Label>
				<div class="flex gap-2">
					<Combobox dataBox={halls} bind:value={hallId} reset={resetHallCombo} id="hallId" />
					<Button size="icon" href="/admin/newhall"><Plus /></Button>
				</div>
				<input type="hidden" name="hallId" required bind:value={hallId} />
			</article>
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
					<Button size="icon" href="/admin/newprocess"><Plus /></Button>
				</div>
				<input type="hidden" name="processId" required bind:value={processId} />
			</article>
			<!--  -->
			<!-- Part inputs !!! -->
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Part number</Label>
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
				<Label for="partSide" class="text-sm sm:text-xl">Side</Label>
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
					Create part
				{/if}
			</Button>
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
