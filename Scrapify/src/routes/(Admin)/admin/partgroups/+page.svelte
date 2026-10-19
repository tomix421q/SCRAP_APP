<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { navigating, page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { DatabaseArrowDownIcon, Plus, X } from '@lucide/svelte';
	import NewGroupTable from '@/components/organism/Tables/NewGroupTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import { QAD_COMPONENTS_TYPES } from '@/utils/qadComponentsTypes';
	import { currentConfirmDeleteId, editPartGroupData } from '@/stores/stores';
	import Separator from '@/components/ui/separator/separator.svelte';
	import { crossfade, fade, slide } from 'svelte/transition';

	let { data, form }: PageProps = $props();
	let { groups, groupsCount, parts, scrapCodes, totalPages } = $derived(data.data);
	let { vProjects } = $derived(data);

	// vars
	let idEditGroup = $state<number>();
	let isSettingEdit = false;
	let isSubmitting = $state(false);

	let resetProjectCombo = $state(false);
	let resetGroupCombo = $state(false);
	let resetScrapCodesCombo = $state(false);
	let partSlots = $state<string[]>(['']);
	let scrapSlots = $state<string[]>(['']);

	let selectedVproject = $state(page.url.searchParams.get('vProject') ?? '');
	let selectedPartIds = $derived(partSlots.filter((val) => val && val.trim() !== ''));
	let selectedScrapCodesIds = $derived(scrapSlots.filter((val) => val && val.trim() !== ''));
	let partGroupName = $state('');
	let interfaceName = $state('');
	let isRebuild = $state(false);
	let qadSelectedItemType = $state('');

	let isLoadingParts = $derived(Boolean(navigating.to?.url.searchParams.has('vProject')));
	let projectItems = $derived(
		vProjects.map((p: string) => ({
			id: p,
			name: p
		}))
	);
	let filteredQadItems = $derived.by(() => {
		return QAD_COMPONENTS_TYPES.map((item) => ({
			id: `${item.itemType}__${item.project}-${item.description}`,
			name: `[${item.itemType}] - ${item.project}_${item.description}`
		}));
	});

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
		const currentUrlParam = page.url.searchParams.get('vProject') ?? '';
		if (selectedVproject !== currentUrlParam) {
			if (!idEditGroup) {
				partSlots = [''];
				scrapSlots = [''];
			}

			selectedPartIds = [];
			const url = new URL(page.url);
			if (selectedVproject) {
				url.searchParams.set('vProject', selectedVproject);
			} else {
				url.searchParams.delete('vProject');
			}

			goto(url.toString(), {
				keepFocus: true,
				noScroll: true,
				invalidateAll: true
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
				selectedVproject = editData.vProject ? editData.vProject : '';

				// Parts / Materials
				if (editData.materials && editData.materials.length > 0) {
					partSlots = editData.materials.map((p) => p.material);
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

				// applyFilter();
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

	$inspect(selectedPartIds);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!-- Form create/edit -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			method="POST"
			action={idEditGroup ? '?/editGroup' : '?/createPartGroup'}
			use:enhance={({ formData, cancel }) => {
				formData.set('vProject', selectedVproject);
				formData.set('partNumbers', JSON.stringify(selectedPartIds));
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
			class="formNormalize md:w-[840px]"
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
			<!-- Project -->
			<div class="md:flex gap-2 items-center mb-6">
				<article class="flex flex-col w-full lg:w-fit lg:flex-row gap-2">
					<Label for="projectId" class="text-sm md:text-lg">vProject <span class="text-sm text-chart-info capitalize tracking-widest"
										>[filter]</span
									></Label>
					<Combobox
						dataBox={projectItems}
						bind:value={selectedVproject}
						bind:reset={resetProjectCombo}
						id="project"
					/>
					<Button
						type="button"
						title="Remove item"
						size="icon"
						variant="ghost"
						class={selectedVproject
							? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
							: 'hidden'}
						onclick={() => (selectedVproject = '')}
					>
						<X />
					</Button>
				</article>
				<p class="font-bold text-chart-1">{parts.length} parts</p>
			</div>

			<!--  -->
			<!-- Parts && Scrap codes -->
			<div class="flex flex-col gap-12">
				<!-- parts  -->
				<article class="flex flex-col gap-2 w-full lg:w-max">
					<ul
						class="flex flex-col gap-2 space-y-1 max-h-[520px] overscroll-y-auto overflow-auto w-full overflow-x-hidden"
					>
						{#each partSlots as _, index (index)}
							{@const currentPartId = partSlots[index]}
							{@const availableParts = parts.filter(
								(part: any) =>
									!selectedPartIds.includes(String(part.id)) || String(part.id) === currentPartId
							)}
							<li class="flex flex-col lg:flex-row gap-1 justify-start">
								<Label for={`part-slot-${index}`} class="text-sm md:text-lg ">
									<span class="">vPart</span>
									<span class="text-sm text-chart-info capitalize tracking-widest"
										>[{index + 1}]</span
									>
								</Label>
								<div class="flex gap-1 relative">
									{#if isLoadingParts}
										<span
											class="absolute inset-0 bg-chart-5 flex items-center gap-4 z-20 justify-center rounded-lg"
											>Loading parts... <DatabaseArrowDownIcon
												class="animate-bounce size-6 stroke-chart-1"
											/></span
										>
									{/if}

									<Combobox
										dataBox={availableParts}
										bind:value={partSlots[index]}
										id={`part-slot-${index}`}
										width={'xl'}
										nameLabel={'name'}
										firstText={selectedVproject ? 'Select part' : 'Select project first'}
									/>
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
								</div>
							</li>
						{/each}
					</ul>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onclick={addPartSlot}
						class="w-full mx-auto text-chart-1 bg-chart-1/10"><Plus /> Add more parts</Button
					>
				</article>

				<!-- scrap -->
				<article class="flex flex-col gap-2 w-full lg:w-max">
					<ul
						class="flex flex-col gap-2 space-y-1 max-h-[520px] overscroll-y-auto overflow-auto w-full overflow-x-hidden"
					>
						{#each scrapSlots as _, index (index)}
							{@const currentScrapId = scrapSlots[index]}
							{@const availableScrapCodes = scrapCodes.filter(
								(sc: any) =>
									!selectedScrapCodesIds.includes(sc.id.toString()) ||
									sc.id.toString() === currentScrapId
							)}
							<li class="flex flex-col lg:flex-row gap-1 justify-start">
								<Label for={`scrap-slot-${index}`} class="text-sm md:text-lg">
									<span>Scrap</span>
									<span class="text-sm text-chart-info capitalize tracking-widest"
										>[{index + 1}]</span
									>
								</Label>
								<div class="flex gap-1">
									<Combobox
										dataBox={availableScrapCodes}
										bind:value={scrapSlots[index]}
										id={`scrap-slot-${index}`}
										width="xl"
										nameLabel={'codeName'}
										firstText={selectedVproject ? 'Select scrap' : 'Select project first'}
									/>
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
								</div>
							</li>
						{/each}
					</ul>
					<Button
						size="sm"
						variant="outline"
						type="button"
						onclick={addScrapSlot}
						class="w-full mx-auto text-chart-1 bg-chart-1/10"
					>
						<Plus /> Add more scrap codes
					</Button>
				</article>
			</div>
			<Separator />
			<!--  -->
			<!-- Group name && Interface name -->
			<div class="flex flex-col gap-12">
				<!-- group name !!! -->
				<article
					class="flex flex-col w-full lg:flex-row lg:w-lg justify-between items-center gap-2 max-sm:mb-2"
				>
					<Label for="groupName" class="text-sm md:text-lg">Group name</Label>
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
					<Label for="interfaceName" class="text-sm md:text-lg">Interface name</Label>
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
							reset={resetProjectCombo}
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
				<Button
					variant="destructive"
					onclick={() => {
						clearEditForm();
						selectedVproject = '';
						console.log(selectedVproject);
					}}>Close Edit</Button
				>
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
