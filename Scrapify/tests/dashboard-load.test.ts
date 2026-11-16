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
type IsRebuildRow = { isRebuild: boolean; _sum: { quantity: number | null }; _count: { _all: number } };

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
	prismaMock.partGroup.findMany.mockResolvedValue([]);
	prismaMock.partGroup.count.mockResolvedValue(0);
	prismaMock.partGroupMaterial.count.mockResolvedValue(0);
	prismaMock.partGroup.groupBy.mockResolvedValue([]);
	prismaMock.$queryRaw.mockResolvedValue([{ count: 0 }]);
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

describe('dashboard load: Master data and All-time', () => {
	beforeEach(() => {
		prismaMock.partGroup.groupBy.mockResolvedValue([{ vProject: 'PRJ1' }, { vProject: 'PRJ2' }]);
		prismaMock.partGroup.count.mockResolvedValue(42);
		prismaMock.partGroupMaterial.count.mockResolvedValue(310);
		prismaMock.$queryRaw.mockResolvedValue([{ count: 57 }]);
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

		const [sql, ...values] = prismaMock.$queryRaw.mock.calls[0];
		expect(sql.join('?')).toMatch(/COUNT\(DISTINCT\s+dmc\).*FROM\s+ScrapRecord.*NOT LIKE \?/s);
		expect(values).toEqual(['QNT-SCRAP-%']);
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

describe('dashboard load: project switcher', () => {
	beforeEach(() => {
		prismaMock.partGroup.findMany.mockResolvedValue([
			{ vProject: 'PRJ3' },
			{ vProject: null },
			{ vProject: 'PRJ1' }
		]);
	});

	it('offers the projects with scrap records in the period, sorted by name', async () => {
		const data = await runLoad('range=30d');

		expect(data.projects).toEqual(['PRJ1', 'PRJ3']);
		expect(prismaMock.partGroup.findMany).toHaveBeenCalledWith({
			where: {
				scrapRecords: {
					some: { AND: [{ createdAt: { gte: dbTime(2026, 9, 17, 12, 30), lt: dbNow } }] }
				}
			},
			distinct: ['vProject'],
			select: { vProject: true }
		});
	});

	it('keeps the selected project in the list even without records in the period', async () => {
		const data = await runLoad('project=PRJ2');

		expect(data.projects).toEqual(['PRJ1', 'PRJ2', 'PRJ3']);
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
