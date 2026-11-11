import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const prismaMock = vi.hoisted(() => ({
	scrapRecord: {
		findMany: vi.fn(),
		count: vi.fn(),
		aggregate: vi.fn()
	},
	user: { findUnique: vi.fn() },
	operator: { findMany: vi.fn() },
	partGroup: { findMany: vi.fn() },
	vScrapCodes: { findMany: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/server/cacheVprojects', () => ({ getCachedProjects: vi.fn(async () => ['PRJ1']) }));
vi.mock('@/auth/auth', () => ({
	auth: { api: { getSession: vi.fn(async () => null) } }
}));

import { load } from '../src/routes/(Client)/scrapRecords/+page.server';

type Where = { AND: unknown[] };

async function runLoad(query: string) {
	const url = new URL(`http://localhost/scrapRecords?${query}`);
	const request = new Request(url);
	return load({ url, request } as never);
}

async function expectStatus(query: string, status: number) {
	await expect(runLoad(query)).rejects.toMatchObject({ status });
}

function findManyWhere(): Where {
	return prismaMock.scrapRecord.findMany.mock.calls[0][0].where;
}

/** `where` of every `count` call: [current category, rebuild, scrap, quantity]. */
function countWheres(): Where[] {
	return prismaMock.scrapRecord.count.mock.calls.map((call) => call[0].where);
}

beforeEach(() => {
	vi.clearAllMocks();
	prismaMock.scrapRecord.findMany.mockResolvedValue([]);
	prismaMock.scrapRecord.count.mockResolvedValue(0);
	prismaMock.scrapRecord.aggregate.mockResolvedValue({ _sum: { quantity: null } });
	prismaMock.partGroup.findMany.mockResolvedValue([]);
	prismaMock.vScrapCodes.findMany.mockResolvedValue([]);
	prismaMock.user.findUnique.mockResolvedValue(null);
	prismaMock.operator.findMany.mockResolvedValue([]);
});

describe('scrapRecords load: existing filters', () => {
	it('without filters queries all records, newest first, first page', async () => {
		const data = await runLoad('');
		expect(prismaMock.scrapRecord.findMany).toHaveBeenCalledWith({
			where: { AND: [] },
			include: { partGroup: true },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			skip: 0,
			take: 100
		});
		expect(data).toMatchObject({ category: 'all', totalRecords: 0, canDelete: false });
	});

	it('maps text filters, project and date range (exclusive upper bound +60 s)', async () => {
		await runLoad(
			'dmc=%20ABC%20&scrapCode=S1&partGroup=Bumper&project=PRJ1&createdBy=john' +
				'&dateFrom=2026-01-01T08:00&dateTo=2026-01-02T08:00&page=2'
		);
		const dateTo = new Date('2026-01-02T08:00');
		expect(findManyWhere().AND).toEqual([
			{ dmc: { contains: 'ABC' } },
			{ scrapCode: { contains: 'S1' } },
			{ partGroup: { is: { name: { contains: 'Bumper' } } } },
			{ partGroup: { is: { vProject: 'PRJ1' } } },
			{ createdBy: { contains: 'john' } },
			{
				createdAt: {
					gte: new Date('2026-01-01T08:00'),
					lt: new Date(dateTo.getTime() + 60_000)
				}
			}
		]);
		expect(prismaMock.scrapRecord.findMany.mock.calls[0][0]).toMatchObject({ skip: 100 });
	});

	it('maps otherComponent and exported filters', async () => {
		await runLoad('otherComponent=true&exported=false');
		expect(findManyWhere().AND).toEqual([
			{ isOtherComponent: true },
			{ OR: [{ QADExported: false }, { QADExported: null }] }
		]);
	});

	it('splits categories by quantity scrap label prefix and rebuild flag', async () => {
		await runLoad('category=rebuild&dmc=X');
		const [current, rebuild, scrap, quantity] = countWheres();
		const notQuantity = { NOT: { dmc: { startsWith: 'QNT-SCRAP-' } } };
		expect(rebuild.AND).toEqual([{ dmc: { contains: 'X' } }, notQuantity, { isRebuild: true }]);
		expect(scrap.AND).toEqual([{ dmc: { contains: 'X' } }, notQuantity, { isRebuild: false }]);
		expect(quantity.AND).toEqual([
			{ dmc: { contains: 'X' } },
			{ dmc: { startsWith: 'QNT-SCRAP-' } }
		]);
		expect(current).toEqual(rebuild);
		expect(findManyWhere()).toEqual(rebuild);
	});

	it('maps otherComponent=false and exported=true', async () => {
		await runLoad('otherComponent=false&exported=true');
		expect(findManyWhere().AND).toEqual([{ isOtherComponent: false }, { QADExported: true }]);
	});

	it('quantity category queries only quantity scrap labels, sums use the same where', async () => {
		await runLoad('category=quantity');
		const quantityWhere = { AND: [{ dmc: { startsWith: 'QNT-SCRAP-' } }] };
		expect(findManyWhere()).toEqual(quantityWhere);
		const aggregateWheres = prismaMock.scrapRecord.aggregate.mock.calls.map(
			(call) => call[0].where
		);
		// [current category, rebuild, scrap, quantity]
		expect(aggregateWheres[0]).toEqual(quantityWhere);
		expect(aggregateWheres[3]).toEqual(quantityWhere);
		expect(aggregateWheres).toEqual(countWheres());
	});

	it.each([
		['invalid date', 'dateFrom=not-a-date'],
		['start after end', 'dateFrom=2026-02-01T00:00&dateTo=2026-01-01T00:00'],
		['invalid boolean', 'otherComponent=maybe'],
		['invalid exported', 'exported=1'],
		['invalid category', 'category=other']
	])('rejects %s with 400', async (_name, query) => {
		await expectStatus(query, 400);
	});
});

describe('scrapRecords load: other variant and replacement part filters', () => {
	it('otherVariant=true keeps records with a replacement part', async () => {
		await runLoad('otherVariant=true');
		expect(findManyWhere().AND).toEqual([
			{ replacementPartMaterial: { not: null } },
			{ NOT: { replacementPartMaterial: '' } }
		]);
	});

	it('otherVariant=false keeps records without a replacement part (empty string counts as none)', async () => {
		await runLoad('otherVariant=false');
		expect(findManyWhere().AND).toEqual([
			{ OR: [{ replacementPartMaterial: null }, { replacementPartMaterial: '' }] }
		]);
	});

	it('rejects an invalid otherVariant value with 400', async () => {
		await expectStatus('otherVariant=yes', 400);
	});

	it('replacementPart searches the trimmed part number', async () => {
		await runLoad('replacementPart=%20%2012345%20');
		expect(findManyWhere().AND).toEqual([{ replacementPartMaterial: { contains: '12345' } }]);
	});

	it('new filters also narrow every category summary', async () => {
		await runLoad('otherVariant=false&replacementPart=777');
		const expected = [
			{ OR: [{ replacementPartMaterial: null }, { replacementPartMaterial: '' }] },
			{ replacementPartMaterial: { contains: '777' } }
		];
		for (const where of countWheres()) {
			expect(where.AND.slice(0, 2)).toEqual(expected);
		}
		expect(countWheres()).toHaveLength(4);
	});
});

describe('scrapRecords load: operator names', () => {
	it('maps createdBy card ids of the listed records to operator names', async () => {
		prismaMock.scrapRecord.findMany.mockResolvedValue([
			{ id: 1, createdBy: '106605' },
			{ id: 2, createdBy: '106605' },
			{ id: 3, createdBy: 'admin@firm' }
		]);
		prismaMock.operator.findMany.mockResolvedValue([{ cardId: 106605, fullName: 'Jan Novak' }]);

		const data = await runLoad('');

		expect(prismaMock.operator.findMany).toHaveBeenCalledWith({
			where: { cardId: { in: [106605] } },
			select: { cardId: true, fullName: true }
		});
		expect(data).toMatchObject({ operatorNames: { '106605': 'Jan Novak' } });
	});

	it('skips the operator lookup when no record has a card id', async () => {
		const data = await runLoad('');
		expect(prismaMock.operator.findMany).not.toHaveBeenCalled();
		expect(data).toMatchObject({ operatorNames: {} });
	});
});
