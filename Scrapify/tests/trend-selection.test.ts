import { describe, expect, it } from 'vitest';
import {
	formatTrendSelection,
	parseTrendSelection
} from '../src/routes/(Client)/_components/server/trendSelection';

describe('parseTrendSelection', () => {
	it('has no selection without the parameter', () => {
		expect(parseTrendSelection(null)).toBeUndefined();
		expect(parseTrendSelection('')).toBeUndefined();
	});

	it('parses a part group id and a scrap code', () => {
		expect(parseTrendSelection('partGroup:12')).toEqual({ kind: 'partGroup', id: 12 });
		expect(parseTrendSelection('scrapCode:S12')).toEqual({ kind: 'scrapCode', code: 'S12' });
	});

	it('keeps colons inside a scrap code', () => {
		expect(parseTrendSelection('scrapCode:A:1')).toEqual({ kind: 'scrapCode', code: 'A:1' });
	});

	it.each([
		'partGroup',
		'partGroup:',
		'partGroup:0',
		'partGroup:-3',
		'partGroup:1.5',
		'partGroup:abc',
		'partGroup:99999999999',
		'scrapCode:',
		'scrapCode:   ',
		`scrapCode:${'x'.repeat(51)}`,
		'project:PRJ1',
		'12'
	])('rejects %j with a 400 error', (value) => {
		expect(() => parseTrendSelection(value)).toThrowError(
			expect.objectContaining({ status: 400 })
		);
	});

	it('round-trips through formatTrendSelection', () => {
		for (const value of ['partGroup:7', 'scrapCode:S12']) {
			expect(formatTrendSelection(parseTrendSelection(value)!)).toBe(value);
		}
	});
});
