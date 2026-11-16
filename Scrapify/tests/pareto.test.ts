import { describe, expect, it } from 'vitest';
import { buildPareto } from '../src/routes/(Client)/_components/server/pareto';

const row = (key: string, scrap: number, rebuild = 0, detail: string | null = null) => ({
	key,
	label: key || 'No code',
	detail,
	scrap,
	rebuild
});

describe('buildPareto', () => {
	it('has no bars without parts', () => {
		expect(buildPareto({ rows: [], itemCount: 0, totalQuantity: 0 })).toEqual([]);
	});

	it('shares and cumulative shares come from the whole period, not from the listed rows', () => {
		const bars = buildPareto({
			rows: [row('A', 50), row('B', 30, 10)],
			itemCount: 2,
			totalQuantity: 100
		});

		expect(bars).toHaveLength(3); // A, B and the remaining 10 parts as Others
		expect(bars.map((b) => b.percent)).toEqual([50, 40, 10]);
		expect(bars.map((b) => b.cumulativePercent)).toEqual([50, 90, 100]);
	});

	it('adds up scrap and rebuild of a row', () => {
		const [bar] = buildPareto({ rows: [row('A', 30, 12)], itemCount: 1, totalQuantity: 42 });

		expect(bar).toMatchObject({ key: 'A', quantity: 42, percent: 100, cumulativePercent: 100 });
	});

	it('has no Others bar when the rows cover all parts, and ends exactly at 100 %', () => {
		const bars = buildPareto({
			rows: [row('A', 1), row('B', 1), row('C', 1)],
			itemCount: 3,
			totalQuantity: 3
		});

		expect(bars.map((b) => b.key)).toEqual(['A', 'B', 'C']);
		expect(bars.at(-1)?.cumulativePercent).toBe(100);
		expect(bars.some((b) => b.isOthers)).toBe(false);
	});

	it('groups the rest as Others and names how many codes it holds', () => {
		const bars = buildPareto({ rows: [row('A', 10)], itemCount: 6, totalQuantity: 40 });

		expect(bars.at(-1)).toMatchObject({
			isOthers: true,
			label: 'Others',
			detail: '5 more',
			quantity: 30,
			percent: 75,
			cumulativePercent: 100
		});
	});

	it('keeps the code description as the detail and the "No code" row as it is', () => {
		const bars = buildPareto({
			rows: [row('', 5), row('S1', 5, 0, 'Scratch')],
			itemCount: 2,
			totalQuantity: 10
		});

		expect(bars[0]).toMatchObject({ key: '', label: 'No code' });
		expect(bars[1]).toMatchObject({ detail: 'Scratch' });
	});

	it('never goes above 100 % when the listed rows exceed the total (stale data)', () => {
		const bars = buildPareto({ rows: [row('A', 8), row('B', 5)], itemCount: 2, totalQuantity: 10 });

		expect(bars.every((b) => b.cumulativePercent <= 100)).toBe(true);
		expect(bars.at(-1)?.cumulativePercent).toBe(100);
	});
});
