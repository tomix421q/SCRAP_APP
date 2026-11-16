import { describe, expect, it } from 'vitest';
import {
	buildHeatmap,
	heatmapIntensity,
	weekdayOfDbTime
} from '../src/routes/(Client)/_components/server/heatmap';

describe('buildHeatmap', () => {
	it('always has 7 days x 24 hours of empty cells without rows', () => {
		const heatmap = buildHeatmap([]);

		expect(heatmap.cells).toHaveLength(7);
		for (const day of heatmap.cells) {
			expect(day).toHaveLength(24);
			expect(day.every((cell) => cell.quantity === 0 && cell.records === 0)).toBe(true);
		}
		expect(heatmap).toMatchObject({ maxQuantity: 0, totalQuantity: 0, totalRecords: 0 });
	});

	it('adds parts and records of the same cell and keeps the total of all cells', () => {
		const heatmap = buildHeatmap([
			{ weekday: 0, hour: 23, quantity: 5, records: 2 },
			{ weekday: 0, hour: 23, quantity: 3, records: 1 },
			{ weekday: 6, hour: 0, quantity: 4, records: 4 }
		]);

		expect(heatmap.cells[0][23]).toEqual({ quantity: 8, records: 3 });
		expect(heatmap.cells[6][0]).toEqual({ quantity: 4, records: 4 });
		expect(heatmap).toMatchObject({ maxQuantity: 8, totalQuantity: 12, totalRecords: 7 });
	});

	it('leaves out rows outside the 7 x 24 grid', () => {
		const heatmap = buildHeatmap([
			{ weekday: 7, hour: 1, quantity: 9, records: 1 },
			{ weekday: 1, hour: 24, quantity: 9, records: 1 },
			{ weekday: -1, hour: 3, quantity: 9, records: 1 },
			{ weekday: 2, hour: 1.5, quantity: 9, records: 1 }
		]);

		expect(heatmap.totalQuantity).toBe(0);
	});
});

describe('weekdayOfDbTime', () => {
	it('counts days from Monday = 0, like DATEDIFF(DAY, 0, value) % 7 in SQL Server', () => {
		// 2026-11-16 is a Monday, 2026-11-22 a Sunday.
		expect(weekdayOfDbTime(new Date(Date.UTC(2026, 10, 16, 0, 0)))).toBe(0);
		expect(weekdayOfDbTime(new Date(Date.UTC(2026, 10, 22, 23, 59)))).toBe(6);
	});

	it('keeps 23:59 on its own day across a DST change (DB time has no DST)', () => {
		// Europe/Bratislava switched to winter time on 2026-10-25 (Sunday), a 25-hour local day.
		expect(weekdayOfDbTime(new Date(Date.UTC(2026, 9, 25, 23, 59)))).toBe(6);
		expect(weekdayOfDbTime(new Date(Date.UTC(2026, 9, 26, 0, 0)))).toBe(0);
	});
});

describe('heatmapIntensity', () => {
	it('is 0 for empty cells and for an empty grid', () => {
		expect(heatmapIntensity(0, 10)).toBe(0);
		expect(heatmapIntensity(0, 0)).toBe(0);
	});

	it('scales linearly to 1 at the maximum', () => {
		expect(heatmapIntensity(10, 10)).toBe(1);
		expect(heatmapIntensity(5, 10, 0)).toBeCloseTo(0.5);
	});

	it('keeps a non-empty cell visible above a minimum opacity', () => {
		expect(heatmapIntensity(1, 1000)).toBeCloseTo(0.15);
		expect(heatmapIntensity(1, 1000, 0.3)).toBeCloseTo(0.3);
	});

	it('never exceeds 1', () => {
		expect(heatmapIntensity(20, 10)).toBe(1);
	});
});
