<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Plus } from '@lucide/svelte';
	import NewScrapCodeTable from '@/components/organism/Tables/NewScrapCodeTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';

	let { data, form }: PageProps = $props();
	let { scrapCodes, processes, scrapCodeCount, totalPages } = $derived(data.data);

	let isSubmitting = $state(false);
	let resetProcessCombo = $state(false);

	let processId = $state('');
	let scrapcodeNum = $state('');
	let scrapcodeName = $state('');
	let scrapDescription = $state('');

	// $inspect(scrapCodes);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- FORM -->
	<section class="w-full sm:w-lg">
		<form
			action="?/createScrap"
			method="POST"
			class="formNormalize"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<h1 class="mx-auto mb-6 text-2xl">Create new screp code</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!--  -->
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
			<!-- inputs -->
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Code</Label>
				<Input
					type="text"
					name="scrapcodeNum"
					id="scrapcodeNum"
					bind:value={scrapcodeNum}
					placeholder="Insert scrap code"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Name</Label>
				<Input
					type="text"
					name="scrapcodeName"
					id="scrapcodeName"
					bind:value={scrapcodeName}
					placeholder="Insert scrap code name"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Description</Label>
				<Input
					type="text"
					name="scrapDescription"
					id="scrapDescription"
					bind:value={scrapDescription}
					placeholder="Scrap description (optional)"
					class="inputNormalize max-w-[240px]"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Create screp code
				{/if}
			</Button>
		</form>
	</section>

	<!--  -->
	<!-- Scrap Code LIST -->
	<section class="">
		<NewScrapCodeTable {scrapCodes} {totalPages} {scrapCodeCount} headerText="Codes list" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
