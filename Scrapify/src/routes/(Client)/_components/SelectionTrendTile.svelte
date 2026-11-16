<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '@/components/ui/card';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import type { DashboardStats } from './server/dashboardStats.server';
	import { formatTrendSelection, type TrendSelectionKind } from './server/trendSelection';
	import type { TrendGranularity } from './server/trendBuckets';
	import TrendChart from './TrendChart.svelte';

	let {
		selectionTrend,
		periodLabel,
		class: className = ''
	}: {
		selectionTrend: DashboardStats['selectionTrend'];
		periodLabel: string;
		class?: string;
	} = $props();

	const kindItems = [
		{ id: 'partGroup', name: 'Part group' },
		{ id: 'scrapCode', name: 'Scrap code' }
	] satisfies { id: TrendSelectionKind; name: string }[];

	const legend = [
		{ label: 'Scrap', color: 'var(--color-chart-1)' },
		{ label: 'Rebuild', color: 'var(--color-chart-warning)' }
	];

	const granularityLabels: Record<TrendGranularity, string> = {
		hour: 'per hour',
		day: 'per day',
		week: 'per week'
	};

	// The kind picked before an item exists (the URL has no selection yet).
	let pickedKind = $state<TrendSelectionKind>('partGroup');
	const kind = $derived<TrendSelectionKind>(selectionTrend.selected?.kind ?? pickedKind);
	const items = $derived(
		kind === 'partGroup' ? selectionTrend.options.partGroups : selectionTrend.options.scrapCodes
	);
	const nameLabel = $derived(kind === 'scrapCode' ? 'codeName' : 'name');
	const selectedId = $derived(selectionTrend.selected?.id ?? '');
	const selectedName = $derived(items.find((item) => item.id === selectedId)?.name);

	function setTrendParam(value: string | undefined) {
		const params = new URLSearchParams(page.url.searchParams);
		if (value) params.set('trend', value);
		else params.delete('trend');
		const query = params.toString();
		goto(query ? `?${query}` : page.url.pathname, { keepFocus: true, noScroll: true });
	}

	function selectKind(value: string) {
		if (value !== 'partGroup' && value !== 'scrapCode') return;
		pickedKind = value;
		// Another kind makes the current item meaningless.
		if (selectionTrend.selected && selectionTrend.selected.kind !== value) setTrendParam(undefined);
	}

	function selectItem(id: string) {
		if (!id) return setTrendParam(undefined);
		setTrendParam(
			formatTrendSelection(kind === 'partGroup' ? { kind, id: Number(id) } : { kind, code: id })
		);
	}
</script>

<Card.Root class="cardNormalize min-w-0 gap-3 py-4 {className}">
	<Card.Header class="flex flex-wrap items-start justify-between gap-2 px-4">
		<div class="flex flex-col gap-1.5">
			<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">
				Trend of selection
			</Card.Title>
			<Card.Description>
				{periodLabel}{selectionTrend.trend
					? ` · parts ${granularityLabels[selectionTrend.trend.granularity]}`
					: ''}
			</Card.Description>
		</div>
		{#if selectionTrend.trend}
			<ul class="flex gap-3 text-sm text-muted-foreground" aria-label="Legend">
				{#each legend as { label, color } (label)}
					<li class="flex items-center gap-1.5">
						<span class="size-2 rounded-full" style:background-color={color}></span>{label}
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Header>
	<Card.Content class="flex flex-col gap-3 px-4">
		<div class="flex flex-wrap items-center gap-2">
			<Combobox dataBox={kindItems} value={kind} onchange={selectKind} width="xs" />
			<Combobox
				dataBox={items}
				value={selectedId}
				onchange={selectItem}
				{nameLabel}
				firstText={kind === 'partGroup' ? 'Select a part group' : 'Select a scrap code'}
				width="lg"
			/>
		</div>
		{#if selectionTrend.trend}
			<p class="sr-only">Trend of {selectedName ?? selectedId}</p>
			<TrendChart trend={selectionTrend.trend} />
		{:else}
			<p class="py-10 text-center text-sm text-muted-foreground">
				Select a part group or scrap code
			</p>
		{/if}
	</Card.Content>
</Card.Root>
