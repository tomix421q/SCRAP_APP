/** A ranking as the dashboard load returns it (top rows, number of items, parts of the whole). */
type ParetoSource = {
	rows: readonly {
		key: string;
		label: string;
		detail: string | null;
		scrap: number;
		rebuild: number;
	}[];
	/** Number of items in the whole ranking, not only the listed rows. */
	itemCount: number;
	/** Parts of the whole period and filter, the base of the shares. */
	totalQuantity: number;
};

export type ParetoBar = {
	key: string;
	label: string;
	detail: string | null;
	quantity: number;
	/** Share of all parts in %. */
	percent: number;
	/** Share of all parts up to and including this bar in %, ends at 100. */
	cumulativePercent: number;
	/** The bar that sums up everything beyond the listed rows. */
	isOthers: boolean;
};

/**
 * Pareto bars: the listed rows most parts first, then one "Others" bar with the rest of the
 * whole, so the cumulative share ends exactly at 100 %.
 */
export function buildPareto(source: ParetoSource): ParetoBar[] {
	const listed = source.rows.map((row) => ({ ...row, quantity: row.scrap + row.rebuild }));
	const listedQuantity = listed.reduce((sum, row) => sum + row.quantity, 0);
	// Stale or inconsistent data could list more than the total; never exceed 100 %.
	const total = Math.max(source.totalQuantity, listedQuantity);
	if (total <= 0) return [];

	const bars = listed.map((row) => ({
		key: row.key,
		label: row.label,
		detail: row.detail,
		quantity: row.quantity,
		isOthers: false
	}));
	const restQuantity = total - listedQuantity;
	// A tiny float remainder (fractional quantities) is not a real "Others" bar.
	if (restQuantity > 1e-9) {
		const restItems = source.itemCount - listed.length;
		bars.push({
			key: '__others',
			label: 'Others',
			detail: restItems > 0 ? `${restItems} more` : null,
			quantity: restQuantity,
			isOthers: true
		});
	}

	let cumulative = 0;
	return bars.map((bar) => {
		cumulative += bar.quantity;
		return {
			...bar,
			percent: (bar.quantity / total) * 100,
			cumulativePercent: Math.min(100, (cumulative / total) * 100)
		};
	});
}
