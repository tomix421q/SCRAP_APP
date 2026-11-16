import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A zone with an offset (and DST), so local vs. DB time differences actually show up.
vi.hoisted(() => {
	process.env.TZ = 'Europe/Bratislava';
});

// Prisma is fully mocked: these tests must never touch a real database.
const prismaMock = vi.hoisted(() => ({
	scrapRecord: { groupBy: vi.fn(), aggregate: vi.fn() },
	partGroup: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
	partGroupMaterial: { count: vi.fn() },
	$queryRaw: vi.fn()
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/server/cacheVprojects', () => ({
	getCachedProjects: vi.fn(async () => ['PRJ1', 'PRJ2', 'PRJ3'])
}));

type GroupByArgs = {
	by: string[];
	where: { AND: Record<string, unknown>[] };
};
type IsRebuildRow = {
	isRebuild: boolean;
	_sum: { quantity: number | null };
	_count: { _all: number };
};

/**
 * The DB stores local wall-clock time (GETDATE()) that Prisma reads as UTC, so a local
 * 12:30 is queried as 12:30 UTC.
 */
function dbTime(year: number, monthIndex: number, day: number, hours = 0, minutes = 0) {
	return new Date(Date.UTC(year, monthIndex, day, hours, minutes));
}

const now = new Date(2026, 10, 16, 12, 30);
const dbNow = dbTime(2026, 10, 16, 12, 30);
const weekAgo = dbTime(2026, 10, 9, 12, 30);
const twoWeeksAgo = dbTime(2026, 10, 2, 12, 30);

/** Rows the `isRebuild` groupBy returns, by the start of the queried period. */
let totalsByPeriodStart: Map<number, IsRebuildRow[]>;
/** Rows the trend query returns and the distinct label count. */
let trendRows: { bucket: number; isRebuild: boolean; quantity: number }[];
let labelCount: number;
/** Rows of the ranking queries by their GROUP BY clause. */
let projectRows: unknown[];
let partGroupRows: unknown[];
let scrapCodeRows: unknown[];

type RawCall = [{ sql: string; values: unknown[] } | TemplateStringsArray, ...unknown[]];

/** SQL text of a `$queryRaw` call, as a tagged template or as one `Prisma.sql` query. */
function rawSql(call: RawCall): { sql: string; values: unknown[] } {
	const [first, ...rest] = call;
	return 'sql' in first ? first : { sql: first.join('?'), values: rest };
}

function rawCalls() {
	return prismaMock.$queryRaw.mock.calls.map((call) => rawSql(call as RawCall));
}

function rankingCall(groupBy: string) {
	const call = rawCalls().find((c) => c.sql.includes(groupBy));
	if (!call) throw new Error(`No query with ${groupBy}`);
	return call;
}

function trendCalls() {
	return rawCalls().filter((call) => call.sql.includes('DATEDIFF'));
}

function row(isRebuild: boolean, quantity: number, records: number): IsRebuildRow {
	return { isRebuild, _sum: { quantity }, _count: { _all: records } };
}

function periodStart(args: GroupByArgs): number {
	const createdAt = args.where.AND.find((c) => 'createdAt' in c)?.createdAt as { gte: Date };
	return createdAt.gte.getTime();
}

function totalsCalls(): GroupByArgs[] {
	return prismaMock.scrapRecord.groupBy.mock.calls
		.map((call) => call[0] as GroupByArgs)
		.filter((args) => args.by.includes('isRebuild'));
}

async function runLoad(query: string) {
	// Fresh module per test, so the 60 s result cache never leaks between tests.
	const { load } = await import('../src/routes/(Client)/+page.server');
	const url = new URL(`http://localhost/?${query}`);
	return load({ url } as never) as Promise<Record<string, unknown>>;
}

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(now);
	totalsByPeriodStart = new Map();
	prismaMock.scrapRecord.groupBy.mockImplementation(async (args: GroupByArgs) =>
		args.by.includes('isRebuild') ? (totalsByPeriodStart.get(periodStart(args)) ?? []) : []
	);
	prismaMock.scrapRecord.aggregate.mockResolvedValue({
		_sum: { quantity: null },
		_count: { _all: 0 },
		_min: { createdAt: null }
	});
	prismaMock.partGroup.count.mockResolvedValue(0);
	prismaMock.partGroupMaterial.count.mockResolvedValue(0);
	prismaMock.partGroup.groupBy.mockResolvedValue([]);
	trendRows = [];
	labelCount = 0;
	projectRows = [];
	partGroupRows = [];
	scrapCodeRows = [];
	prismaMock.$queryRaw.mockImplementation(async (...call: RawCall) => {
		const { sql } = rawSql(call);
		if (sql.includes('DATEDIFF')) return trendRows;
		if (sql.includes('GROUP BY pg.vProject')) return projectRows;
		if (sql.includes('GROUP BY pg.id')) return partGroupRows;
		if (sql.includes('GROUP BY ISNULL')) return scrapCodeRows;
		return [{ count: labelCount }];
	});
});

afterEach(() => {
	vi.useRealTimers();
});

describe('dashboard load: Total parts', () => {
	it('splits parts into scrap (isRebuild = false) and rebuild for the period and project', async () => {
		totalsByPeriodStart.set(weekAgo.getTime(), [row(false, 30, 12), row(true, 10, 4)]);

		const data = await runLoad('project=PRJ1');

		expect(data.totals).toMatchObject({
			quantity: 40,
			scrapQuantity: 30,
			rebuildQuantity: 10,
			records: 16
		});
		expect(totalsCalls()[0].where.AND).toEqual([
			{ createdAt: { gte: weekAgo, lt: dbNow } },
			{ partGroup: { is: { vProject: 'PRJ1' } } }
		]);
	});

	it('compares parts with the equally long previous period of the same project', async () => {
		totalsByPeriodStart.set(weekAgo.getTime(), [row(false, 30, 3)]);
		totalsByPeriodStart.set(twoWeeksAgo.getTime(), [row(false, 16, 2), row(true, 8, 1)]);

		const data = await runLoad('project=PRJ1');

		expect(data.totals).toMatchObject({ quantity: 30, changePercent: 25 });
		expect(totalsCalls()[1].where.AND).toEqual([
			{ createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
			{ partGroup: { is: { vProject: 'PRJ1' } } }
		]);
	});

	it('shows no change when the previous period has no data', async () => {
		totalsByPeriodStart.set(weekAgo.getTime(), [row(false, 30, 3)]);

		const data = await runLoad('');

		expect(data.totals).toMatchObject({ quantity: 30, changePercent: null });
	});
});

describe('dashboard load: Trend', () => {
	const hourMs = 60 * 60 * 1000;
	/** Whole hours since 1900-01-01 00:00, the index `DATEDIFF(HOUR, 0, createdAt)` gives. */
	const hourIndex = (date: Date) => Math.round((date.getTime() - Date.UTC(1900, 0, 1)) / hourMs);

	it('sums parts per local hour for 1 day, split into scrap and rebuild, with empty hours as zeros', async () => {
		trendRows = [
			{ bucket: hourIndex(dbTime(2026, 10, 16, 8)), isRebuild: false, quantity: 5 },
			{ bucket: hourIndex(dbTime(2026, 10, 16, 8)), isRebuild: true, quantity: 3 }
		];

		const data = await runLoad('range=1d');
		const trend = data.trend as { granularity: string; buckets: unknown[] };

		expect(trend.granularity).toBe('hour');
		// 12:00 yesterday (partial) up to 12:00 today (partial).
		expect(trend.buckets).toHaveLength(25);
		expect(trend.buckets[20]).toEqual({ start: dbTime(2026, 10, 16, 8), scrap: 5, rebuild: 3 });
		expect(trend.buckets[19]).toEqual({ start: dbTime(2026, 10, 16, 7), scrap: 0, rebuild: 0 });
		expect(trendCalls()[0].sql).toMatch(/DATEDIFF\(HOUR, 0, sr\.createdAt\)/);
	});

	it('uses the same period and project as Total parts, in local DB time', async () => {
		await runLoad('project=PRJ1');

		const [query] = trendCalls();
		expect(query.sql).toMatch(/DATEDIFF\(DAY, 0, sr\.createdAt\)/);
		expect(query.sql).toMatch(/pg\.vProject = \?/);
		expect(query.values).toEqual(['PRJ1', '2026-11-09T12:30:00.000', '2026-11-16T12:30:00.000']);
	});

	it('covers every project without a project filter', async () => {
		await runLoad('');

		const [query] = trendCalls();
		expect(query.sql).not.toMatch(/vProject/);
		expect(query.values).toEqual(['2026-11-09T12:30:00.000', '2026-11-16T12:30:00.000']);
	});

	it('uses weeks starting on Monday for a custom range over 90 days', async () => {
		const data = await runLoad('range=custom&from=2026-01-01&to=2026-06-30');
		const trend = data.trend as { granularity: string; buckets: { start: Date }[] };

		expect(trend.granularity).toBe('week');
		expect(trend.buckets[0].start).toEqual(dbTime(2025, 11, 29));
		expect(trendCalls()[0].sql).toMatch(/DATEDIFF\(DAY, 0, sr\.createdAt\) \/ 7/);
		expect(trendCalls()[0].values).toEqual(['2026-01-01T00:00:00.000', '2026-07-01T00:00:00.000']);
	});
});

describe('dashboard load: Master data and All-time', () => {
	beforeEach(() => {
		prismaMock.partGroup.groupBy.mockResolvedValue([{ vProject: 'PRJ1' }, { vProject: 'PRJ2' }]);
		prismaMock.partGroup.count.mockResolvedValue(42);
		prismaMock.partGroupMaterial.count.mockResolvedValue(310);
		labelCount = 57;
		prismaMock.scrapRecord.aggregate.mockResolvedValue({
			_sum: { quantity: 9800 },
			_count: { _all: 4100 },
			_min: { createdAt: new Date(2024, 0, 15, 7, 0) }
		});
	});

	it('counts master data and all-time records', async () => {
		const data = await runLoad('');

		expect(data.masterData).toEqual({ projects: 2, partGroups: 42, partNumbers: 310, labels: 57 });
		expect(data.allTime).toEqual({
			quantity: 9800,
			records: 4100,
			firstRecordAt: new Date(2024, 0, 15, 7, 0)
		});
	});

	it('ignores the project and range filters', async () => {
		await runLoad('project=PRJ1&range=custom&from=2026-01-01&to=2026-01-31');

		expect(prismaMock.partGroup.groupBy).toHaveBeenCalledWith({
			by: ['vProject'],
			where: { vProject: { not: null } }
		});
		expect(prismaMock.partGroup.count).toHaveBeenCalledWith();
		expect(prismaMock.partGroupMaterial.count).toHaveBeenCalledWith();
		expect(prismaMock.scrapRecord.aggregate).toHaveBeenCalledWith({
			_sum: { quantity: true },
			_count: { _all: true },
			_min: { createdAt: true }
		});
	});

	it('counts projects that have part groups, not every project in QAD', async () => {
		prismaMock.partGroup.groupBy.mockResolvedValue([{ vProject: 'PRJ1' }, { vProject: '' }]);

		const data = await runLoad('');

		expect(data.masterData).toMatchObject({ projects: 1 });
	});

	it('counts labels as distinct scanned DMC codes without quantity scrap labels', async () => {
		await runLoad('project=PRJ1');

		const labels = rawCalls().find((call) => call.sql.includes('COUNT(DISTINCT'));
		expect(labels?.sql).toMatch(/COUNT\(DISTINCT\s+dmc\).*FROM\s+ScrapRecord.*NOT LIKE \?/s);
		expect(labels?.values).toEqual(['QNT-SCRAP-%']);
	});

	it('an empty database has no first record and zero parts', async () => {
		prismaMock.scrapRecord.aggregate.mockResolvedValue({
			_sum: { quantity: null },
			_count: { _all: 0 },
			_min: { createdAt: null }
		});

		const data = await runLoad('');

		expect(data.allTime).toEqual({ quantity: 0, records: 0, firstRecordAt: null });
	});
});

describe('dashboard load: Projects tile and project switcher', () => {
	beforeEach(() => {
		projectRows = [
			{ key: 'PRJ3', label: 'PRJ3', detail: null, scrap: 20, rebuild: 5 },
			{ key: 'PRJ1', label: 'PRJ1', detail: null, scrap: '8', rebuild: null }
		];
	});

	it('ranks projects with scrap in the period by parts, scrap and rebuild apart', async () => {
		const data = await runLoad('range=30d');

		expect((data.rankings as { projects: { rows: unknown[] } }).projects.rows).toEqual([
			{ key: 'PRJ3', label: 'PRJ3', detail: null, scrap: 20, rebuild: 5 },
			{ key: 'PRJ1', label: 'PRJ1', detail: null, scrap: 8, rebuild: 0 }
		]);
		const query = rankingCall('GROUP BY pg.vProject');
		expect(query.sql).toMatch(/ORDER BY SUM\(sr\.quantity\) DESC/);
		expect(query.values).toEqual(['2026-10-17T12:30:00.000', '2026-11-16T12:30:00.000']);
	});

	it('ignores the project filter, so the other projects stay comparable', async () => {
		await runLoad('project=PRJ1');

		const query = rankingCall('GROUP BY pg.vProject');
		expect(query.sql).not.toMatch(/pg\.vProject = \?/);
		expect(query.values).toEqual(['2026-11-09T12:30:00.000', '2026-11-16T12:30:00.000']);
	});

	it('offers the same projects in the switcher, sorted by name', async () => {
		const data = await runLoad('range=30d');

		expect(data.projects).toEqual(['PRJ1', 'PRJ3']);
	});

	it('keeps the selected project in the switcher even without records in the period', async () => {
		const data = await runLoad('project=PRJ2');

		expect(data.projects).toEqual(['PRJ1', 'PRJ2', 'PRJ3']);
		expect((data.rankings as { projects: { rows: unknown[] } }).projects.rows).toHaveLength(2);
	});

	it('returns the parsed filters for the page controls', async () => {
		const data = await runLoad('range=custom&from=2026-03-01&to=2026-03-10&project=PRJ1');

		expect(data.filters).toEqual({
			range: 'custom',
			project: 'PRJ1',
			from: '2026-03-01',
			to: '2026-03-10'
		});
	});
});

describe('dashboard load: Top part groups and Top scrap codes', () => {
	it('takes the top 10 part groups of the period and project', async () => {
		partGroupRows = [{ key: 7, label: 'Door', detail: 'PRJ1', scrap: 12, rebuild: 3 }];

		const data = await runLoad('project=PRJ1');

		expect((data.rankings as { partGroups: { rows: unknown[] } }).partGroups.rows).toEqual([
			{ key: '7', label: 'Door', detail: 'PRJ1', scrap: 12, rebuild: 3 }
		]);
		const query = rankingCall('GROUP BY pg.id');
		expect(query.sql).toMatch(/pg\.vProject = \?/);
		expect(query.values).toEqual([
			10,
			'2026-11-09T12:30:00.000',
			'2026-11-16T12:30:00.000',
			'PRJ1'
		]);
	});

	it('takes the top 10 scrap codes with their description', async () => {
		scrapCodeRows = [{ key: 'S12', label: 'S12', detail: 'Scratch', scrap: 9, rebuild: 1 }];

		const data = await runLoad('');

		expect((data.rankings as { scrapCodes: { rows: unknown[] } }).scrapCodes.rows).toEqual([
			{ key: 'S12', label: 'S12', detail: 'Scratch', scrap: 9, rebuild: 1 }
		]);
		expect(rankingCall('GROUP BY ISNULL').values[0]).toBe(10);
	});

	it('groups records without a scrap code as "No code"', async () => {
		await runLoad('');

		expect(rankingCall('GROUP BY ISNULL').sql).toMatch(/'No code'/);
	});
});

describe('dashboard load: detail dialogs', () => {
	type Rankings = Record<
		'projects' | 'partGroups' | 'scrapCodes',
		{ itemCount: number; totalQuantity: number }
	>;

	it('counts all items of a ranking and bases the shares on the whole period', async () => {
		totalsByPeriodStart.set(weekAgo.getTime(), [row(false, 100, 10), row(true, 20, 2)]);
		projectRows = [
			{ key: 'PRJ1', label: 'PRJ1', detail: null, scrap: 60, rebuild: 10 },
			{ key: 'PRJ2', label: 'PRJ2', detail: null, scrap: 40, rebuild: 10 }
		];
		partGroupRows = [
			{ key: 1, label: 'Door', detail: 'PRJ1', scrap: 5, rebuild: 0, itemCount: 37 }
		];
		scrapCodeRows = [{ key: 'S1', label: 'S1', detail: null, scrap: 5, rebuild: 0, itemCount: 12 }];

		const rankings = (await runLoad('')).rankings as Rankings;

		expect(rankings.projects).toMatchObject({ itemCount: 2, totalQuantity: 120 });
		expect(rankings.partGroups).toMatchObject({ itemCount: 37, totalQuantity: 120 });
		expect(rankings.scrapCodes).toMatchObject({ itemCount: 12, totalQuantity: 120 });
		expect(rankingCall('GROUP BY pg.id').sql).toMatch(/COUNT\(\*\) OVER \(\)/);
	});

	it('links to scrap records with the same period and project', async () => {
		const data = await runLoad('project=PRJ1');

		expect(data.scrapRecordsQuery).toBe(
			'dateFrom=2026-11-09T12%3A30&dateTo=2026-11-16T12%3A29&project=PRJ1'
		);
	});

	it('links a custom range from midnight to the last minute of the last day', async () => {
		const data = await runLoad('range=custom&from=2026-03-01&to=2026-03-10');

		expect(data.scrapRecordsQuery).toBe('dateFrom=2026-03-01T00%3A00&dateTo=2026-03-10T23%3A59');
	});
});

describe('dashboard load: invalid filters', () => {
	it.each([
		['an unknown project', 'project=NOPE'],
		['an unknown range', 'range=1y'],
		['a custom range without dates', 'range=custom']
	])('rejects %s with 400 before querying the database', async (_name, query) => {
		await expect(runLoad(query)).rejects.toMatchObject({ status: 400 });
		expect(prismaMock.scrapRecord.groupBy).not.toHaveBeenCalled();
	});
});

describe('dashboard load: 60 s cache', () => {
	function totalsQueryCount() {
		return totalsCalls().length;
	}

	it('serves the same filters from the cache for 60 s, then queries again', async () => {
		const { load } = await import('../src/routes/(Client)/+page.server');
		const run = (query: string) => load({ url: new URL(`http://localhost/?${query}`) } as never);

		await run('project=PRJ1');
		expect(totalsQueryCount()).toBe(2); // current + previous period

		vi.setSystemTime(new Date(now.getTime() + 59_000));
		await run('project=PRJ1');
		expect(totalsQueryCount()).toBe(2);

		vi.setSystemTime(new Date(now.getTime() + 61_000));
		await run('project=PRJ1');
		expect(totalsQueryCount()).toBe(4);
	});

	it('keeps different filters apart', async () => {
		const { load } = await import('../src/routes/(Client)/+page.server');
		const run = (query: string) => load({ url: new URL(`http://localhost/?${query}`) } as never);

		await run('project=PRJ1');
		await run('project=PRJ2');
		await run('range=custom&from=2026-03-01&to=2026-03-10');
		await run('range=custom&from=2026-03-01&to=2026-03-11');

		expect(totalsQueryCount()).toBe(8);
	});

	it('does not keep a failed query in the cache', async () => {
		const { load } = await import('../src/routes/(Client)/+page.server');
		const run = () => load({ url: new URL('http://localhost/') } as never);
		prismaMock.partGroupMaterial.count.mockRejectedValueOnce(new Error('connection lost'));

		await expect(run()).rejects.toThrow('connection lost');
		await expect(run()).resolves.toBeDefined();
	});
});
