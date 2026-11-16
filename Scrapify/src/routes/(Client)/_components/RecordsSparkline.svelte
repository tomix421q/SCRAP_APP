<script lang="ts">
	import { onMount } from 'svelte';
	import { BarChart } from 'layerchart';
	import * as Chart from '@/components/ui/chart';
	import { formatNumber } from '@/utils/index';
	import { formatTrendBucket } from './server/trendBuckets';
	import type { DashboardStats } from './server/dashboardStats.server';

	let { trend }: { trend: DashboardStats['trend'] } = $props();

	const chartConfig = {
		records: { label: 'Records', color: 'var(--color-chart-1)' }
	} satisfies Chart.ChartConfig;

	const series = [{ key: 'records', label: 'Records', color: 'var(--color-records)' }];

	// A band scale keys bars by value, so each bucket gets a string key; the tooltip reads the date back.
	const chartData = $derived(
		trend.buckets.map((bucket) => ({ records: bucket.records, key: bucket.start.toISOString() }))
	);

	// Rendered in the browser only, like the Trend chart (LayerChart needs the laid-out width).
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<!-- Number of scrap records per time bucket (same buckets as Trend), without axes. -->
<div class="flex flex-col gap-1">
	<span class="text-xs text-muted-foreground">Records over time</span>
	<Chart.Container config={chartConfig} class="aspect-auto h-12 w-full">
		{#if mounted}
			<BarChart
				data={chartData}
				x="key"
				{series}
				axis={false}
				grid={false}
				legend={false}
				bandPadding={0.15}
				padding={{ top: 2, bottom: 0, left: 0, right: 0 }}
				props={{
					tooltip: {
						header: {
							format: (key: string) => formatTrendBucket(new Date(key), trend.granularity, 'full')
						},
						item: { format: (value: number) => formatNumber(value) }
					}
				}}
			/>
		{/if}
	</Chart.Container>
</div>
