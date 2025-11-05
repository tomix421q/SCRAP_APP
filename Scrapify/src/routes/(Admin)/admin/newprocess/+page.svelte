<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { enhance } from '$app/forms';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Plus, X } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import NewProcessTable from '@/components/organism/Tables/NewProcessTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editProcessData } from '@/stores/stores';
	import { onMount, tick } from 'svelte';
	import type { ProjectsOnProcess } from '@prisma/client';

	let { data, form }: PageProps = $props();
	let { processes, projects, halls, totalPages, processCount } = $derived(data.data);
	let isSubmitting = $state(false);

	// id
	let idEditProcess = $state<number>();
	let processName = $state('');
	let processDescription = $state('');
	let hallId = $state('');
	// Combobox
	let comboboxProjectSlots = $state<Record<string, string>>({
		slot1: '',
		slot2: '',
		slot3: '',
		slot4: '',
		slot5: '',
		slot6: '',
		slot7: '',
		slot8: '',
		slot9: ''
	});
	let showSlot: Record<string, boolean> = $state({});
	function initializeComboboxSlots() {
		comboboxProjectSlots = {
			slot1: '',
			slot2: '',
			slot3: '',
			slot4: '',
			slot5: '',
			slot6: '',
			slot7: '',
			slot8: '',
			slot9: ''
		};
		showSlot = { slot1: true };
		for (let i = 2; i <= 9; i++) {
			showSlot[`slot${i}`] = false;
		}
	}

	function addComboboxSlot() {
		for (let i = 1; i <= 9; i++) {
			const slotKey = `slot${i}`;
			if (!showSlot[slotKey]) {
				showSlot[slotKey] = true;
				break;
			}
		}
	}
	let resetProjectCombo = $state(false);

	//For Server project ids dynamic record
	const projectIdsForServer = $derived.by(() => {
		const allSelectedStrings = Object.values(comboboxProjectSlots);
		const uniqueStrings = Array.from(new Set(allSelectedStrings));

		const uniqueNumbers = uniqueStrings
			.filter((idStr) => idStr !== '')
			.map((idStr) => parseInt(idStr, 10));
		return uniqueNumbers;
	});
	let selectedProjectIds = $derived<number[]>(projectIdsForServer);

	function clearEditForm() {
		idEditProcess = undefined;
		selectedProjectIds = [];
		processName = '';
		processDescription = '';
		hallId = '';
		initializeComboboxSlots();
		$editProcessData = undefined;
	}

	$effect(() => {
		if ($editProcessData && $editProcessData.id !== idEditProcess) {
			form = null;
			idEditProcess = $editProcessData.id;
			processName = $editProcessData.name;
			hallId = $editProcessData.hallId.toString();
			if ($editProcessData.description) processDescription = $editProcessData.description;
			if ($editProcessData.project && Array.isArray($editProcessData.project)) {
				initializeComboboxSlots();
				$editProcessData.project.forEach((pop: ProjectsOnProcess, index: number) => {
					let slotKey = `slot${index + 1}` as keyof typeof comboboxProjectSlots;
					if (comboboxProjectSlots.hasOwnProperty(slotKey)) {
						comboboxProjectSlots[slotKey] = String(pop.projectId);
						showSlot[slotKey] = true;
						tick();
					}
				});
			} else {
				initializeComboboxSlots();
			}
		}
		if ($currentConfirmDeleteId) {
			if (selectedProjectIds.length !== 0) {
				clearEditForm();
			}
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect(proce);
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
			<h1 class="mx-auto lg:mb-6 text-2xl">
				{idEditProcess ? 'Edit process' : 'Create new process'}
			</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="processId" bind:value={idEditProcess} />

			<!--  -->
			<!-- Hall -->
			<article class="flex flex-col lg:flex-row items-start justify-between gap-2">
				<Label for="hallId" class="md:text-xl">Hall</Label>
				<Combobox dataBox={halls} bind:value={hallId} reset={resetProjectCombo} id="hallId" />
				<Input type="hidden" name="hallId" value={hallId} required />
			</article>
			<!--  -->
			<!-- project COMBOs -->
			<article class="flex justify-between items-center gap-2">
				<ul class="flex flex-col gap-2 space-y-1 w-full">
					{#each Object.entries(comboboxProjectSlots) as [slotKey, slotValue]}
						{#if showSlot[slotKey]}
							<li class="flex flex-col md:flex-row justify-between">
								<Label for="projectId" class="text-sm md:text-lg"
									>Project <span class="text-sm text-chart-info capitalize tracking-widest"
										>[{slotKey}]</span
									></Label
								>
								<div class="flex gap-2">
									<Button
										title="Remove item"
										size="icon"
										variant="ghost"
										class={(slotKey === 'slot1' && slotValue) || slotKey !== 'slot1'
											? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
											: 'hidden'}
										onclick={() => {
											comboboxProjectSlots[slotKey] = '';
											if (slotKey === 'slot1') return;
											showSlot[slotKey] = false;
										}}><X /></Button
									>
									{#if selectedProjectIds}
										<Combobox
											dataBox={projects}
											bind:value={comboboxProjectSlots[slotKey]}
											reset={resetProjectCombo}
											id="projectId"
										/>
									{/if}
								</div>
							</li>
						{/if}
					{/each}
				</ul>

				{#each selectedProjectIds as projectId (projectId)}
					<input type="hidden" name="projectId" required value={projectId} />
				{/each}
			</article>
			{#if Object.values(showSlot).filter((s) => s).length < 9}
				<Button
					size="sm"
					variant="outline"
					onclick={addComboboxSlot}
					class="w-full lg:w-[370px] ml-auto text-chart-1 bg-chart-1/10"
					><Plus /> Add more project for this process</Button
				>
			{/if}

			<!--  -->
			<!-- Process -->
			<article class="flex justify-between items-center gap-2">
				<Label for="processName" class="md:text-xl">Name</Label>
				<Input
					type="text"
					name="processName"
					id="processName"
					bind:value={processName}
					placeholder="Insert process name"
					class="inputNormalize w-full lg:w-[350px]"
					required
				/>
			</article>
			<!--  -->
			<!-- Description -->
			<article class="flex justify-between items-center gap-2">
				<Label for="processDescription" class="md:text-xl">Description</Label>
				<Input
					type="text"
					name="processDescription"
					id="processDescription"
					bind:value={processDescription}
					class="inputNormalize w-full lg:w-[350px]"
					placeholder="Process description (optional)"
				/>
			</article>
			<!--  -->
			<!-- BTNS -->
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
