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
	import { onMount, tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { Plus, X } from '@lucide/svelte';
	import NewGroupTable from '@/components/organism/Tables/NewGroupTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import { QAD_COMPONENTS_TYPES } from '@/utils/qadComponentsTypes';
	import { currentConfirmDeleteId, editPartGroupData } from '@/stores/stores';
	import Separator from '@/components/ui/separator/separator.svelte';

	let { data, form }: PageProps = $props();
	let { groups, groupsCount, processes, projects, parts, scrapCodes, totalPages } = $derived(
		data.data
	);

	// vars
	let isMounted = false;
	let idEditGroup = $state<number>();
	let isSettingEdit = false;
	let isSubmitting = $state(false);
	let resetProcessCombo = $state(false);
	let resetGroupCombo = $state(false);
	let resetScrapCodesCombo = $state(false);
	let isRebuild = $state(false);
	let qadSelectedItemType = $state('');
	let partGroupName = $state('');
	let interfaceName = $state('');

	let partSlots = $state<string[]>(['']);
	let scrapSlots = $state<string[]>(['']);
	let selectedPartIds = $derived(partSlots.filter((val) => val && val.trim() !== ''));
	let selectedScrapCodesIds = $derived(scrapSlots.filter((val) => val && val.trim() !== ''));

	let filterOptions = $state({
		processId: page.url.searchParams.get('processId') ?? '',
		projectId: page.url.searchParams.get('projectId') ?? ''
	});
	let prevProc = $state(filterOptions.processId);
	let prevProj = $state(filterOptions.projectId);

	let filteredQadItems = $derived.by(() => {
		return QAD_COMPONENTS_TYPES.map((item) => ({
			id: `${item.itemType}__${item.project}-${item.description}`,
			name: `[${item.itemType}] - ${item.project}_${item.description}`
		}));
	});

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

	function addPartSlot() {
		partSlots.push('');
	}
	function removePartSlot(index: number) {
		if (partSlots.length === 1) {
			partSlots[0] = '';
		} else {
			partSlots.splice(index, 1);
		}
	}

	function addScrapSlot() {
		scrapSlots.push('');
	}
	function removeScrapSlot(index: number) {
		if (scrapSlots.length === 1) {
			scrapSlots[0] = '';
		} else {
			scrapSlots.splice(index, 1);
		}
	}

	async function clearEditForm() {
		idEditGroup = undefined;
		filterOptions.processId = '';
		filterOptions.projectId = '';
		partGroupName = '';
		interfaceName = '';
		resetGroupCombo = true;
		resetScrapCodesCombo = true;
		isRebuild = false;
		qadSelectedItemType = '';
		partSlots = [''];
		scrapSlots = [''];
		$editPartGroupData = undefined;
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
			if (isSettingEdit) return;
			partSlots = [''];
			scrapSlots = [''];
			resetGroupCombo = true;
			resetScrapCodesCombo = true;
			untrack(() => {
				applyFilter();
			});
		}
	});

	// edit effect
	$effect(() => {
		const editData = $editPartGroupData;
		if (editData && editData.id !== idEditGroup) {
			isSettingEdit = true;

			untrack(() => {
				form = null;
				idEditGroup = editData.id;
				filterOptions.processId = String(editData.process?.id ?? '');
				prevProc = filterOptions.processId;
				filterOptions.projectId = String(editData.projectId ?? '');
				prevProj = filterOptions.projectId;
				// Parts
				if (editData.parts && editData.parts.length > 0) {
					partSlots = editData.parts.map((p: any) => String(p.id));
				} else {
					partSlots = [''];
				}
				// Scrap codes
				if (editData.scrapCodes && editData.scrapCodes.length > 0) {
					scrapSlots = editData.scrapCodes.map((sc: any) => String(sc.id));
				} else {
					scrapSlots = [''];
				}
				// Group name
				partGroupName = editData.name ?? '';
				interfaceName = editData.interfaceName ?? '';
				isRebuild = editData.isRebuild;
				qadSelectedItemType = editData.qadIdentity ?? '';

				applyFilter();
				tick().then(() => {
					isSettingEdit = false;
				});
			});
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect(idEditGroup);
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
				formData.set('groupName', partGroupName);
				formData.set('interfaceName', interfaceName);
				formData.set('qadIdentity', qadSelectedItemType);
				formData.set('isRebuild', JSON.stringify(isRebuild));
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result?.type === 'success') {
						clearEditForm();
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}

					await update();
					isSubmitting = false;
				};
			}}
			class="formNormalize md:max-w-6xl"
		>
			<h1 class="mx-auto md:mb-6 text-2xl font-semibold tracking-wider">
				{idEditGroup ? 'Edit component group' : 'Create new component group'}
			</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!--  -->
			<!-- if edit  -->
			<input type="text" hidden name="id" bind:value={idEditGroup} />

			<!--  -->
			<!-- Project && Process -->
			<div class="md:flex gap-12">
				<article class="flex flex-col w-full gap-2 justify-between lg:flex-row lg:w-lg">
					<Label for="processId" class="text-sm md:text-lg">Process</Label>
					<Combobox
						dataBox={processes}
						bind:value={filterOptions.processId}
						reset={resetProcessCombo}
						id="processId"
					/>
				</article>
				<article class="flex flex-col w-full lg:flex-row lg:w-lg gap-2 justify-between">
					<Label for="projectId" class="text-sm md:text-lg">Project</Label>
					<Combobox
						dataBox={projects}
						bind:value={filterOptions.projectId}
						reset={resetProcessCombo}
						id="projectId"
					/>
				</article>
			</div>

			<!--  -->
			<!-- Parts && Scrap codes -->
			<div class="md:flex gap-12">
				<!-- parts  -->
				<article class="flex flex-col gap-2 w-full lg:w-lg">
					<ul
						class="flex flex-col gap-2 space-y-1 max-h-[520px] overscroll-y-auto overflow-auto w-full overflow-x-hidden"
					>
						{#each partSlots as _, index (index)}
							{@const currentPartId = partSlots[index]}
							{@const availableParts = parts.filter(
								(part: any) =>
									!selectedPartIds.includes(part.id.toString()) ||
									part.id.toString() === currentPartId
							)}
							<li class="flex flex-col lg:flex-row justify-between">
								<Label for={`part-slot-${index}`} class="text-sm md:text-lg">
									Part <span class="text-sm text-chart-info capitalize tracking-widest"
										>[{index + 1}]</span
									>
								</Label>
								<div class="flex gap-2">
									<Button
										type="button"
										title="Remove item"
										size="icon"
										variant="ghost"
										class={(index === 0 && currentPartId) || index > 0
											? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
											: 'hidden'}
										onclick={() => removePartSlot(index)}
									>
										<X />
									</Button>

									<Combobox
										dataBox={availableParts}
										bind:value={partSlots[index]}
										id={`part-slot-${index}`}
										nameLabel={'partnumSideColor'}
									/>
								</div>
							</li>
						{/each}
					</ul>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onclick={addPartSlot}
						class="w-full lg:w-[370px] ml-auto text-chart-1 bg-chart-1/10"
						><Plus /> Add more parts</Button
					>
				</article>

				<!-- scrap -->
				<article class="flex flex-col gap-2 w-full lg:w-lg">
					<ul
						class="flex flex-col gap-2 space-y-1 max-h-[520px] overscroll-y-auto overflow-auto overflow-x-hidden w-full"
					>
						{#each scrapSlots as _, index (index)}
							{@const currentScrapId = scrapSlots[index]}
							{@const availableScrapCodes = scrapCodes.filter(
								(sc: any) =>
									!selectedScrapCodesIds.includes(sc.id.toString()) ||
									sc.id.toString() === currentScrapId
							)}
							<li class="flex flex-col lg:flex-row justify-between">
								<Label for={`scrap-slot-${index}`} class="text-sm md:text-lg">
									<span class="">Scrap</span>
									<span class="text-sm text-chart-info capitalize tracking-widest"
										>[{index + 1}]</span
									>
								</Label>
								<div class="flex gap-2">
									<Button
										type="button"
										title="Remove item"
										size="icon"
										variant="ghost"
										class={(index === 0 && currentScrapId) || index > 0
											? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
											: 'hidden'}
										onclick={() => removeScrapSlot(index)}
									>
										<X />
									</Button>

									<Combobox
										dataBox={availableScrapCodes}
										bind:value={scrapSlots[index]}
										id={`scrap-slot-${index}`}
										nameLabel={'codeName'}
									/>
								</div>
							</li>
						{/each}
					</ul>
					<Button
						size="sm"
						variant="outline"
						type="button"
						onclick={addScrapSlot}
						class="w-full lg:w-[370px] ml-auto text-chart-1 bg-chart-1/10"
					>
						<Plus /> Add more scrap codes
					</Button>
				</article>
			</div>
			<Separator />
			<!--  -->
			<!-- Group name && Interface name -->
			<div class="md:flex gap-12">
				<!-- group name !!! -->
				<article
					class="flex flex-col w-full lg:flex-row lg:w-lg justify-between items-center gap-2 max-sm:mb-2"
				>
					<Label for="groupName" class="text-sm md:text-lg"
						>Group <br class="lg:block hidden" />name</Label
					>
					<Input
						type="text"
						name="groupName"
						id="partGroup"
						bind:value={partGroupName}
						placeholder="Insert group name"
						class="inputNormalize lg:w-[350px]"
						required
						autocomplete={'off'}
					/>
				</article>
				<!-- interface name !!! -->
				<article
					class="flex flex-col w-full lg:flex-row lg:w-lg justify-between items-center gap-2"
				>
					<Label for="interfaceName" class="text-sm md:text-lg"
						>Interface <br class="lg:block hidden" />name</Label
					>
					<Input
						type="text"
						name="interfaceName"
						id="interfaceName"
						bind:value={interfaceName}
						placeholder="Name for operator"
						class="inputNormalize lg:w-[350px]"
						required
						autocomplete={'off'}
					/>
				</article>
			</div>

			<!-- Is rebuild??? -->
			<article class="flex flex-col mt-8 justify-between w-fit lg:items-center gap-4 lg:flex-row">
				<Label for="isrebuild" class="text-sm md:text-lg">Rebuild group</Label>
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

			<!--  -->
			<!-- Qad component type-->
			<article class="ring p-2 ring-muted/30 rounded-lg max-w-2xl">
				<h4 class="text-xl text-muted-foreground flex items-center mb-6">Qad component identity</h4>

				<section class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
					<Label for="qad-item-type" class="text-sm md:text-lg">Identity</Label>

					<div class=" lg:flex gap-2 items-center justify-center">
						<Button
							type="button"
							title="Remove item"
							size="icon"
							variant="ghost"
							class={qadSelectedItemType.length > 0
								? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
								: 'hidden'}
							onclick={() => (qadSelectedItemType = '')}
						>
							<X />
						</Button>
						<Combobox
							dataBox={filteredQadItems}
							bind:value={qadSelectedItemType}
							reset={resetProcessCombo}
							width="lg"
							firstText="Select qad identity"
							id="qad-item-type"
						/>
					</div>
				</section>
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
