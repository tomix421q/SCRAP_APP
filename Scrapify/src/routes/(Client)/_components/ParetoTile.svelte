<script lang="ts">
	import * as Card from '@/components/ui/card';
	import { formatNumber } from '@/utils/index';
	import { buildPareto } from './server/pareto';
	import type { Ranking } from './server/dashboardStats.server';

	let { ranking, periodLabel }: { ranking: Ranking; periodLabel: string } = $props();

	const bars = $derived(buildPareto(ranking));
	const axisTicks = [100, 50, 0];

	/** Horizontal centre of a bar column in % of the plot width. */
	function centerX(index: number) {
		return ((index + 0.5) / bars.length) * 100;
	}

	const linePoints = $derived(
		bars.map((bar, index) => `${centerX(index)},${100 - bar.cumulativePercent}`).join(' ')
	);

	function describe(bar: (typeof bars)[number]) {
		const name = bar.detail ? `${bar.label} · ${bar.detail}` : bar.label;
		return `${name}: ${formatNumber(bar.quantity)} parts, ${formatNumber(bar.percent)} %, cumulative ${formatNumber(bar.cumulativePercent)} %`;
	}
</script>

<Card.Root class="cardNormalize gap-3 py-4 xl:col-span-2">
	<Card.Header class="flex flex-wrap items-start justify-between gap-2 px-4">
		<div class="flex flex-col gap-1.5">
			<Card.Title class="text-sm uppercase tracking-wider text-muted-foreground">
				Pareto of scrap codes
			</Card.Title>
			<Card.Description>{periodLabel} · top {ranking.rows.length} codes</Card.Description>
		</div>
		<ul class="flex gap-3 text-sm text-muted-foreground" aria-label="Legend">
			<li class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-chart-1"></span>Parts
			</li>
			<li class="flex items-center gap-1.5">
				<span class="h-0.5 w-3 bg-chart-info"></span>Cumulative share
			</li>
		</ul>
	</Card.Header>
	<Card.Content class="px-4">
		{#if bars.length === 0}
			<p class="py-10 text-center text-sm text-muted-foreground">No parts in this period</p>
		{:else}
			<div class="flex flex-col gap-1">
				<div class="flex gap-2">
					<!-- Plot: bar height and the line share one 0 - 100 % scale of all parts. -->
					<div class="relative h-48 flex-1" role="img" aria-label="Pareto chart of scrap codes">
						{#each axisTicks as tick (tick)}
							<div
								class="absolute inset-x-0 border-t border-border"
								style:top="{100 - tick}%"
							></div>
						{/each}
						<div class="absolute inset-0 flex items-end gap-1">
							{#each bars as bar (bar.key)}
								<div class="flex h-full flex-1 items-end" title={describe(bar)}>
									<div
										class="w-full rounded-t-sm {bar.isOthers
											? 'bg-muted-foreground/50'
											: 'bg-chart-1'}"
										style:height="{bar.percent}%"
									></div>
								</div>
							{/each}
						</div>
						<svg
							class="pointer-events-none absolute inset-0 size-full overflow-visible"
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<polyline
								points={linePoints}
								fill="none"
								class="stroke-chart-info"
								stroke-width="2"
								vector-effect="non-scaling-stroke"
							/>
						</svg>
						{#each bars as bar, index (bar.key)}
							<span
								class="pointer-events-none absolute size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-chart-info"
								style:left="{centerX(index)}%"
								style:bottom="{bar.cumulativePercent}%"
							></span>
						{/each}
					</div>
					<div class="relative h-48 w-9 shrink-0 text-xs text-muted-foreground" aria-hidden="true">
						{#each axisTicks as tick (tick)}
							<span class="absolute -translate-y-1/2 tabular-nums" style:top="{100 - tick}%">
								{tick} %
							</span>
						{/each}
					</div>
				</div>
				<div class="flex gap-2">
					<ol class="flex flex-1 gap-1">
						{#each bars as bar (bar.key)}
							<li
								class="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground"
								title={describe(bar)}
							>
								{bar.label}
								<span class="sr-only">{describe(bar)}</span>
							</li>
						{/each}
					</ol>
					<div class="w-9 shrink-0"></div>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
