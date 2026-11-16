/** Series of a chart by key: label for legends and tooltips, color as any CSS color. */
export type ChartConfig = Record<string, { label: string; color: string }>;

/** CSS custom properties `--color-<key>` for each series, for `var(--color-<key>)` in marks. */
export function chartColorVars(config: ChartConfig): string {
	return Object.entries(config)
		.map(([key, { color }]) => `--color-${key}: ${color}`)
		.join('; ');
}
