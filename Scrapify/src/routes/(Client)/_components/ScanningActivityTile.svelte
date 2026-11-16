<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { formatNumber } from '@/utils/index';
	import type { ScanningActivity } from './server/dashboardStats.server';

	let {
		activity,
		periodLabel,
		class: className = ''
	}: { activity: ScanningActivity; periodLabel: string; class?: string } = $props();

	const maxRecords = $derived(Math.max(0, ...activity.rows.map((row) => row.records)));

	function barWidth(records: number) {
		return maxRecords > 0 ? (records / maxRecords) * 100 : 0;
	}
</script>

<Card.Root class="cardNormalize min-w-0 gap-3 py-4 {className}">
	<Card.Header class="px-4">
		<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">
			Scanning activity
		</Card.Title>
		<Card.Description>
			{periodLabel} · scrap records by Card ID{#if activity.itemCount > activity.rows.length}
				· top {activity.rows.length} of {formatNumber(activity.itemCount)}{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content class="px-4">
		{#if activity.rows.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">No scrap records in this period</p>
		{:else}
			<ul class="flex flex-col gap-1">
				{#each activity.rows as row (row.cardId)}
					<li class="px-2 py-1">
						<div class="flex items-baseline justify-between gap-2 text-sm">
							<span class="min-w-0 truncate font-medium">Card {row.cardId}</span>
							<span class="shrink-0 tabular-nums">
								<span class="font-bold">{formatNumber(row.records)}</span>
								<span class="text-muted-foreground">
									records · {formatNumber(row.quantity)} parts
								</span>
							</span>
						</div>
						<div class="mt-1 h-1.5 rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-chart-1"
								style:width="{barWidth(row.records)}%"
							></div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
</Card.Root>
