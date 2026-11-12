import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma is fully mocked: these tests must never touch a real database.
const prismaMock = vi.hoisted(() => ({
	scrapRecord: { findMany: vi.fn() },
	labelGroup: { findMany: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));

import { actions } from '../src/routes/(Client)/scandmclabel/+page.server';

async function runHistory(operator: string | null) {
	const body = new FormData();
	if (operator !== null) body.set('operator', operator);
	const request = new Request('http://localhost/scandmclabel?/history', { method: 'POST', body });
	return actions.history({ request } as never);
}

function findManyArgs() {
	return prismaMock.scrapRecord.findMany.mock.calls[0][0];
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	// Local wall-clock time; the DB stores local time (GETDATE()) that Prisma reads as UTC.
	vi.setSystemTime(new Date(2026, 10, 12, 10, 30));
	prismaMock.scrapRecord.findMany.mockResolvedValue([]);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('scandmclabel history action: query', () => {
	it("loads only the operator's records since local midnight, newest first, capped at 200", async () => {
		await runHistory(' 4321 ');
		expect(findManyArgs()).toMatchObject({
			where: { createdBy: '4321', createdAt: { gte: new Date(Date.UTC(2026, 10, 12)) } },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			take: 201
		});
	});

	it('returns rows with time, derived mode, reason, quantity and QAD state', async () => {
		const base = { scrapCode: null, scrapCodeDescription: null, isOtherComponent: false };
		prismaMock.scrapRecord.findMany.mockResolvedValue([
			{
				...base,
				id: 3,
				dmc: 'QNT-SCRAP-LINE1',
				createdAt: new Date('2026-11-12T10:05:42Z'),
				isRebuild: false,
				scrapCode: 'S1',
				scrapCodeDescription: 'Scratch',
				replacementPartMaterial: 'MAT-9',
				quantity: 4,
				QADExported: true,
				partGroup: { interfaceName: 'Bumper' }
			},
			{
				...base,
				id: 2,
				dmc: 'DMC-2',
				createdAt: new Date('2026-11-12T09:00:00Z'),
				isRebuild: true,
				isOtherComponent: true,
				replacementPartMaterial: '',
				quantity: 1,
				QADExported: null,
				partGroup: { interfaceName: 'Grill' }
			},
			{
				...base,
				id: 1,
				dmc: 'DMC-1',
				createdAt: new Date('2026-11-12T07:15:00Z'),
				isRebuild: false,
				replacementPartMaterial: 'MAT-1',
				quantity: 1,
				QADExported: false,
				partGroup: { interfaceName: 'Grill' }
			}
		]);

		expect(await runHistory('4321')).toEqual({
			success: true,
			message: expect.any(String),
			limitReached: false,
			entries: [
				{
					id: 3,
					time: '10:05',
					dmc: 'QNT-SCRAP-LINE1',
					partGroupName: 'Bumper',
					mode: 'Quantity scrap',
					scrapCode: 'S1',
					scrapCodeDescription: 'Scratch',
					isOtherComponent: false,
					replacementPartMaterial: 'MAT-9',
					quantity: 4,
					qadExported: true,
					otherReasons: [],
					related: []
				},
				{
					id: 2,
					time: '09:00',
					dmc: 'DMC-2',
					partGroupName: 'Grill',
					mode: 'Rebuild',
					scrapCode: null,
					scrapCodeDescription: null,
					isOtherComponent: true,
					replacementPartMaterial: null,
					quantity: 1,
					qadExported: false,
					otherReasons: [],
					related: []
				},
				{
					id: 1,
					time: '07:15',
					dmc: 'DMC-1',
					partGroupName: 'Grill',
					mode: 'Scrap',
					scrapCode: null,
					scrapCodeDescription: null,
					isOtherComponent: false,
					replacementPartMaterial: 'MAT-1',
					quantity: 1,
					qadExported: false,
					otherReasons: [],
					related: []
				}
			]
		});
	});

	it('groups one rebuild save: records with a reason shown, flag-only records hidden in related', async () => {
		const savedAt = new Date('2026-11-12T09:30:00Z');
		const record = (
			id: number,
			dmc: string,
			createdAt: Date,
			isRebuild: boolean,
			reason: { scrapCode?: string; isOtherComponent?: boolean }
		) => ({
			id,
			dmc,
			createdAt,
			isRebuild,
			scrapCode: reason.scrapCode ?? null,
			scrapCodeDescription: null,
			isOtherComponent: reason.isOtherComponent ?? false,
			replacementPartMaterial: null,
			quantity: 1,
			QADExported: false,
			partGroup: { interfaceName: `Group-${id}` }
		});
		prismaMock.scrapRecord.findMany.mockResolvedValue([
			record(12, 'DMC-R', savedAt, true, { isOtherComponent: true }),
			record(11, 'DMC-R', savedAt, true, { scrapCode: 'R1' }),
			record(10, 'DMC-R', savedAt, true, { isOtherComponent: true }),
			record(13, 'DMC-R', savedAt, true, { scrapCode: 'R3' }),
			record(9, 'DMC-R', new Date('2026-11-12T09:10:00Z'), true, { scrapCode: 'R2' }),
			record(8, 'DMC-S', savedAt, false, { scrapCode: 'S1' }),
			record(7, 'DMC-S', savedAt, false, { isOtherComponent: true })
		]);

		const result = (await runHistory('4321')) as {
			entries: { id: number; otherReasons: { id: number }[]; related: { id: number }[] }[];
		};
		const ids = (records: { id: number }[]) => records.map((record) => record.id);
		expect(
			result.entries.map((entry) => [entry.id, ids(entry.otherReasons), ids(entry.related)])
		).toEqual([
			[11, [13], [12, 10]],
			[9, [], []],
			[8, [], []],
			[7, [], []]
		]);
	});

	it.each([
		[200, 200, false],
		[201, 200, true]
	])(
		'with %i matching rows shows %i and flags the cap only when rows were cut off',
		async (found, shown, limitReached) => {
			prismaMock.scrapRecord.findMany.mockResolvedValue(
				Array.from({ length: found }, (_, index) => ({
					id: index,
					dmc: `DMC-${index}`,
					createdAt: new Date('2026-11-12T08:00:00Z'),
					isRebuild: false,
					scrapCode: 'S1',
					scrapCodeDescription: null,
					isOtherComponent: false,
					replacementPartMaterial: null,
					quantity: 1,
					QADExported: false,
					partGroup: { interfaceName: 'Grill' }
				}))
			);
			const result = await runHistory('4321');
			expect(result).toMatchObject({ success: true, limitReached });
			expect((result as { entries: unknown[] }).entries).toHaveLength(shown);
		}
	);

	it('uses the local calendar day right after midnight', async () => {
		vi.setSystemTime(new Date(2026, 10, 13, 0, 30));
		await runHistory('4321');
		expect(findManyArgs().where.createdAt).toEqual({ gte: new Date(Date.UTC(2026, 10, 13)) });
	});
});

describe('scandmclabel history action: errors', () => {
	it.each([null, '', 'abc', '0', '-5', '1.5', '1e3', '0x10'])(
		'rejects invalid card ID %j with 400 without querying',
		async (operator) => {
			expect(await runHistory(operator)).toMatchObject({
				status: 400,
				data: { success: false }
			});
			expect(prismaMock.scrapRecord.findMany).not.toHaveBeenCalled();
		}
	);

	it('returns 500 with a message when the DB fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		prismaMock.scrapRecord.findMany.mockRejectedValue(new Error('DB down'));
		expect(await runHistory('4321')).toMatchObject({
			status: 500,
			data: { success: false, message: expect.any(String), error: expect.any(String) }
		});
	});
});
