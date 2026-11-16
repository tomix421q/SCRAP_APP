import { describe, expect, it } from 'vitest';
import { buildTrendBuckets, pickTrendGranularity } from '../src/lib/utils/trendBuckets';

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

/** Period of the given length, in DB time (local wall-clock time read as UTC). */
function periodOf(lengthMs: number) {
	const from = new Date(Date.UTC(2026, 10, 1));
	return { from, to: new Date(from.getTime() + lengthMs) };
}

describe('pickTrendGranularity', () => {
	it('uses hours up to 2 days', () => {
		expect(pickTrendGranularity(periodOf(dayMs))).toBe('hour');
		expect(pickTrendGranularity(periodOf(2 * dayMs))).toBe('hour');
	});

	it('uses days above 2 and up to 90 days', () => {
		expect(pickTrendGranularity(periodOf(2 * dayMs + hourMs))).toBe('day');
		expect(pickTrendGranularity(periodOf(7 * dayMs))).toBe('day');
		expect(pickTrendGranularity(periodOf(90 * dayMs))).toBe('day');
	});

	it('uses weeks above 90 days', () => {
		expect(pickTrendGranularity(periodOf(91 * dayMs))).toBe('week');
		expect(pickTrendGranularity(periodOf(365 * dayMs))).toBe('week');
	});
});

/** DB time (local wall-clock time read as UTC). */
function dbTime(year: number, monthIndex: number, day: number, hours = 0, minutes = 0) {
	return new Date(Date.UTC(year, monthIndex, day, hours, minutes));
}

/** Units since 1900-01-01 00:00, the same index SQL Server's `DATEDIFF(unit, 0, createdAt)` gives. */
const sqlEpoch = Date.UTC(1900, 0, 1);
const hourIndex = (date: Date) => Math.floor((date.getTime() - sqlEpoch) / hourMs);
const dayIndex = (date: Date) => Math.floor((date.getTime() - sqlEpoch) / dayMs);
const weekIndex = (date: Date) => Math.floor(dayIndex(date) / 7);

describe('buildTrendBuckets', () => {
	it('covers a rolling day with hourly buckets and fills hours without records with zeros', () => {
		const period = { from: dbTime(2026, 10, 15, 12, 30), to: dbTime(2026, 10, 16, 12, 30) };
		const rows = [
			{ bucket: hourIndex(dbTime(2026, 10, 15, 12)), isRebuild: false, quantity: 2 },
			{ bucket: hourIndex(dbTime(2026, 10, 16, 8)), isRebuild: false, quantity: 5 },
			{ bucket: hourIndex(dbTime(2026, 10, 16, 8)), isRebuild: true, quantity: 3 }
		];

		const buckets = buildTrendBuckets(period, 'hour', rows);

		// 12:00 on the first day (partial) up to 12:00 on the last day (partial): 25 hours.
		expect(buckets).toHaveLength(25);
		expect(buckets[0]).toEqual({ start: dbTime(2026, 10, 15, 12), scrap: 2, rebuild: 0 });
		expect(buckets[1]).toEqual({ start: dbTime(2026, 10, 15, 13), scrap: 0, rebuild: 0 });
		expect(buckets[20]).toEqual({ start: dbTime(2026, 10, 16, 8), scrap: 5, rebuild: 3 });
		expect(buckets[24]).toEqual({ start: dbTime(2026, 10, 16, 12), scrap: 0, rebuild: 0 });
	});

	it('uses whole calendar days for a custom range', () => {
		const period = { from: dbTime(2026, 9, 1), to: dbTime(2026, 9, 8) };
		const rows = [{ bucket: dayIndex(dbTime(2026, 9, 7)), isRebuild: true, quantity: 4 }];

		const buckets = buildTrendBuckets(period, 'day', rows);

		expect(buckets.map((b) => b.start)).toEqual(
			[1, 2, 3, 4, 5, 6, 7].map((day) => dbTime(2026, 9, day))
		);
		expect(buckets[6]).toEqual({ start: dbTime(2026, 9, 7), scrap: 0, rebuild: 4 });
	});

	it('starts weeks on Monday', () => {
		// Thursday 2026-01-01 up to Thursday 2026-04-30 inclusive.
		const period = { from: dbTime(2026, 0, 1), to: dbTime(2026, 4, 1) };
		const rows = [{ bucket: weekIndex(dbTime(2026, 0, 1)), isRebuild: false, quantity: 7 }];

		const buckets = buildTrendBuckets(period, 'week', rows);

		expect(buckets[0]).toEqual({ start: dbTime(2025, 11, 29), scrap: 7, rebuild: 0 });
		expect(buckets.at(-1)?.start).toEqual(dbTime(2026, 3, 27));
		expect(buckets).toHaveLength(18);
	});

	it('adds up rows of the same bucket and ignores rows outside the period', () => {
		const period = { from: dbTime(2026, 9, 1), to: dbTime(2026, 9, 3) };
		const rows = [
			{ bucket: dayIndex(dbTime(2026, 9, 1)), isRebuild: false, quantity: 1 },
			{ bucket: dayIndex(dbTime(2026, 9, 1)), isRebuild: false, quantity: 2.5 },
			{ bucket: dayIndex(dbTime(2026, 9, 5)), isRebuild: false, quantity: 9 }
		];

		expect(buildTrendBuckets(period, 'day', rows)).toEqual([
			{ start: dbTime(2026, 9, 1), scrap: 3.5, rebuild: 0 },
			{ start: dbTime(2026, 9, 2), scrap: 0, rebuild: 0 }
		]);
	});
});
