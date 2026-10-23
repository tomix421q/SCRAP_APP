<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import NewScrapCodeTable from '@/components/organism/Tables/NewScrapCodeTable.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import Filter from '@/components/organism/Filter.svelte';

	let { data }: PageProps = $props();
	let { scrapCodes = [], scrapCodeCount = 0, totalPages = 1 } = $derived(data.data);
	let { vProjects } = $derived(data);

	let projectItems = $derived(
		vProjects.map((p: string) => ({
			id: p,
			name: p
		}))
	);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<section class="w-full flex max-md:flex-col gap-5 justify-between">
		<section>
			<Filter allProjects={projectItems} whereUse="scrapCode" />
		</section>
	</section>

	<section class="">
		<NewScrapCodeTable {scrapCodes} {scrapCodeCount} headerText="Codes list" />
	</section>

	<section class="z-50">
		<Pagination {totalPages} />
	</section>
</main>
