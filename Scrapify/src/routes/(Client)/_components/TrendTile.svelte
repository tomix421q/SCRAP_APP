<script lang="ts">
	import { onMount } from 'svelte';
	import { BarChart } from 'layerchart';
	import * as Card from '@/components/ui/card';
	import * as Chart from '@/components/ui/chart';
	import { formatNumber } from '@/utils/index';
	import { formatTrendBucket, type TrendGranularity } from '@/utils/trendBuckets';
	import type { DashboardStats } from '@/server/dashboardStats';

	let { trend, periodLabel }: { trend: DashboardStats['trend']; periodLabel: string } = $props();

	const chartConfig = {
		scrap: { label: 'Scrap', color: 'var(--color-chart-1)' },
		rebuild: { label: 'Rebuild', color: 'var(--color-chart-warning)' }
	} satisfies Chart.ChartConfig;

	const series = Object.entries(chartConfig).map(([key, { label }]) => ({
		key,
		label,
		color: `var(--color-${key})`
	}));

	const granularityLabels: Record<TrendGranularity, string> = {
		hour: 'per hour',
		day: 'per day',
		week: 'per week'
	};

	// A band scale keys bars by value, so each bucket gets a string key; labels read the date back.
	const chartData = $derived(
		trend.buckets.map((bucket) => ({ ...bucket, key: bucket.start.toISOString() }))
	);
	const hasParts = $derived(trend.buckets.some((b) => b.scrap > 0 || b.rebuild > 0));

	// Rendered in the browser only: LayerChart needs the laid-out width anyway, and its SSR render
	// fails with this project's Svelte version (a `$derived` reads state declared after it).
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	function bucketLabel(key: string, style: 'tick' | 'full') {
		return formatTrendBucket(new Date(key), trend.granularity, style);
	}
</script>

<Card.Root class="cardNormalize gap-3 py-4 md:col-span-2">
	<Card.Header class="flex flex-wrap items-start justify-between gap-2 px-4">
		<div class="flex flex-col gap-1.5">
			<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">Trend</Card.Title>
			<Card.Description
				>{periodLabel} · parts {granularityLabels[trend.granularity]}</Card.Description
			>
		</div>
		<ul class="flex gap-3 text-sm text-muted-foreground" aria-label="Legend">
			{#each Object.values(chartConfig) as { label, color } (label)}
				<li class="flex items-center gap-1.5">
					<span class="size-2 rounded-full" style:background-color={color}></span>{label}
				</li>
			{/each}
		</ul>
	</Card.Header>
	<Card.Content class="relative px-4">
		<Chart.Container config={chartConfig} class="h-48 w-full">
			{#if mounted}
				<BarChart
					data={chartData}
					x="key"
					{series}
					seriesLayout="stack"
					bandPadding={0.2}
					props={{
						xAxis: { format: (key: string) => bucketLabel(key, 'tick'), tickOcclusion: true },
						yAxis: { format: (value: number) => formatNumber(value) },
						tooltip: {
							header: { format: (key: string) => bucketLabel(key, 'full') },
							item: { format: (value: number) => formatNumber(value) }
						}
					}}
				/>
			{/if}
		</Chart.Container>
		{#if !hasParts}
			<p class="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
				No parts in this period
			</p>
		{/if}
	</Card.Content>
</Card.Root>
