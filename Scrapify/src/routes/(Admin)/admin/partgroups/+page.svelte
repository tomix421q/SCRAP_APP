<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { Plus, X } from '@lucide/svelte';
	import NewGroupTable from '@/components/organism/Tables/NewGroupTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';

	let { data, form }: PageProps = $props();
	let { groups, groupsCount, processes, projects, parts, scrapCodes, totalPages } = $derived(
		data.data
	);

	// vars
	let isMounted = false;
	let idEditGroup = $state<number>();
	let isSubmitting = $state(false);
	let resetProcessCombo = $state(false);
	let resetGroupCombo = $state(false);
	let resetScrapCodesCombo = $state(false);
	let isRebuild = $state(false);

	let comboboxParts = $state<Record<string, string>>(
		Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`slot${i + 1}`, '']))
	);
	let selectedPartIds = $derived(
		Object.values(comboboxParts).filter((val) => val && val.trim() !== '')
	);
	let comboboxScrapCodes = $state<Record<string, string>>(
		Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`slot${i + 1}`, '']))
	);
	let selectedScrapCodesIds = $derived(
		Object.values(comboboxScrapCodes).filter((val) => val && val.trim() !== '')
	);
	let showSlot: Record<string, boolean> = $state({});
	let showSlotScrap: Record<string, boolean> = $state({});
	let partGroupName = $state('');

	let filterOptions = $state({
		processId: page.url.searchParams.get('processId') ?? '',
		projectId: page.url.searchParams.get('projectId') ?? ''
	});
	let prevProc = $state(filterOptions.processId);
	let prevProj = $state(filterOptions.projectId);

	// func
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

	function addComboboxSlot() {
		for (let i = 1; i <= 100; i++) {
			const slotKey = `slot${i}`;
			if (!showSlot[slotKey]) {
				showSlot[slotKey] = true;
				break;
			}
		}
	}
	function addComboboxSlotScrap() {
		for (let i = 1; i <= 100; i++) {
			const slotKey = `slot${i}`;
			if (!showSlotScrap[slotKey]) {
				showSlotScrap[slotKey] = true;
				break;
			}
		}
	}

	async function clearEditForm() {
		idEditGroup = undefined;
		filterOptions.processId = '';
		filterOptions.projectId = '';
		partGroupName = '';
		resetGroupCombo = true;
		resetScrapCodesCombo = true;
		// $editPartData = undefined;
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
			for (const key in comboboxParts) {
				comboboxParts[key] = '';
			}

			for (const key in comboboxScrapCodes) {
				comboboxParts[key] = '';
			}
			showSlot = { slot1: true };
			showSlotScrap = { slot1: true };
			resetGroupCombo = true;
			resetScrapCodesCombo = true;
			untrack(() => {
				applyFilter();
			});
		}
	});

	onMount(() => {
		showSlot = { slot1: true };
		showSlotScrap = { slot1: true };
	});

	// $inspect(isRebuild);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!-- Form create/edit -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			method="POST"
			action={idEditGroup ? '?/editGroup' : '?/createPartGroup'}
			use:enhance={({ formData, cancel }) => {
				formData.set('processId', filterOptions.processId);
				formData.set('projectId', filterOptions.projectId);
				formData.set('partIds', JSON.stringify(selectedPartIds));
				formData.set('scrapCodesIds', JSON.stringify(selectedScrapCodesIds));
				formData.set('isRebuild', JSON.stringify(isRebuild));
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result?.type === 'success') {
						for (const key in comboboxParts) {
							comboboxParts[key] = '';
						}
						for (const key in comboboxScrapCodes) {
							comboboxScrapCodes[key] = '';
						}
						showSlot = { slot1: true };
						showSlotScrap = { slot1: true };
						resetGroupCombo = true;
						resetScrapCodesCombo = true;
						isRebuild = false;
					}

					await update();
					isSubmitting = false;
				};
			}}
			class="formNormalize sm:w-xl"
		>
			<h1 class="mx-auto mb-6 text-2xl">{idEditGroup ? 'Edit group' : 'Create new group'}</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="partId" bind:value={idEditGroup} />

			<!-- process COMBO -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="processId" class="text-sm md:text-lg">Process</Label>
				<Combobox
					dataBox={processes}
					bind:value={filterOptions.processId}
					reset={resetProcessCombo}
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
					reset={resetProcessCombo}
					id="projectId"
				/>
			</article>

			<!--  -->
			<!-- PARTS dynamic combo -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<ul
					class="flex flex-col gap-2 space-y-1 w-full max-h-[400px] overscroll-y-auto overflow-auto"
				>
					{#each Object.entries(comboboxParts) as [slotKey, slotValue]}
						{#if showSlot[slotKey]}
							{@const currentSlotPartId = comboboxParts[slotKey]}
							{@const availableParts = parts.filter(
								(part: any) =>
									!selectedPartIds.includes(part.id.toString()) ||
									part.id.toString() === currentSlotPartId
							)}
							<li class="flex flex-col md:flex-row justify-between">
								<Label for={`part-${slotKey}`} class="text-sm md:text-lg"
									>Part <span class="text-sm text-chart-info capitalize tracking-widest"
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
											comboboxParts[slotKey] = '';
											if (slotKey === 'slot1') return;
											showSlot[slotKey] = false;
										}}><X /></Button
									>

									<Combobox
										dataBox={availableParts}
										bind:value={comboboxParts[slotKey]}
										bind:reset={resetGroupCombo}
										id={`part-${slotKey}`}
										nameLabel={'partnumSideColor'}
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
					><Plus /> Add more parts</Button
				>
			{/if}

			<!--  -->
			<!-- SCRAP CODES dynamic combo -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<ul
					class="flex flex-col gap-2 space-y-1 w-full max-h-[400px] overscroll-y-auto overflow-auto"
				>
					{#each Object.entries(comboboxScrapCodes) as [slotKey, slotValue]}
						{#if showSlotScrap[slotKey]}
							{@const currentSlotScrapId = comboboxScrapCodes[slotKey]}
							{@const availableScrapCodes = scrapCodes.filter(
								(scrapCodes: any) =>
									!selectedScrapCodesIds.includes(scrapCodes.id.toString()) ||
									scrapCodes.id.toString() === currentSlotScrapId
							)}
							<li class="flex flex-col md:flex-row justify-between">
								<Label for={`part-${slotKey}`} class="text-sm md:text-lg"
									>Scrap code<span class="text-sm text-chart-info capitalize tracking-widest"
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
											comboboxScrapCodes[slotKey] = '';
											if (slotKey === 'slot1') return;
											showSlotScrap[slotKey] = false;
										}}><X /></Button
									>

									<Combobox
										dataBox={availableScrapCodes}
										bind:value={comboboxScrapCodes[slotKey]}
										bind:reset={resetScrapCodesCombo}
										id={`part-${slotKey}`}
										nameLabel={'codeName'}
									/>
								</div>
							</li>
						{/if}
					{/each}
				</ul>
			</article>
			{#if Object.values(showSlotScrap).filter((s) => s).length <= 100}
				<Button
					size="sm"
					variant="outline"
					onclick={addComboboxSlotScrap}
					class="w-full lg:w-[370px] ml-auto text-chart-1 bg-chart-1/10"
					><Plus /> Add more scrap codes</Button
				>
			{/if}

			<!--  -->
			<!-- group name !!! -->
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm md:text-lg">Group name</Label>
				<Input
					type="text"
					name="groupName"
					id="partGroup"
					bind:value={partGroupName}
					placeholder="Insert group name [max 64 characters]"
					class="inputNormalize lg:w-[350px]"
					required
					autocomplete={'off'}
				/>
			</article>

			<!-- Is rebuild??? -->
			<article class="flex flex-col justify-between w-full lg:items-center gap-4 lg:flex-row">
				<Label for="isrebuild" class="text-sm md:text-lg">Contain rebuild</Label>
				<div class="w-[350px]">
					<Checkbox
						id="isrebuild"
						class="size-5! ring-2 ring-primary **:size-5"
						checked={isRebuild}
						onCheckedChange={(val: any) => {
							if (val) {
								isRebuild = true;
							} else {
								isRebuild = false;
							}
						}}
					/>
				</div>
			</article>

			<Button type="submit" class="mt-10" disabled={isSubmitting}>
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					{idEditGroup ? 'Edit group' : 'Create group'}
				{/if}
			</Button>
			{#if idEditGroup}
				<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
			{/if}
		</form>
	</section>

	<!-- List groups -->
	<section class="z-50">
		<NewGroupTable {groups} {groupsCount} headerText="Part groups" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
