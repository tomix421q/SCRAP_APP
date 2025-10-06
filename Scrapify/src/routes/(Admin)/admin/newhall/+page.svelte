<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import HallsTable from '@/components/organism/Tables/HallsTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import { currentConfirmDeleteId, editHallData } from '@/stores/stores';
	import { onMount } from 'svelte';

	let { form, data }: PageProps = $props();
	let { halls, hallsCount, totalPages } = $derived(data);
	let isSubmitting = $state(false);

	let idEditHall = $state<number>();
	let hallName = $state('');
	let hallDescription = $state('');

	function clearEditForm() {
		idEditHall = undefined;
		hallName = '';
		hallDescription = '';
		$editHallData = undefined;
	}

	$effect(() => {
		if ($editHallData) {
			form = null;
			idEditHall = $editHallData.id;
			hallName = $editHallData.name;
			if ($editHallData.description) hallDescription = $editHallData.description;
		}
		if ($currentConfirmDeleteId) {
			clearEditForm();
		}
	});

	onMount(() => {
		clearEditForm();
		$currentConfirmDeleteId = undefined;
	});

	// $inspect($editHallData);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<div class="flex flex-col lg:flex-row gap-10">
		<!--  -->
		<!-- CREATE & EDIT HALL -->
		<section class="w-full sm:w-lg">
			<form
				method="POST"
				action={idEditHall ? '?/editHall' : '?/createHall'}
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
						clearEditForm();
					};
				}}
				class="formNormalize"
			>
				<h1 class="mx-auto mb-6 text-2xl">{idEditHall ? 'Edit Hall' : 'Create new Hall'}</h1>
				<div>
					<ResultInfo data={form} />
				</div>

				<!--  -->
				<!-- hall -->
				<input type="text" hidden name="hallId" bind:value={idEditHall} />
				<article class="flex justify-between items-center gap-2">
					<Label for="hallName" class="text-xl">Name</Label>
					<Input
						type="text"
						name="hallName"
						bind:value={hallName}
						placeholder="Insert hall name"
						class="inputNormalize max-w-[240px]"
						id="hallName"
						required
					/>
				</article>
				<article class="flex justify-between items-center gap-2">
					<Label for="hallDescription" class="text-xl">Description</Label>
					<Input
						type="text"
						name="hallDescription"
						bind:value={hallDescription}
						class="inputNormalize max-w-[240px]"
						placeholder="Hall description (optional)"
						id="hallDescription"
					/>
				</article>
				<Button type="submit" class="mt-10 ">
					{#if isSubmitting}
						<span>Submitting...</span>
					{:else}
						{idEditHall ? 'Edit hall' : 'Create Hall'}
					{/if}
				</Button>
				{#if idEditHall}
					<Button variant="destructive" onclick={() => clearEditForm()}>Close Edit</Button>
				{/if}
			</form>
		</section>
	</div>

	<!--  -->
	<!-- HALLS LIST -->
	<section class="">
		<HallsTable {halls} {hallsCount} headerText="Halls List" />
	</section>
	<!--  -->
	<!-- PAGINATION -->
	<section>
		<Pagination {totalPages} />
	</section>
</main>
