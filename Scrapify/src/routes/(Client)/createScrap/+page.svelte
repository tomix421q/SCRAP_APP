<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { onMount } from 'svelte';
	import SearchScrapTable from '@/components/organism/Tables/SearchScrapTable.svelte';
	import EditSearchScrapForm from '@/components/organism/Forms/EditSearchScrapForm.svelte';
	import { editSearchData } from '@/stores/stores';
	import { page } from '$app/state';
	import CreateScrapForm from '@/components/organism/Forms/CreateScrapForm.svelte';
	import FavoriteList from '@/components/molecules/FavoriteList.svelte';
	import CreateScrapNote from '@/components/molecules/CreateScrapNote.svelte';
	import CreateScrapNoteSumary from '@/components/molecules/CreateScrapNoteSumary.svelte';

	let { data, form }: PageProps = $props();
	let { processes, parts, scrapCodes, scrapRecords, projectsForFilteredProcess, totalPartsQnt } =
		$derived(data.data);

	const user = $derived(data.user);

	let filterOptions: { processId: string } = $state({
		processId: ''
	});

	function applyFilter() {
		const params = new URLSearchParams();
		if (filterOptions.processId) params.set('processId', filterOptions.processId.toString());
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	$effect(() => {
		if (typeof filterOptions.processId) {
			applyFilter();
		}
	});

	onMount(() => {
		$editSearchData = undefined;
		const isFilter = page.url.searchParams.get('processId');
		if (isFilter) {
			filterOptions.processId = isFilter;
		}
	});

	// $inspect(projectsForFilteredProcess);
</script>

<main class="flex flex-col lg:flex-wrap gap-3 relative">
	<!-- Result info -->
	<section class=" w-full mx-auto">
		<ResultInfo data={form} />
	</section>

	<section class="flex flex-col gap-3">
		<!--  IF Edit scrap else Create Scrap-->
		{#if $editSearchData}
			<!-- data for edit change name ... -->
			{@const dataForEdit = { allPartsPromise: parts, scrapCodesPromise: scrapCodes }}
			<div class="lg:min-h-[400px] lg:w-2xl mx-auto">
				<EditSearchScrapForm data={dataForEdit} {form} />
			</div>
		{:else}
			<!-- IF Create scrap -->
			<div class="lg:grid grid-cols-2 gap-3 justify-between items-start">
				<!-- Create scrap form -->
				<div>
					<CreateScrapForm {processes} {parts} {scrapCodes} bind:filterOptions />
				</div>

				<div class="flex flex-col gap-3 h-full">
					<!-- Favorite processes in LC -->
					<FavoriteList bind:filterOptions />
					<!-- NOTES summary info LC -->
					<CreateScrapNoteSumary />
				</div>
			</div>
			<!-- NOTES LC-->
			<CreateScrapNote {parts} {projectsForFilteredProcess} {filterOptions} {scrapCodes} />
		{/if}
	</section>

	<!-- Last 20 records -->
	<section>
		<SearchScrapTable
			findRecords={scrapRecords}
			totalRecords={scrapRecords.length}
			headerText={`Poslednych 20 zaznamov 📖`}
			userInfo={user}
		/>
	</section>
</main>
