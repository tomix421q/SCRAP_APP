<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import DashboardFilters from './_components/DashboardFilters.svelte';
	import TotalPartsTile from './_components/TotalPartsTile.svelte';
	import RankingTile from './_components/RankingTile.svelte';
	import TrendTile from './_components/TrendTile.svelte';
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

	/** Clicking the selected project again clears the project filter. */
	function toggleProject(project: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (data.filters.project === project) params.delete('project');
		else params.set('project', project);
		const query = params.toString();
		goto(query ? `?${query}` : page.url.pathname, { keepFocus: true, noScroll: true });
	}

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

<main class="mt-6 flex flex-col gap-4 lg:mt-20">
	<h1 class="sr-only">Scrap records dashboard</h1>
	<DashboardFilters filters={data.filters} projects={data.projects} />

	<!-- Bento grid: one column on narrow screens in the order Total → Trend → Projects → others. -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
		<TotalPartsTile totals={data.totals} {periodLabel} />
		<TrendTile trend={data.trend} {periodLabel} />
		<RankingTile
			class="xl:col-start-4 xl:row-span-2 xl:row-start-1"
			title="Projects"
			description="{data.filters.range === 'custom'
				? 'Custom range'
				: dashboardRangeLabels[data.filters.range].period} · by parts"
			rows={data.rankings.projects}
			selectedKey={data.filters.project}
			onselect={toggleProject}
			visibleRows={6}
		/>
		<RankingTile
			title="Top part groups"
			description="{periodLabel} · top 5"
			rows={data.rankings.partGroups}
		/>
		<RankingTile
			title="Top scrap codes"
			description="{periodLabel} · top 5"
			rows={data.rankings.scrapCodes}
		/>
		<div class="flex flex-col gap-4">
			<MasterDataTile masterData={data.masterData} />
			<AllTimeTile allTime={data.allTime} />
		</div>
	</div>
</main>
