<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { formatNumber } from '@/utils/index';
	import type { DashboardStats } from '@/server/dashboardStats';

	let { masterData }: { masterData: DashboardStats['masterData'] } = $props();

	const items = $derived([
		{ label: 'Projects', value: masterData.projects },
		{ label: 'Part groups', value: masterData.partGroups },
		{ label: 'Part numbers', value: masterData.partNumbers },
		{ label: 'Labels', value: masterData.labels }
	]);
</script>

<Card.Root class="cardNormalize gap-3 py-4">
	<Card.Header class="px-4">
		<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">Master data</Card.Title>
		<Card.Description>In the system</Card.Description>
	</Card.Header>
	<Card.Content class="px-4">
		<dl class="grid grid-cols-2 gap-3">
			{#each items as item (item.label)}
				<div>
					<dt class="text-sm text-muted-foreground">{item.label}</dt>
					<dd class="text-2xl font-bold tabular-nums text-primary">{formatNumber(item.value)}</dd>
				</div>
			{/each}
		</dl>
	</Card.Content>
</Card.Root>
