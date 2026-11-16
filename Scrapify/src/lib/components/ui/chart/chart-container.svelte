<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/components/ui/utils.js';
	import { chartColorVars, type ChartConfig } from './chart-utils.js';

	let {
		ref = $bindable(null),
		class: className,
		style,
		config,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { config: ChartConfig } = $props();
</script>

<!-- Sets `--color-<key>` per series and restyles LayerChart's parts with the theme tokens. -->
<div
	bind:this={ref}
	data-slot="chart"
	class={cn(
		'flex justify-center overflow-visible text-xs',
		'[&_.lc-root-container]:w-full',
		'[&_.lc-axis-tick-label]:fill-muted-foreground [&_.lc-axis-tick-label]:font-normal [&_text]:stroke-transparent',
		'[&_.lc-grid-x-rule]:stroke-border [&_.lc-grid-y-rule]:stroke-border',
		'[&_.lc-rule-x-line:not(.lc-grid-x-rule)]:stroke-transparent',
		'[&_.lc-rule-y-line:not(.lc-grid-y-rule)]:stroke-transparent',
		'[&_.lc-highlight-area]:fill-muted/40',
		'[&_.lc-tooltip-rects-g]:fill-transparent [&_.lc-layout-svg-g]:fill-transparent',
		className
	)}
	style={[chartColorVars(config), style].filter(Boolean).join('; ')}
	{...restProps}
>
	{@render children?.()}
</div>
