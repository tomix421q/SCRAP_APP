<script lang="ts">
	import type { PageData } from './$types';
	import DashboardFilters from './_components/DashboardFilters.svelte';
	import TotalPartsTile from './_components/TotalPartsTile.svelte';
	import MasterDataTile from './_components/MasterDataTile.svelte';
	import AllTimeTile from './_components/AllTimeTile.svelte';
	import { dashboardRangeLabels } from '@/utils/dashboardFilters';

	let { data }: { data: PageData } = $props();

	const periodLabel = $derived.by(() => {
		const { range, project, from, to } = data.filters;
		const period =
			range === 'custom'
				? `${formatInputDate(from)} – ${formatInputDate(to)}`
				: dashboardRangeLabels[range].period;
		return project ? `${period} · ${project}` : period;
	});

	/** `YYYY-MM-DD` from the URL as `d. m. yyyy`, without going through time zones. */
	function formatInputDate(value: string | undefined) {
		if (!value) return '';
		const [year, month, day] = value.split('-').map(Number);
		return `${day}. ${month}. ${year}`;
	}
</script>

<svelte:head>
	<title>Dashboard | Scrapify</title>
</svelte:head>

<main class="mt-4 flex flex-col gap-4 lg:mt-12">
	<h1 class="sr-only">Scrap records dashboard</h1>
	<DashboardFilters filters={data.filters} projects={data.projects} />

	<!-- Bento grid: one column on narrow screens in the order Total → Trend → Projects → others.
	     Trend (2 columns), Projects (2 rows), Top part groups and Top scrap codes join later. -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
		<TotalPartsTile totals={data.totals} {periodLabel} />
		<MasterDataTile masterData={data.masterData} />
		<AllTimeTile allTime={data.allTime} />
	</div>
</main>
