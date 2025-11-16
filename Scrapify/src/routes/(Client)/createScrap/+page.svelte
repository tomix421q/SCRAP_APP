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

	let { data, form }: PageProps = $props();
	let { processes, parts, scrapCodes, scrapRecords, totalPartsQnt } = $derived(data.data);

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
		if ($editSearchData) {
			filterOptions.processId = '';
		}
	});

	onMount(() => {
		$editSearchData = undefined;
		const isFilter = page.url.searchParams.get('processId');
		if (isFilter) {
			filterOptions.processId = isFilter;
		}
	});

	// $inspect(filterOptions);
</script>

<main class="flex flex-col lg:flex-wrap gap-10 relative">
	<!-- Result info -->
	<section class="max-w-2xl w-full mx-auto">
		<ResultInfo data={form} />
	</section>

	<section>
		<!--  IF Edit scrap else Create Scrap-->
		{#if $editSearchData}
			<!-- data for edit change name ... -->
			{@const dataForEdit = { allPartsPromise: parts, scrapCodesPromise: scrapCodes }}
			<div class="lg:min-h-[400px] max-w-5xl">
				<EditSearchScrapForm data={dataForEdit} {form} />
			</div>
		{:else}
			<!-- IF Create scrap -->
			<div class="lg:flex gap-3 space-y-3 justify-between">
				<div>
					<!-- Favorite processes in LC -->
					<FavoriteList bind:filterOptions />
					<!-- Create scrap form -->
					<CreateScrapForm {processes} {parts} {scrapCodes} bind:filterOptions />
				</div>

				<!-- NOTES -->
				<CreateScrapNote {parts} {filterOptions} />
			</div>
		{/if}
	</section>

	<!-- Last 20 records -->
	<section>
		<SearchScrapTable
			findRecords={scrapRecords}
			totalRecords={scrapRecords.length}
			headerText={'Poslednych 20 zaznamov'}
			userInfo={user}
		/>
	</section>
</main>
