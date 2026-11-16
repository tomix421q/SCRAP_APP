<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Ranking } from './server/dashboardStats.server';
	import DetailsDialog from './DetailsDialog.svelte';
	import RankingList from './RankingList.svelte';

	type Props = {
		title: string;
		description: string;
		ranking: Ranking;
		/** Rows shown in the tile; the detail dialog shows up to 10. */
		tileRows?: number;
		/** Key of the highlighted row (the selected project). */
		selectedKey?: string;
		/** Makes the rows buttons; called with the row key. */
		onselect?: (key: string) => void;
		/** Rows visible before the list scrolls inside the tile. */
		visibleRows?: number;
		/** Active period and project, shown in the detail dialog. */
		periodLabel: string;
		scrapRecordsQuery: string;
		class?: string;
	};

	let {
		title,
		description,
		ranking,
		tileRows,
		selectedKey,
		onselect,
		visibleRows,
		periodLabel,
		scrapRecordsQuery,
		class: className = ''
	}: Props = $props();

	const rowHeightRem = 2.75;
	const detailSize = 10;
	const detailRows = $derived(ranking.rows.slice(0, detailSize));
</script>

<Card.Root class="cardNormalize gap-3 py-4 {className}">
	<Card.Header class="flex items-start justify-between gap-2 px-4">
		<div class="flex flex-col gap-1.5">
			<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">{title}</Card.Title
			>
			<Card.Description>{description}</Card.Description>
		</div>
		{#if ranking.rows.length > 0}
			<DetailsDialog {title} description={periodLabel} {scrapRecordsQuery}>
				<RankingList
					rows={detailRows}
					isDetailed
					totalQuantity={ranking.totalQuantity}
					{selectedKey}
				/>
				<p class="text-xs text-muted-foreground">
					Top {detailRows.length} of {ranking.itemCount}
				</p>
			</DetailsDialog>
		{/if}
	</Card.Header>
	<Card.Content class="px-4">
		{#if ranking.rows.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">No parts in this period</p>
		{:else}
			<div
				style:max-height={visibleRows ? `${visibleRows * rowHeightRem}rem` : undefined}
				style:overflow-y={visibleRows ? 'auto' : undefined}
			>
				<RankingList
					rows={tileRows ? ranking.rows.slice(0, tileRows) : ranking.rows}
					{selectedKey}
					{onselect}
				/>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
