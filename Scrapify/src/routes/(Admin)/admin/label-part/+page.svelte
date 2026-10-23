<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Plus, QrCode, X } from '@lucide/svelte';
	import { onMount, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import LabelGroupsTable from '@/components/organism/Tables/LabelGroupsTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editLabelGroupsData } from '@/stores/stores';

	let { data, form }: PageProps = $props();
	let { groups, labelGroups, labelGroupsCount, totalPages } = $derived(data.data);
	let { vProjects } = $derived(data);

	// vars
	let idEditLabel = $state<number>();
	let isSettingEdit = $state(false);
	let isSubmitting = $state(false);

	let resetGroupCombo = $state(false);
	let groupSlots = $state<string[]>(['']);

	let label = $state('');
	let selectedVproject = $derived(page.url.searchParams.get('vProject') ?? '');
	let selectedGroupsIds = $derived(groupSlots.filter((val) => val && val.trim() !== ''));

	//
	// func
	function addGroupSlot() {
		groupSlots.push('');
	}
	function removeGroupSlot(index: number) {
		if (groupSlots.length === 1) {
			groupSlots[0] = '';
		} else {
			groupSlots.splice(index, 1);
		}
	}
	async function clearEditForm() {
		label = '';
		selectedVproject = '';
		groupSlots = [''];
		resetGroupCombo = true;
		idEditLabel = undefined;
		$editLabelGroupsData = undefined;
	}

	let projectItems = $derived(
		vProjects.map((p: string) => ({
			id: p,
			name: p
		}))
	);

	//
	// efect
	$effect(() => {
		if (isSettingEdit) return;

		const currentUrlParam = page.url.searchParams.get('vProject') ?? '';
		if (selectedVproject !== currentUrlParam) {
			if (!idEditLabel) {
				groupSlots = [''];
				selectedGroupsIds = [];
			}
			const url = new URL(page.url);
			if (selectedVproject) {
				url.searchParams.set('vProject', selectedVproject);
			} else {
				url.searchParams.delete('vProject');
			}

			goto(url.toString(), { keepFocus: true, noScroll: true, invalidateAll: true });
		}
	});

	//edit
	$effect(() => {
		const editData = $editLabelGroupsData;
		if (editData && editData.id !== idEditLabel) {
			isSettingEdit = true;
			untrack(() => {
				form = null;
				idEditLabel = editData.id;
				label = editData.code;
				selectedVproject = editData.vProject ? editData.vProject : '';
				// groups
				if (editData.groups && editData.groups.length > 0) {
					const ids = editData.groups.map((g) => g.id.toString());
					groupSlots = ids;
					selectedGroupsIds = ids;
				} else {
					selectedGroupsIds = [];
					groupSlots = [''];
				}
			});
			tick().then(() => {
				isSettingEdit = false;
			});
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	$inspect(selectedGroupsIds);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!-- Form create/edit -->
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<form
			method="POST"
			action={idEditLabel ? '?/editLabel' : '?/createLabel'}
			use:enhance={({ formData }) => {
				formData.set('labelNumber', label);
				formData.set('vProject', selectedVproject);
				formData.set('groups', JSON.stringify(selectedGroupsIds));
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result?.type === 'success') {
						window.scrollTo({ top: 0, behavior: 'smooth' });
						resetGroupCombo = true;
						clearEditForm();
					}

					await update({ reset: false });
					isSubmitting = false;
				};
			}}
			class="formNormalize md:w-[840px]"
		>
			<h1 class="mx-auto lg:mb-5 font-semibold text-2xl flex items-center gap-2">
				<QrCode class="size-8 stroke-info" />{idEditLabel ? 'Edit group' : 'Create new label group'}
			</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!-- if edit  -->
			<input type="text" hidden name="id" bind:value={idEditLabel} />

			<!-- Label input -->
			<article class="flex flex-col w-full justify-between lg:items-center gap-2 lg:flex-row">
				<Label for="labelNumber" class="text-sm md:text-lg">Label code</Label>
				<Input
					type="text"
					name="labelNumber"
					id="labelNumber"
					bind:value={label}
					placeholder="Insert label"
					class="inputNormalize lg:w-[360px] mr-12 text-xl! text-warning tracking-widest"
					autocomplete={'off'}
					required
				/>
			</article>

			<!--  -->
			<!-- vProject dynamic combo -->
			<article class="flex flex-col w-full lg:w-full justify-between gap-2 lg:flex-row">
				<Label for="projectId" class="text-sm md:text-lg"
					>Project <span class="text-sm text-chart-info capitalize tracking-widest">[filter]</span
					></Label
				>
				<div class="w-full justify-end flex gap-2">
					<Combobox
						dataBox={projectItems}
						bind:value={selectedVproject}
						bind:reset={resetGroupCombo}
						id="projectId"
					/>
					<Button
						type="button"
						title="Remove item"
						size="icon"
						variant="ghost"
						class={selectedVproject
							? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
							: 'invisible'}
						onclick={() => (selectedVproject = '')}
					>
						<X />
					</Button>
				</div>
			</article>

			<!--  -->
			<!-- Groups dynamic combo -->
			<article class="flex flex-col gap-2 w-full lg:w-full">
				<ul
					class="flex flex-col gap-2 space-y-1 w-full max-h-[520px] overscroll-y-auto overflow-auto overflow-x-hidden"
				>
					{#each groupSlots as currentGroupId, index (index)}
						{@const availableGroups = groups.filter(
							(group: any) =>
								!selectedGroupsIds.includes(String(group.id)) || String(group.id) === currentGroupId
						)}
						<li class="flex flex-col lg:flex-row gap-1 justify-between">
							<Label for={`group-slot-${index}`} class="text-sm md:text-lg"
								>Group <span class="text-sm text-chart-info capitalize tracking-widest my-auto"
									>[{index + 1}]</span
								></Label
							>
							<div class="flex gap-2">
								<Combobox
									dataBox={availableGroups}
									bind:value={groupSlots[index]}
									id={`group-slot-${index}`}
									nameLabel={'name'}
								/>
								<Button
									type="button"
									title="Remove item"
									size="icon"
									variant="ghost"
									class={(index === 0 && currentGroupId) || index > 0
										? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
										: 'invisible'}
									onclick={() => removeGroupSlot(index)}><X /></Button
								>
							</div>
						</li>
					{/each}
				</ul>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onclick={addGroupSlot}
					class=" mx-auto lg:mr-36 text-chart-1 bg-chart-1/10"><Plus /> Add more groups</Button
				>
			</article>

			<section class="flex *:flex-1 gap-6 mt-12">
				{#if idEditLabel}
					<Button
						disabled={isSubmitting}
						variant="destructive"
						onclick={() => {
							clearEditForm();
						}}>Close Edit</Button
					>
				{/if}
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<span>Submitting...</span>
					{:else}
						{idEditLabel ? 'Edit label' : 'Create label group'}
					{/if}
				</Button>
			</section>
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
