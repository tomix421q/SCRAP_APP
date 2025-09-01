<script lang="ts">
	import Filter from '@/components/organism/Filter.svelte';
	import type { PageProps } from './$types';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import ScrapTable from '@/components/molecules/ScrapTable.svelte';
	import { authClient } from '@/auth/auth-client';

	let { data }: PageProps = $props();
	let { findRecords, totalRecords, totalPages, allProcesses } = $derived(data);



	// $inspect($session.data?.session.token);
</script>

<main class="">
	<!-- Filter -->
	<section class="max-w-4xl mx-auto">
		<Filter {allProcesses} />
	</section>
	<!-- Table -->
	<section class="">
		<ScrapTable {findRecords} {totalRecords} />
	</section>

	<!-- PAGINATION -->
	<section>
		<Pagination {totalPages} />
	</section>
</main>
