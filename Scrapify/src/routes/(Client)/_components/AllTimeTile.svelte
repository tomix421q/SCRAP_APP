<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { dateTimePartsLocalTimeDb, formatNumber } from '@/utils/index';
	import type { DashboardStats } from '@/server/dashboardStats';

	let { allTime }: { allTime: DashboardStats['allTime'] } = $props();
</script>

<Card.Root class="cardNormalize gap-3 py-4">
	<Card.Header class="px-4">
		<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">All-time</Card.Title>
		<Card.Description>
			{#if allTime.firstRecordAt}
				Since {dateTimePartsLocalTimeDb(allTime.firstRecordAt).date}
			{:else}
				No scrap records yet
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content class="px-4">
		<dl class="grid grid-cols-2 gap-3">
			<div>
				<dt class="text-sm text-muted-foreground">Parts</dt>
				<dd class="text-2xl font-bold tabular-nums text-primary">{formatNumber(allTime.quantity)}</dd>
			</div>
			<div>
				<dt class="text-sm text-muted-foreground">Scrap records</dt>
				<dd class="text-2xl font-bold tabular-nums text-primary">{formatNumber(allTime.records)}</dd>
			</div>
		</dl>
	</Card.Content>
</Card.Root>
