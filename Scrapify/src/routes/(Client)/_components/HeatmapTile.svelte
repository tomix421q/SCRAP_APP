<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { formatNumber } from '@/utils/index';
	import { heatmapHourCount, heatmapIntensity, type Heatmap } from './server/heatmap';

	let { heatmap, periodLabel }: { heatmap: Heatmap; periodLabel: string } = $props();

	const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const weekdayNames = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday'
	];
	const hours = Array.from({ length: heatmapHourCount }, (_, hour) => hour);

	const pad = (hour: number) => String(hour).padStart(2, '0');

	function describe(weekday: number, hour: number) {
		const cell = heatmap.cells[weekday][hour];
		return `${weekdayNames[weekday]} ${pad(hour)}:00 – ${pad(hour + 1)}:00: ${formatNumber(cell.quantity)} parts, ${formatNumber(cell.records)} scrap records`;
	}
</script>

<Card.Root class="cardNormalize min-w-0 gap-3 py-4 xl:col-span-2">
	<Card.Header class="flex flex-wrap items-start justify-between gap-2 px-4">
		<div class="flex flex-col gap-1.5">
			<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">
				Heatmap by day and hour
			</Card.Title>
			<Card.Description>{periodLabel} · parts by day of the week and hour</Card.Description>
		</div>
		<div class="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
			Fewer
			<span class="h-3 w-24 rounded-sm bg-gradient-to-r from-chart-1/10 to-chart-1"></span>
			More
		</div>
	</Card.Header>
	<Card.Content class="px-4">
		{#if heatmap.totalQuantity === 0}
			<p class="py-10 text-center text-sm text-muted-foreground">No parts in this period</p>
		{:else}
			<!-- Scrolls inside the tile on a narrow screen; the page itself stays put. -->
			<div class="overflow-x-auto">
				<table class="w-full min-w-[40rem] table-fixed border-separate border-spacing-0.5">
					<caption class="sr-only">
						Parts by day of the week and hour of the day, {periodLabel}
					</caption>
					<thead>
						<tr>
							<td class="w-10"></td>
							{#each hours as hour (hour)}
								<th
									scope="col"
									class="text-center text-[10px] font-normal tabular-nums text-muted-foreground"
								>
									<span aria-hidden="true">{hour % 3 === 0 ? pad(hour) : ''}</span>
									<span class="sr-only">{pad(hour)}:00</span>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each weekdays as weekday, weekdayIndex (weekday)}
							<tr>
								<th scope="row" class="pr-1 text-left text-xs font-normal text-muted-foreground">
									<span aria-hidden="true">{weekday}</span>
									<span class="sr-only">{weekdayNames[weekdayIndex]}</span>
								</th>
								{#each hours as hour (hour)}
									{@const cell = heatmap.cells[weekdayIndex][hour]}
									<td class="p-0" title={describe(weekdayIndex, hour)}>
										<div class="relative h-6 rounded-sm">
											{#if cell.quantity > 0}
												<span
													class="absolute inset-0 rounded-sm bg-chart-1"
													style:opacity={heatmapIntensity(cell.quantity, heatmap.maxQuantity)}
												></span>
											{/if}
											<span class="sr-only">{describe(weekdayIndex, hour)}</span>
										</div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
