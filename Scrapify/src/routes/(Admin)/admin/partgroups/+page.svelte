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
	import { DatabaseArrowDownIcon, Group, Plus, X } from '@lucide/svelte';
	import NewGroupTable from '@/components/organism/Tables/NewGroupTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import { QAD_COMPONENTS_TYPES } from '@/utils/qadComponentsTypes';
	import { currentConfirmDeleteId, editPartGroupData } from '@/stores/stores';
	import Separator from '@/components/ui/separator/separator.svelte';

	let { data, form }: PageProps = $props();
	let { groups, groupsCount, parts, scrapCodes, totalPages } = $derived(data.data);
	let { vProjects } = $derived(data);

	// vars
	let idEditGroup = $state<number>();
	let isSettingEdit = $state(false);
	let isSubmitting = $state(false);

	let resetProjectCombo = $state(false);
	let partSlots = $state<string[]>(['']);
	let scrapSlots = $state<string[]>(['']);

	let selectedVproject = $state(page.url.searchParams.get('vProject') ?? '');
	let selectedPartIds = $derived(partSlots.filter((val) => val && val.trim() !== ''));
	let selectedScrapCodes = $derived(scrapSlots.filter((val) => val && val.trim() !== ''));
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
		isRebuild = false;
		qadSelectedItemType = '';
		partSlots = [''];
		scrapSlots = [''];
		$editPartGroupData = undefined;
	}

	// efect
	$effect(() => {
		if (isSettingEdit) return;

		const currentUrlParam = page.url.searchParams.get('vProject') ?? '';
		if (selectedVproject !== currentUrlParam) {
			if (!idEditGroup) {
				partSlots = [''];
				selectedPartIds = [];
				scrapSlots = [''];
				selectedScrapCodes = [];
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
					const ids = editData.materials.map((p) => p.material);
					selectedPartIds = ids;
					partSlots = editData.materials.map((p) => p.material);
				} else {
					selectedPartIds = [];
					partSlots = [''];
				}
				// Scrap codes
				if (editData.scrapCodes && editData.scrapCodes.length > 0) {
					const ids = editData.scrapCodes.map((sc) => sc.code);
					selectedScrapCodes = ids;
					scrapSlots = ids;
				} else {
					selectedScrapCodes = [];
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

	$inspect(selectedScrapCodes);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!-- Form create/edit -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			method="POST"
			action={idEditGroup ? '?/editGroup' : '?/createPartGroup'}
			use:enhance={({ formData }) => {
				formData.set('vProject', selectedVproject);
				formData.set('partNumbers', JSON.stringify(selectedPartIds));
				formData.set('scrapCodes', JSON.stringify(selectedScrapCodes));
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
			class="formNormalize"
		>
			<h1 class="mx-auto md:mb-6 text-2xl font-semibold tracking-wider flex items-center gap-2">
				<Group class="size-8 stroke-info" />{idEditGroup
					? 'Edit component group'
					: 'Create new component group'}
			</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!--  -->
			<!-- if edit  -->
			<input type="text" hidden name="id" bind:value={idEditGroup} />

			<!--  -->
			<!-- Project -->
			<div class="md:flex gap-2 items-center mb-4">
				<article class="flex flex-col justify-between w-full lg:flex-row">
					<Label for="vProject" class="text-sm md:text-lg"
						>vProject <span class="text-sm text-chart-info capitalize tracking-widest"
							>[filter]</span
						></Label
					>
					<div class="flex items-center text-right gap-1">
						<div class="font-bold text-chart-1 flex flex-col text-xs">
							<span>{parts.length} Part nums</span>
							<span>{scrapCodes.length} Scrap codes</span>
						</div>
						<Combobox
							dataBox={projectItems}
							bind:value={selectedVproject}
							bind:reset={resetProjectCombo}
							id="vProject"
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
					</div>
				</article>
			</div>

			<!--  -->
			<!-- Parts && Scrap codes -->
			<div class="flex flex-col gap-8 mb-4">
				<!-- parts  -->
				<article class="flex flex-col gap-2 w-full">
					<ul
						class="flex flex-col gap-2 space-y-1 max-h-[520px] overscroll-y-auto overflow-auto w-full overflow-x-hidden"
					>
						{#each partSlots as currentPartId, index (index)}
							{@const availableParts = parts.filter(
								(part: any) =>
									!selectedPartIds.includes(String(part.id)) || String(part.id) === currentPartId
							)}
							<li class="flex flex-col lg:flex-row justify-between">
								<Label
									for={`part-slot-${index}`}
									class="text-sm md:text-lg flex flex-1 justify-between"
								>
									<span class="">vPart</span>
									<span class="text-sm text-chart-info capitalize">[{index + 1}]</span>
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
											: 'invisible'}
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
				<article class="flex flex-col gap-2 w-full">
					<ul
						class="flex flex-col gap-2 space-y-1 max-h-[520px] overscroll-y-auto overflow-auto w-full overflow-x-hidden"
					>
						{#each scrapSlots as currentScrapCode, index (index)}
							{@const availableScrapCodes = scrapCodes
								.filter(
									(sc: any) =>
										!selectedScrapCodes.includes(sc.Reason_Code) ||
										sc.Reason_Code === currentScrapCode
								)
								.map((sc: any) => ({ ...sc, id: String(sc.Reason_Code ?? sc.id) }))}
							<li class="flex flex-col lg:flex-row justify-between">
								<Label
									for={`scrap-slot-${index}`}
									class="text-sm md:text-lg flex flex-1 justify-between"
								>
									<span>vScrap</span>
									<span class="text-sm text-chart-info capitalize">[{index + 1}]</span>
								</Label>
								<div class="flex gap-1">
									<Combobox
										dataBox={availableScrapCodes.map((scrapCodes: any) => ({
											id: scrapCodes.Reason_Code,
											name: `[${scrapCodes.Reason_Code}] - ${scrapCodes.Reason_Description} - ${scrapCodes.Reason_Process_EN}`
										}))}
										bind:value={scrapSlots[index]}
										id={`scrap-slot-${index}`}
										width="xl"
										nameLabel={'name'}
										firstText={selectedVproject ? 'Select scrap' : 'Select project first'}
									/>
									<Button
										type="button"
										title="Remove item"
										size="icon"
										variant="ghost"
										class={(index === 0 && currentScrapCode) || index > 0
											? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
											: 'invisible'}
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
			<div class="flex flex-col gap-8 mt-2">
				<!-- group name !!! -->
				<article class="flex flex-col w-full lg:flex-row items-center max-sm:mb-2 gap-2">
					<Label for="groupName" class="text-sm md:text-lg lg:w-[200px]">Group name</Label>
					<Input
						type="text"
						name="groupName"
						id="groupName"
						bind:value={partGroupName}
						placeholder="Detailed name for group"
						class="inputNormalize  text-lg! text-warning"
						required
						autocomplete={'off'}
					/>
				</article>
				<!-- interface name !!! -->
				<article class="flex flex-col w-full lg:flex-row items-center gap-2">
					<Label for="interfaceName" class="text-sm md:text-lg lg:w-[200px]">Interface name</Label>
					<Input
						type="text"
						name="interfaceName"
						id="interfaceName"
						bind:value={interfaceName}
						placeholder="Simple group name for operator"
						class="inputNormalize text-lg! text-warning"
						required
						autocomplete={'off'}
					/>
				</article>
			</div>

			<!-- Is rebuild??? -->
			<article class="flex flex-col mt-3 justify-between w-fit lg:items-center gap-2 lg:flex-row">
				<Label for="isrebuild" class="text-sm md:text-lg lg:w-[200px]">Rebuild group</Label>

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
			</article>

			<!--  -->
			<!-- Qad component type-->
			<article class="border-t-2 pt-10 mt-4 border-green-500">
				<section class="flex flex-col w-full lg:items-center gap-1 lg:flex-row">
					<Label for="qad-item-type" class="text-sm md:text-lg lg:w-[200px]">Qad identity</Label>

					<div class=" lg:flex gap-1 items-center justify-center">
						<Combobox
							dataBox={filteredQadItems}
							bind:value={qadSelectedItemType}
							reset={resetProjectCombo}
							width="sm"
							firstText="Select qad identity"
							id="qad-item-type"
						/>
						<Button
							type="button"
							title="Remove item"
							size="icon"
							variant="ghost"
							class={qadSelectedItemType.length > 0
								? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
								: 'invisible'}
							onclick={() => (qadSelectedItemType = '')}
						>
							<X />
						</Button>
					</div>
				</section>
			</article>

			<section class="flex *:flex-1 gap-6 mt-12">
				{#if idEditGroup}
					<Button
						variant="destructive"
						onclick={() => {
							clearEditForm();
							selectedVproject = '';
							// console.log(selectedVproject);
						}}>Close Edit</Button
					>
				{/if}
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<span>Submitting...</span>
					{:else}
						{idEditGroup ? 'Edit group' : 'Create group'}
					{/if}
				</Button>
			</section>
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
