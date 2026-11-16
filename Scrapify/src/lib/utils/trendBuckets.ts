export type TrendGranularity = 'hour' | 'day' | 'week';

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

/** Bucket size for a trend over `[from, to)`: hours up to 2 days, days up to 90 days, weeks above. */
export function pickTrendGranularity(period: { from: Date; to: Date }): TrendGranularity {
	const lengthMs = period.to.getTime() - period.from.getTime();
	if (lengthMs <= 2 * dayMs) return 'hour';
	if (lengthMs <= 90 * dayMs) return 'day';
	return 'week';
}

/** Length of one bucket. Weeks are 7 days long and start on Monday, like 1900-01-01. */
const granularityMs: Record<TrendGranularity, number> = {
	hour: hourMs,
	day: dayMs,
	week: 7 * dayMs
};

/** 1900-01-01 00:00 (a Monday), the zero date of SQL Server's `DATEDIFF(unit, 0, value)`. */
const bucketEpochMs = Date.UTC(1900, 0, 1);

/** Parts of one bucket and kind, as the trend query returns them. */
export type TrendRow = {
	/** Whole hours / days / weeks since 1900-01-01 00:00. */
	bucket: number;
	isRebuild: boolean;
	quantity: number;
};

export type TrendBucket = { start: Date; scrap: number; rebuild: number };

function bucketIndex(date: Date, granularity: TrendGranularity) {
	return Math.floor((date.getTime() - bucketEpochMs) / granularityMs[granularity]);
}

/**
 * Every bucket that overlaps `[from, to)`, in order, with the parts of `rows` added up per kind.
 * Buckets without rows hold zeros, so the time axis has no gaps; rows outside the period are left out.
 *
 * Works on UTC fields only, so a period in DB time (local wall-clock time read as UTC) keeps
 * whole local hours and midnights and no DST change can shift a bucket.
 */
export function buildTrendBuckets(
	period: { from: Date; to: Date },
	granularity: TrendGranularity,
	rows: readonly TrendRow[]
): TrendBucket[] {
	const first = bucketIndex(period.from, granularity);
	// `to` is exclusive, so the last bucket is the one holding the last millisecond.
	const last = bucketIndex(new Date(period.to.getTime() - 1), granularity);
	const sizeMs = granularityMs[granularity];

	const buckets: TrendBucket[] = [];
	for (let index = first; index <= last; index++) {
		buckets.push({ start: new Date(bucketEpochMs + index * sizeMs), scrap: 0, rebuild: 0 });
	}
	for (const row of rows) {
		const bucket = buckets[row.bucket - first];
		if (!bucket) continue;
		if (row.isRebuild) bucket.rebuild += row.quantity;
		else bucket.scrap += row.quantity;
	}
	return buckets;
}

// DB time holds local wall-clock time read as UTC, so it is formatted in UTC (see `dateTimeLocalTimeDb`).
const dayMonthFormatter = new Intl.DateTimeFormat('sk-SK', {
	day: 'numeric',
	month: 'numeric',
	timeZone: 'UTC'
});
const dateFormatter = new Intl.DateTimeFormat('sk-SK', {
	day: 'numeric',
	month: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
});
const hourFormatter = new Intl.DateTimeFormat('sk-SK', {
	hour: '2-digit',
	minute: '2-digit',
	timeZone: 'UTC'
});

/**
 * Label of a bucket starting at `start` (DB time): `'tick'` is short for the time axis,
 * `'full'` names the whole bucket for a tooltip.
 */
export function formatTrendBucket(
	start: Date,
	granularity: TrendGranularity,
	style: 'tick' | 'full'
): string {
	const end = new Date(start.getTime() + granularityMs[granularity]);
	switch (granularity) {
		case 'hour':
			return style === 'tick'
				? hourFormatter.format(start)
				: `${dateFormatter.format(start)} ${hourFormatter.format(start)} – ${hourFormatter.format(end)}`;
		case 'day':
			return style === 'tick' ? dayMonthFormatter.format(start) : dateFormatter.format(start);
		case 'week':
			return style === 'tick'
				? dayMonthFormatter.format(start)
				: `Week ${dayMonthFormatter.format(start)} – ${dateFormatter.format(new Date(end.getTime() - dayMs))}`;
	}
}
