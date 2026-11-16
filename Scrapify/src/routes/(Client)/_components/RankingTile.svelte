<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { formatNumber } from '@/utils/index';
	import type { RankingRow } from '@/server/dashboardStats';

	type Props = {
		title: string;
		description: string;
		rows: RankingRow[];
		/** Shown when the period has no records at all. */
		emptyText?: string;
		/** Key of the highlighted row (the selected project). */
		selectedKey?: string;
		/** Makes the rows buttons; called with the row key. */
		onselect?: (key: string) => void;
		/** Rows visible before the list scrolls inside the tile. */
		visibleRows?: number;
		class?: string;
	};

	let {
		title,
		description,
		rows,
		emptyText = 'No parts in this period',
		selectedKey,
		onselect,
		visibleRows,
		class: className = ''
	}: Props = $props();

	const rowHeightRem = 2.75;
	const maxQuantity = $derived(Math.max(0, ...rows.map((row) => row.scrap + row.rebuild)));

	function share(value: number) {
		return maxQuantity > 0 ? (value / maxQuantity) * 100 : 0;
	}
</script>

<Card.Root class="cardNormalize gap-3 py-4 {className}">
	<Card.Header class="px-4">
		<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content class="px-4">
		{#if rows.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
		{:else}
			<ul
				class="flex flex-col gap-1"
				style:max-height={visibleRows ? `${visibleRows * rowHeightRem}rem` : undefined}
				style:overflow-y={visibleRows ? 'auto' : undefined}
			>
				{#each rows as row (row.key)}
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
								{@render content(row)}
							</button>
						{:else}
							<div class="px-2 py-1">{@render content(row)}</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
</Card.Root>

{#snippet content(row: RankingRow)}
	<div class="flex items-baseline justify-between gap-2 text-sm">
		<span class="min-w-0 truncate">
			<span class="font-medium">{row.label}</span>
			{#if row.detail}<span class="text-muted-foreground"> · {row.detail}</span>{/if}
		</span>
		<span class="shrink-0 font-bold tabular-nums text-primary">
			{formatNumber(row.scrap + row.rebuild)}
		</span>
	</div>
	<!-- Scrap / rebuild bar, scaled to the biggest row of the list. -->
	<div
		class="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted/40"
		title="Scrap {formatNumber(row.scrap)} · Rebuild {formatNumber(row.rebuild)}"
	>
		<div class="bg-chart-1" style:width="{share(row.scrap)}%"></div>
		<div class="bg-chart-warning" style:width="{share(row.rebuild)}%"></div>
	</div>
{/snippet}
