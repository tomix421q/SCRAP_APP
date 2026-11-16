<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { formatNumber } from '@/utils/index';
	import type { DashboardStats } from './server/dashboardStats.server';
	import { ArrowDownRight, ArrowRight, ArrowUpRight } from '@lucide/svelte';

	let { totals, periodLabel }: { totals: DashboardStats['totals']; periodLabel: string } =
		$props();

	const scrapShare = $derived(totals.quantity > 0 ? (totals.scrapQuantity / totals.quantity) * 100 : 0);
	// The change is shown neutrally: more parts is not judged as good or bad here.
	const ChangeIcon = $derived(
		totals.changePercent === null || totals.changePercent === 0
			? ArrowRight
			: totals.changePercent > 0
				? ArrowUpRight
				: ArrowDownRight
	);
</script>

<Card.Root class="cardNormalize gap-3 py-4">
	<Card.Header class="px-4">
		<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">Total parts</Card.Title>
		<Card.Description>{periodLabel}</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-3 px-4">
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<span class="text-4xl font-bold tabular-nums text-primary">{formatNumber(totals.quantity)}</span>
			<span class="text-sm uppercase text-muted-foreground">parts</span>
			{#if totals.changePercent !== null}
				<span
					class="flex items-center gap-0.5 text-sm tabular-nums text-muted-foreground"
					title="Change against the previous period of the same length"
				>
					<ChangeIcon class="size-4" />
					{totals.changePercent > 0 ? '+' : ''}{formatNumber(Math.round(totals.changePercent))} %
				</span>
			{/if}
		</div>

		<div
			class="flex h-2 overflow-hidden rounded-full bg-muted"
			role="img"
			aria-label="Scrap {formatNumber(totals.scrapQuantity)}, rebuild {formatNumber(totals.rebuildQuantity)}"
		>
			{#if totals.quantity > 0}
				<div class="bg-chart-1" style:width="{scrapShare}%"></div>
				<div class="flex-1 bg-chart-warning"></div>
			{/if}
		</div>

		<dl class="grid grid-cols-3 gap-2 text-sm">
			<div>
				<dt class="flex items-center gap-1.5 text-muted-foreground">
					<span class="size-2 rounded-full bg-chart-1"></span>Scrap
				</dt>
				<dd class="font-semibold tabular-nums">{formatNumber(totals.scrapQuantity)}</dd>
			</div>
			<div>
				<dt class="flex items-center gap-1.5 text-muted-foreground">
					<span class="size-2 rounded-full bg-chart-warning"></span>Rebuild
				</dt>
				<dd class="font-semibold tabular-nums">{formatNumber(totals.rebuildQuantity)}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Records</dt>
				<dd class="font-semibold tabular-nums">{formatNumber(totals.records)}</dd>
			</div>
		</dl>
	</Card.Content>
</Card.Root>
