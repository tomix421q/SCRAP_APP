<script lang="ts">
	import Filter from '@/components/organism/Filter.svelte';
	import type { PageProps } from './$types';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import ScrapTable from '@/components/organism/Tables/SearchScrapTable.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { editSearchData } from '@/stores/stores';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import EditSearchScrapForm from '@/components/organism/Forms/EditSearchScrapForm.svelte';

	let { data, form }: PageProps = $props();
	let { findRecords, totalRecords, totalPages, allProcesses, allProjects, totalPartQnt, user } =
		$derived(data);

	// $inspect();

	onMount(() => {
		$editSearchData = undefined;
	});
</script>

<main>
	<div>
		<!-- Result info -->
		<section class="max-w-4xl mx-auto">
			<ResultInfo data={form} />
		</section>

		<section class="max-w-6xl mx-auto">
			<!-- Edit -->
			{#if $editSearchData}
				<div transition:slide class="lg:min-h-[400px]">
					<EditSearchScrapForm {data} {form} />
				</div>
				<!-- Filter -->
			{:else}
				<div transition:slide>
					<Filter {allProcesses} {allProjects} />
				</div>
			{/if}
		</section>
	</div>
	<!--  -->
	<!-- Table -->
	<section>
		<ScrapTable
			{findRecords}
			{totalRecords}
			partsQnt={totalPartQnt._sum.quantity}
			userInfo={user}
			group={data.groupScrapCodeByPartIdPromise as any}
		/>
	</section>

	<!-- PAGINATION -->
	<section>
		<Pagination {totalPages} />
	</section>
</main>
