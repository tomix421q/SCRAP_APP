<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { TrendGranularity } from './server/trendBuckets';
	import type { DashboardStats } from './server/dashboardStats.server';
	import DetailsDialog from './DetailsDialog.svelte';
	import TrendChart from './TrendChart.svelte';

	let {
		trend,
		periodLabel,
		scrapRecordsQuery
	}: { trend: DashboardStats['trend']; periodLabel: string; scrapRecordsQuery: string } = $props();

	const legend = [
		{ label: 'Scrap', color: 'var(--color-chart-1)' },
		{ label: 'Rebuild', color: 'var(--color-chart-warning)' }
	];

	const granularityLabels: Record<TrendGranularity, string> = {
		hour: 'per hour',
		day: 'per day',
		week: 'per week'
	};
</script>

<Card.Root class="cardNormalize gap-3 py-4 md:col-span-2">
	<Card.Header class="flex flex-wrap items-start justify-between gap-2 px-4">
		<div class="flex flex-col gap-1.5">
			<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">Trend</Card.Title>
			<Card.Description
				>{periodLabel} · parts {granularityLabels[trend.granularity]}</Card.Description
			>
		</div>
		<div class="flex items-center gap-3">
			{@render legendList()}
			<DetailsDialog title="Trend" description={periodLabel} {scrapRecordsQuery}>
				{@render legendList()}
				<TrendChart {trend} class="h-72 w-full" />
			</DetailsDialog>
		</div>
	</Card.Header>
	<Card.Content class="px-4">
		<TrendChart {trend} />
	</Card.Content>
</Card.Root>

{#snippet legendList()}
	<ul class="flex gap-3 text-sm text-muted-foreground" aria-label="Legend">
		{#each legend as { label, color } (label)}
			<li class="flex items-center gap-1.5">
				<span class="size-2 rounded-full" style:background-color={color}></span>{label}
			</li>
		{/each}
	</ul>
{/snippet}
