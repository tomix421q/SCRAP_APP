<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Plus, X } from '@lucide/svelte';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import LabelGroupsTable from '@/components/organism/Tables/LabelGroupsTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';

	let { data, form }: PageProps = $props();
	let { groups, processes, projects, labelGroups, labelGroupsCount, totalPages } = $derived(
		data.data
	);

	// vars
	let isMounted = false;
	let idEditLabel = $state<number>();
	let isSubmitting = $state(false);
	let comboGroups = $state<Record<string, string>>(
		Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`slot${i + 1}`, '']))
	);
	let showSlot: Record<string, boolean> = $state({});
	let resetGroupCombo = $state(false);
	let resetProcessCombo = $state(false);
	let label = $state('');
	let selectedGroupsIds = $derived(
		Object.values(comboGroups).filter((val) => val && val.trim() !== '')
	);
	let filterOptions = $state({
		processId: page.url.searchParams.get('processId') ?? '',
		projectId: page.url.searchParams.get('projectId') ?? ''
	});
	let prevProc = $state(filterOptions.processId);
	let prevProj = $state(filterOptions.projectId);
	// func
	async function clearEditForm() {
		idEditLabel = undefined;
		filterOptions.processId = '';
		filterOptions.projectId = '';
		label = '';
		resetGroupCombo = true;
	}
	function addComboboxSlot() {
		for (let i = 1; i <= 100; i++) {
			const slotKey = `slot${i}`;
			if (!showSlot[slotKey]) {
				showSlot[slotKey] = true;
				break;
			}
		}
	}

	function applyFilter() {
		const params = new URLSearchParams(page.url.searchParams);
		if (filterOptions.processId) {
			params.set('processId', filterOptions.processId.toString());
		} else {
			params.delete('processId');
		}
		if (filterOptions.projectId) {
			params.set('projectId', filterOptions.projectId.toString());
		} else {
			params.delete('projectId');
		}
		const query = params.toString();
		goto(query ? `?${query}` : page.url.pathname, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	// efect
	$effect(() => {
		const currentProc = filterOptions.processId;
		const currentProj = filterOptions.projectId;

		if (!isMounted) {
			isMounted = true;
			return;
		}

		if (currentProc !== prevProc || currentProj !== prevProj) {
			prevProc = currentProc;
			prevProj = currentProj;
			for (const key in comboGroups) {
				comboGroups[key] = '';
			}
			resetGroupCombo = true;
			untrack(() => {
				applyFilter();
			});
		}
	});

	onMount(() => {
		showSlot = { slot1: true };
	});

	// $inspect(selectedGroupsIds);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!-- Form create/edit -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			method="POST"
			action={idEditLabel ? '?/editLabel' : '?/createLabel'}
			use:enhance={({ formData, cancel }) => {
				formData.set('labelNumber', label);
				formData.set('processId', filterOptions.processId);
				formData.set('projectId', filterOptions.projectId);
				formData.set('groups', JSON.stringify(selectedGroupsIds));
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result?.type === 'success') {
						for (const key in comboGroups) {
							comboGroups[key] = '';
						}
						resetGroupCombo = true;
					}

					await update();
					isSubmitting = false;
				};
			}}
			class="formNormalize sm:w-xl"
		>
			<h1 class="mx-auto mb-6 text-2xl">
				{idEditLabel ? 'Edit group' : 'Create label multy group'}
			</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="partId" bind:value={idEditLabel} />

			<!-- Label input -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="labelNumber" class="text-sm md:text-lg">Label code</Label>
				<Input
					type="text"
					name="labelNumber"
					id="labelNumber"
					bind:value={label}
					placeholder="Insert label"
					class="inputNormalize lg:w-[350px] text-xl! text-warning font-semibold"
					autocomplete={'off'}
					required
				/>
			</article>

			<!-- process COMBO -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="processId" class="text-sm md:text-lg">Process</Label>
				<Combobox
					dataBox={processes}
					bind:value={filterOptions.processId}
					bind:reset={resetProcessCombo}
					id="processId"
				/>
			</article>
			<!--  -->
			<!-- project dynamic combo -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="projectId" class="text-sm md:text-lg">Project</Label>
				<Combobox
					dataBox={projects}
					bind:value={filterOptions.projectId}
					bind:reset={resetProcessCombo}
					id="projectId"
				/>
			</article>

			<!--  -->
			<!-- Groups dynamic combo -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<ul
					class="flex flex-col gap-2 space-y-1 w-full max-h-[400px] overscroll-y-auto overflow-auto"
				>
					{#each Object.entries(comboGroups) as [slotKey, slotValue]}
						{#if showSlot[slotKey]}
							{@const currentSlotGroupId = comboGroups[slotKey]}
							{@const availableGroups = groups.filter(
								(group: any) =>
									!selectedGroupsIds.includes(group.id.toString()) ||
									group.id.toString() === currentSlotGroupId
							)}
							<li class="flex flex-col md:flex-row justify-between">
								<Label for={`part-${slotKey}`} class="text-sm md:text-lg"
									>Add group <span
										class="text-sm text-chart-info capitalize tracking-widest my-auto"
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
											comboGroups[slotKey] = '';
											if (slotKey === 'slot1') return;
											showSlot[slotKey] = false;
										}}><X /></Button
									>

									<Combobox
										dataBox={availableGroups}
										bind:value={comboGroups[slotKey]}
										bind:reset={resetGroupCombo}
										id={`group-${slotKey}`}
										nameLabel={'name'}
									/>
								</div>
							</li>
						{/if}
					{/each}
				</ul>
			</article>
			{#if Object.values(showSlot).filter((s) => s).length <= 100}
				<Button
					size="sm"
					variant="outline"
					onclick={addComboboxSlot}
					class="w-full lg:w-[370px] ml-auto text-chart-1 bg-chart-1/10"
					><Plus /> Add more groups</Button
				>
			{/if}

			<Button type="submit" class="mt-10" disabled={isSubmitting}>
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					{idEditLabel ? 'Edit label' : 'Create label group'}
				{/if}
			</Button>
			{#if idEditLabel}
				<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
			{/if}
		</form>
	</section>

	<!-- List label groups -->
	<section class="z-50">
		<LabelGroupsTable {labelGroups} {labelGroupsCount} headerText="Label groups" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
