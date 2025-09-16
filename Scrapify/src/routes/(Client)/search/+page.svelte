<script lang="ts">
	import Filter from '@/components/organism/Filter.svelte';
	import type { PageProps } from './$types';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import ScrapTable from '@/components/organism/Tables/SearchScrapTable.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';

	let { data, form }: PageProps = $props();
	let { findRecords, totalRecords, totalPages, allProcesses, user } = $derived(data);

	// $inspect(data.user);
</script>

<main class="">
	<!-- Filter -->
	<section class="max-w-4xl mx-auto">
		<Filter {allProcesses} />
		<ResultInfo data={form} />
	</section>
	<!-- Table -->
	<section class="">
		<ScrapTable {findRecords} {totalRecords} userInfo={user} />
	</section>

	<!-- PAGINATION -->
	<section>
		<Pagination {totalPages} />
	</section>
</main>
