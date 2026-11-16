<script lang="ts">
	import { onMount } from 'svelte';
	import { BarChart } from 'layerchart';
	import * as Chart from '@/components/ui/chart';
	import { formatNumber } from '@/utils/index';
	import { formatTrendBucket } from './server/trendBuckets';
	import type { DashboardStats } from './server/dashboardStats.server';

	let {
		trend,
		class: className = 'h-48 w-full'
	}: { trend: DashboardStats['trend']; class?: string } = $props();

	const chartConfig = {
		scrap: { label: 'Scrap', color: 'var(--color-chart-1)' },
		rebuild: { label: 'Rebuild', color: 'var(--color-chart-warning)' }
	} satisfies Chart.ChartConfig;

	const series = Object.entries(chartConfig).map(([key, { label }]) => ({
		key,
		label,
		color: `var(--color-${key})`
	}));

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

<div class="relative">
	<Chart.Container config={chartConfig} class={className}>
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
</div>
