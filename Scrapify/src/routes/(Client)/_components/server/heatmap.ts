export const heatmapDayCount = 7;
export const heatmapHourCount = 24;

/** Parts and scrap records of one day-of-week x hour cell. */
export type HeatmapCell = { quantity: number; records: number };

/** One row of the heatmap query. */
export type HeatmapRow = {
	/** Day of the week from Monday = 0 to Sunday = 6. */
	weekday: number;
	/** Hour of the day, 0 - 23. */
	hour: number;
	quantity: number;
	records: number;
};

export type Heatmap = {
	/** `cells[weekday][hour]`, always 7 x 24. */
	cells: HeatmapCell[][];
	maxQuantity: number;
	totalQuantity: number;
	totalRecords: number;
};

/** 1900-01-01 00:00 (a Monday), the zero date of SQL Server's `DATEDIFF(DAY, 0, value)`. */
const weekdayEpochMs = Date.UTC(1900, 0, 1);
const dayMs = 24 * 60 * 60 * 1000;

/**
 * Day of the week of a DB time (local wall-clock time read as UTC), Monday = 0, computed the same
 * way as the query: whole days since 1900-01-01 modulo 7. Works on UTC, so no DST change applies.
 */
export function weekdayOfDbTime(dbTime: Date): number {
	const days = Math.floor((dbTime.getTime() - weekdayEpochMs) / dayMs);
	return ((days % heatmapDayCount) + heatmapDayCount) % heatmapDayCount;
}

/**
 * The 7 x 24 grid from query rows; cells without rows hold zeros. Rows outside the grid are left
 * out, so the cells add up to `totalQuantity` of the rows that belong in it.
 */
export function buildHeatmap(rows: readonly HeatmapRow[]): Heatmap {
	const cells = Array.from({ length: heatmapDayCount }, () =>
		Array.from({ length: heatmapHourCount }, (): HeatmapCell => ({ quantity: 0, records: 0 }))
	);
	for (const row of rows) {
		const cell =
			Number.isInteger(row.weekday) && Number.isInteger(row.hour)
				? cells[row.weekday]?.[row.hour]
				: undefined;
		if (!cell) continue;
		cell.quantity += row.quantity;
		cell.records += row.records;
	}
	const all = cells.flat();
	return {
		cells,
		maxQuantity: Math.max(0, ...all.map((cell) => cell.quantity)),
		totalQuantity: all.reduce((sum, cell) => sum + cell.quantity, 0),
		totalRecords: all.reduce((sum, cell) => sum + cell.records, 0)
	};
}

/**
 * Opacity 0 - 1 of a cell: linear in `quantity / maxQuantity`, but a non-empty cell never drops
 * below `minOpacity`, so a small value stays visible next to a large maximum. 0 means no fill.
 */
export function heatmapIntensity(quantity: number, maxQuantity: number, minOpacity = 0.15): number {
	if (quantity <= 0 || maxQuantity <= 0) return 0;
	return Math.min(1, Math.max(minOpacity, quantity / maxQuantity));
}
