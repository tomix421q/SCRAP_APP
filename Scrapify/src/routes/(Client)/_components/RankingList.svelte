<script lang="ts">
	import { formatNumber } from '@/utils/index';
	import type { RankingRow } from '@/server/dashboardStats';

	type Props = {
		rows: RankingRow[];
		/** Show the rank, the share of the whole in % and the scrap / rebuild numbers. */
		isDetailed?: boolean;
		/** Parts of the whole ranking, the base of the shares in %. */
		totalQuantity?: number;
		/** Key of the highlighted row. */
		selectedKey?: string;
		/** Makes the rows buttons; called with the row key. */
		onselect?: (key: string) => void;
	};

	let { rows, isDetailed = false, totalQuantity = 0, selectedKey, onselect }: Props = $props();

	const maxQuantity = $derived(Math.max(0, ...rows.map((row) => row.scrap + row.rebuild)));

	function barWidth(value: number) {
		return maxQuantity > 0 ? (value / maxQuantity) * 100 : 0;
	}

	function percent(row: RankingRow) {
		return totalQuantity > 0 ? ((row.scrap + row.rebuild) / totalQuantity) * 100 : 0;
	}
</script>

<ol class="flex flex-col gap-1">
	{#each rows as row, index (row.key)}
		{@const isSelected = selectedKey !== undefined && selectedKey === row.key}
		<li>
			{#if onselect}
				<button
					type="button"
					class="w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring {isSelected
						? 'bg-muted ring-1 ring-primary'
						: ''}"
					aria-pressed={isSelected}
					onclick={() => onselect(row.key)}
				>
					{@render content(row, index)}
				</button>
			{:else}
				<div class="px-2 py-1">{@render content(row, index)}</div>
			{/if}
		</li>
	{/each}
</ol>

{#snippet content(row: RankingRow, index: number)}
	<div class="flex items-baseline justify-between gap-2 text-sm">
		<span class="min-w-0 truncate">
			{#if isDetailed}<span class="mr-1 text-muted-foreground tabular-nums">{index + 1}.</span>{/if}
			<span class="font-medium">{row.label}</span>
			{#if row.detail}<span class="text-muted-foreground"> · {row.detail}</span>{/if}
		</span>
		<span class="shrink-0 tabular-nums">
			<span class="font-bold text-primary">{formatNumber(row.scrap + row.rebuild)}</span>
			{#if isDetailed}<span class="ml-2 text-muted-foreground">{formatNumber(percent(row))} %</span
				>{/if}
		</span>
	</div>
	<!-- Scrap / rebuild bar, scaled to the biggest row of the list. -->
	<div
		class="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted/40"
		title="Scrap {formatNumber(row.scrap)} · Rebuild {formatNumber(row.rebuild)}"
	>
		<div class="bg-chart-1" style:width="{barWidth(row.scrap)}%"></div>
		<div class="bg-chart-warning" style:width="{barWidth(row.rebuild)}%"></div>
	</div>
	{#if isDetailed}
		<p class="mt-0.5 text-xs text-muted-foreground tabular-nums">
			Scrap {formatNumber(row.scrap)} · Rebuild {formatNumber(row.rebuild)}
		</p>
	{/if}
{/snippet}
