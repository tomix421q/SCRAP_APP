import { describe, expect, it } from 'vitest';
import {
	buildTrendBuckets,
	formatTrendBucket,
	pickTrendGranularity,
	type TrendGranularity,
	type TrendRow
} from '../src/routes/(Client)/_components/server/trendBuckets';

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;
const sizeMs: Record<TrendGranularity, number> = { hour: hourMs, day: dayMs, week: 7 * dayMs };
const sqlEpoch = Date.UTC(1900, 0, 1);

/** DB time (local wall-clock time read as UTC). */
function dbTime(year: number, monthIndex: number, day: number, hours = 0, minutes = 0) {
	return new Date(Date.UTC(year, monthIndex, day, hours, minutes));
}

/** The index SQL Server's `DATEDIFF(unit, 0, createdAt)` gives for a record at `date`. */
function bucketOf(date: Date, granularity: TrendGranularity) {
	return Math.floor((date.getTime() - sqlEpoch) / sizeMs[granularity]);
}

/** Periods the dashboard can produce: rolling 1 / 7 / 30 days and custom ranges up to a year. */
const periods = [
	{ name: '1 day rolling', from: dbTime(2026, 10, 15, 12, 30), to: dbTime(2026, 10, 16, 12, 30) },
	{ name: '7 days rolling', from: dbTime(2026, 10, 9, 12, 30), to: dbTime(2026, 10, 16, 12, 30) },
	{ name: '30 days rolling', from: dbTime(2026, 9, 17, 12, 30), to: dbTime(2026, 10, 16, 12, 30) },
	{ name: 'one custom day', from: dbTime(2026, 2, 1), to: dbTime(2026, 2, 2) },
	{ name: 'custom 90 days', from: dbTime(2026, 0, 1), to: dbTime(2026, 3, 1) },
	{ name: 'custom 91 days', from: dbTime(2026, 0, 1), to: dbTime(2026, 3, 2) },
	{ name: 'custom across a year end', from: dbTime(2025, 10, 1), to: dbTime(2026, 9, 1) },
	{ name: 'custom across a DST change', from: dbTime(2026, 9, 20), to: dbTime(2026, 9, 31) }
];

describe.each(periods)('trend buckets for $name', ({ from, to }) => {
	const period = { from, to };
	const granularity = pickTrendGranularity(period);

	/** One record on every hour of the period, so every bucket gets parts. */
	function hourlyRows(): TrendRow[] {
		const rows: TrendRow[] = [];
		for (let t = from.getTime(); t < to.getTime(); t += hourMs) {
			const date = new Date(t);
			rows.push({ bucket: bucketOf(date, granularity), isRebuild: false, quantity: 2, records: 2 });
			rows.push({ bucket: bucketOf(date, granularity), isRebuild: true, quantity: 1, records: 1 });
		}
		return rows;
	}

	it('has evenly spaced, ascending buckets without gaps or duplicates', () => {
		const buckets = buildTrendBuckets(period, granularity, []);

		for (let i = 1; i < buckets.length; i++) {
			expect(buckets[i].start.getTime() - buckets[i - 1].start.getTime()).toBe(sizeMs[granularity]);
		}
	});

	it('starts at or before the period start and ends inside the period', () => {
		const buckets = buildTrendBuckets(period, granularity, []);

		expect(buckets[0].start.getTime()).toBeLessThanOrEqual(from.getTime());
		expect(buckets[0].start.getTime() + sizeMs[granularity]).toBeGreaterThan(from.getTime());
		expect(buckets.at(-1)!.start.getTime()).toBeLessThan(to.getTime());
		expect(buckets.at(-1)!.start.getTime() + sizeMs[granularity]).toBeGreaterThanOrEqual(
			to.getTime()
		);
	});

	it('keeps every part: the stacked bars add up to the rows, scrap and rebuild apart', () => {
		const rows = hourlyRows();
		const buckets = buildTrendBuckets(period, granularity, rows);

		const sum = (key: 'scrap' | 'rebuild' | 'records') =>
			buckets.reduce((total, b) => total + b[key], 0);
		expect(sum('records')).toBe(rows.reduce((t, r) => t + r.records, 0));
		expect(sum('scrap')).toBe(rows.filter((r) => !r.isRebuild).reduce((t, r) => t + r.quantity, 0));
		expect(sum('rebuild')).toBe(
			rows.filter((r) => r.isRebuild).reduce((t, r) => t + r.quantity, 0)
		);
	});

	it('is empty (all zeros) without rows, never missing buckets', () => {
		const buckets = buildTrendBuckets(period, granularity, []);

		expect(buckets.length).toBeGreaterThan(0);
		expect(buckets.every((b) => b.scrap === 0 && b.rebuild === 0)).toBe(true);
	});
});

describe('trend buckets at the edges', () => {
	it('does not add a bucket that starts exactly at the exclusive end of the period', () => {
		const buckets = buildTrendBuckets(
			{ from: dbTime(2026, 2, 1), to: dbTime(2026, 2, 3) },
			'day',
			[]
		);

		expect(buckets.map((b) => b.start)).toEqual([dbTime(2026, 2, 1), dbTime(2026, 2, 2)]);
	});

	it('keeps days 24 hours long in DB time over the autumn DST change', () => {
		// 2026-10-25 is 25 hours long on the wall clock, but DB time reads it as UTC.
		const buckets = buildTrendBuckets(
			{ from: dbTime(2026, 9, 24), to: dbTime(2026, 9, 27) },
			'day',
			[]
		);

		expect(buckets.map((b) => b.start)).toEqual([
			dbTime(2026, 9, 24),
			dbTime(2026, 9, 25),
			dbTime(2026, 9, 26)
		]);
	});

	it('puts a record of the last minute of a day into that day, not the next one', () => {
		const buckets = buildTrendBuckets({ from: dbTime(2026, 2, 1), to: dbTime(2026, 2, 3) }, 'day', [
			{
				bucket: bucketOf(dbTime(2026, 2, 1, 23, 59), 'day'),
				isRebuild: false,
				quantity: 1,
				records: 1
			}
		]);

		expect(buckets.map((b) => b.scrap)).toEqual([1, 0]);
	});

	it('has at most 54 weekly buckets for the longest custom range (one year)', () => {
		const period = { from: dbTime(2026, 0, 1), to: dbTime(2027, 0, 1) };

		const buckets = buildTrendBuckets(period, pickTrendGranularity(period), []);

		expect(buckets.length).toBeLessThanOrEqual(54);
		expect(buckets.length).toBeGreaterThanOrEqual(52);
	});
});

describe('formatTrendBucket', () => {
	// Non-breaking spaces from Intl are normalized, so the expectations stay readable.
	const label = (start: Date, granularity: TrendGranularity, style: 'tick' | 'full') =>
		formatTrendBucket(start, granularity, style).replace(/\s/g, ' ');

	it('labels an hour by its time on the axis and by the whole hour in the tooltip', () => {
		expect(label(dbTime(2026, 10, 16, 8), 'hour', 'tick')).toBe('08:00');
		expect(label(dbTime(2026, 10, 16, 8), 'hour', 'full')).toBe('16. 11. 2026 08:00 – 09:00');
	});

	it('labels the last hour of a day as ending at midnight', () => {
		expect(label(dbTime(2026, 10, 16, 23), 'hour', 'full')).toBe('16. 11. 2026 23:00 – 00:00');
	});

	it('labels a day by day and month on the axis and by the full date in the tooltip', () => {
		expect(label(dbTime(2026, 10, 16), 'day', 'tick')).toBe('16. 11.');
		expect(label(dbTime(2026, 10, 16), 'day', 'full')).toBe('16. 11. 2026');
	});

	it('names a whole week from Monday to Sunday in the tooltip', () => {
		expect(label(dbTime(2026, 10, 16), 'week', 'tick')).toBe('16. 11.');
		expect(label(dbTime(2026, 10, 16), 'week', 'full')).toBe('Week 16. 11. – 22. 11. 2026');
	});

	it('names a week across a year end with the year of its last day', () => {
		expect(label(dbTime(2025, 11, 29), 'week', 'full')).toBe('Week 29. 12. – 4. 1. 2026');
	});

	it('reads DB time as written, whatever zone the process runs in', () => {
		// A record saved at local 00:30 must stay in its own day, not drift by the zone offset.
		expect(label(dbTime(2026, 5, 1), 'day', 'full')).toBe('1. 6. 2026');
	});
});
