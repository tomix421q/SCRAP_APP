import { describe, expect, it } from 'vitest';
import { parseDashboardFilters } from '../src/lib/utils/dashboardFilters';

const now = new Date(2026, 10, 16, 12, 30); // 16 Nov 2026 12:30 local time

function parse(query: string) {
	return parseDashboardFilters(new URLSearchParams(query), now);
}

describe('parseDashboardFilters: rolling ranges', () => {
	it('defaults to the last 7 days without a project', () => {
		const filters = parse('');
		expect(filters.range).toBe('7d');
		expect(filters.project).toBeUndefined();
		expect(filters.period).toEqual({ from: new Date(2026, 10, 9, 12, 30), to: now });
	});

	it('1 day and 30 days end now; the previous period has the same length right before', () => {
		expect(parse('range=1d')).toMatchObject({
			range: '1d',
			period: { from: new Date(2026, 10, 15, 12, 30), to: now },
			previousPeriod: { from: new Date(2026, 10, 14, 12, 30), to: new Date(2026, 10, 15, 12, 30) }
		});
		expect(parse('range=30d')).toMatchObject({
			range: '30d',
			period: { from: new Date(2026, 9, 17, 12, 30), to: now },
			previousPeriod: { from: new Date(2026, 8, 17, 12, 30), to: new Date(2026, 9, 17, 12, 30) }
		});
	});

	it('takes a trimmed project name; an empty one means all projects', () => {
		expect(parse('project=%20X540%20').project).toBe('X540');
		expect(parse('project=').project).toBeUndefined();
	});

	it('rejects an unknown range with 400', () => {
		expect(() => parse('range=90d')).toThrow(expect.objectContaining({ status: 400 }));
	});
});

describe('parseDashboardFilters: custom range', () => {
	it('covers whole days, `to` included; the previous period is as many days before', () => {
		expect(parse('range=custom&from=2026-03-01&to=2026-03-10')).toMatchObject({
			range: 'custom',
			period: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 11) },
			previousPeriod: { from: new Date(2026, 1, 19), to: new Date(2026, 2, 1) }
		});
	});

	it('a single day is allowed', () => {
		expect(parse('range=custom&from=2026-03-01&to=2026-03-01').period).toEqual({
			from: new Date(2026, 2, 1),
			to: new Date(2026, 2, 2)
		});
	});

	it('allows at most one year', () => {
		expect(parse('range=custom&from=2025-01-01&to=2025-12-31').period.to).toEqual(
			new Date(2026, 0, 1)
		);
		expect(() => parse('range=custom&from=2025-01-01&to=2026-01-01')).toThrow(
			expect.objectContaining({ status: 400 })
		);
	});

	it.each([
		['missing dates', 'range=custom'],
		['missing to', 'range=custom&from=2026-03-01'],
		['not a date', 'range=custom&from=abc&to=2026-03-01'],
		['impossible day', 'range=custom&from=2026-02-30&to=2026-03-01'],
		['from after to', 'range=custom&from=2026-03-02&to=2026-03-01']
	])('rejects %s with 400', (_name, query) => {
		expect(() => parse(query)).toThrow(expect.objectContaining({ status: 400 }));
	});
});
