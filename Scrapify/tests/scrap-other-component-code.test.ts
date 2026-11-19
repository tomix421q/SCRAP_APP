import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma is fully mocked: these tests must never touch a real database.
const prismaMock = vi.hoisted(() => ({
	labelGroup: { findMany: vi.fn() },
	operator: { findUnique: vi.fn() },
	user: { findUnique: vi.fn() },
	scrapRecord: { createMany: vi.fn(), findFirst: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));

import { actions } from '../src/routes/(Client)/scandmclabel/+page.server';

const MAIN_CARRIER = 10;
const MIDDFIELD = 11;
const BELTLINE = 12;
const MA_POCKET = 13;
const FLAGGED = 14;

const code = (code: string, description: string, isOtherComponent = false) => ({
	code,
	description,
	isOtherComponent
});

const dmcLabel = {
	id: 1,
	code: 'ABC*',
	groups: [
		{
			id: MAIN_CARRIER,
			qadIdentity: 'QAD1',
			isRebuild: true,
			materials: [],
			scrapCodes: [code('SA100', 'Scratch'), code('SA850', 'Carrier damaged', true)]
		},
		{
			id: MIDDFIELD,
			qadIdentity: 'QAD1',
			isRebuild: true,
			materials: [],
			scrapCodes: [code('SA200', 'Bent'), code('SA860', 'Middfield damaged', true)]
		},
		{
			id: BELTLINE,
			qadIdentity: 'QAD1',
			isRebuild: false,
			materials: [],
			scrapCodes: [code('SA300', 'Torn')]
		},
		{
			id: MA_POCKET,
			qadIdentity: 'QAD1',
			isRebuild: false,
			materials: [],
			scrapCodes: [code('SA400', 'Dent')]
		},
		{
			id: FLAGGED,
			qadIdentity: 'QAD1',
			isRebuild: true,
			cannotBeMainReason: true,
			interfaceName: 'Flagged group',
			materials: [{ material: 'PN1' }],
			scrapCodes: [code('SA500', 'Chipped')]
		}
	]
};

function row(groupId: number, extra: Record<string, unknown> = {}) {
	return { groupId, groupName: `Group ${groupId}`, ...extra };
}

function saveScrap(isRebuild: boolean, rows: unknown[], dmc = 'ABC123') {
	const body = new FormData();
	body.set('dmc', dmc);
	body.set('isRebuild', String(isRebuild));
	body.set('operator', '4321');
	body.set('scrapPayload', JSON.stringify(rows));
	const request = new Request('http://localhost/scandmclabel?/saveScrap', { method: 'POST', body });
	return actions.saveScrap({ request } as never);
}

type SavedRecord = {
	partGroupId: number;
	scrapCode: string | null;
	scrapCodeDescription: string | null;
	isOtherComponent: boolean;
};

function savedRecords(): SavedRecord[] {
	return prismaMock.scrapRecord.createMany.mock.calls[0][0].data;
}
const savedRecord = (groupId: number) => savedRecords().find((r) => r.partGroupId === groupId);

beforeEach(() => {
	vi.clearAllMocks();
	prismaMock.labelGroup.findMany.mockResolvedValue([dmcLabel]);
	prismaMock.operator.findUnique.mockResolvedValue({ fullName: 'Test Operator' });
	prismaMock.user.findUnique.mockResolvedValue(null);
	prismaMock.scrapRecord.createMany.mockResolvedValue({ count: 1 });
	// No earlier rebuild saved under the scanned DMC
	prismaMock.scrapRecord.findFirst.mockResolvedValue(null);
});

describe('rebuild with a main reason', () => {
	it("gives the other component rows the cause's Other component scrap code and description", async () => {
		const result = await saveScrap(true, [
			row(MAIN_CARRIER, { selectedScrapCode: 'SA100', selectedScrapDescription: 'Scratch' }),
			row(MIDDFIELD, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER }),
			row(BELTLINE, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER })
		]);

		expect(result).toMatchObject({ success: true });
		expect(savedRecord(MAIN_CARRIER)).toMatchObject({
			scrapCode: 'SA100',
			scrapCodeDescription: 'Scratch',
			isOtherComponent: false
		});
		for (const groupId of [MIDDFIELD, BELTLINE]) {
			expect(savedRecord(groupId)).toMatchObject({
				scrapCode: 'SA850',
				scrapCodeDescription: 'Carrier damaged',
				isOtherComponent: true
			});
		}
	});

	it('ignores a scrap code and description sent by the client for an other component row', async () => {
		await saveScrap(true, [
			row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
			row(MIDDFIELD, {
				isOtherComponent: true,
				otherComponentCauseGroupId: MAIN_CARRIER,
				selectedScrapCode: 'SA200',
				selectedScrapDescription: 'Forged'
			})
		]);

		expect(savedRecord(MIDDFIELD)).toMatchObject({
			scrapCode: 'SA850',
			scrapCodeDescription: 'Carrier damaged'
		});
	});
});

describe('scrap with a chosen cause', () => {
	it("gives the other component row the chosen cause's code", async () => {
		const result = await saveScrap(false, [
			row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
			row(MIDDFIELD, { selectedScrapCode: 'SA200' }),
			row(BELTLINE, { isOtherComponent: true, otherComponentCauseGroupId: MIDDFIELD })
		]);

		expect(result).toMatchObject({ success: true });
		expect(savedRecord(BELTLINE)).toMatchObject({
			scrapCode: 'SA860',
			scrapCodeDescription: 'Middfield damaged',
			isOtherComponent: true
		});
	});
});

describe('an invalid cause is rejected and nothing is saved', () => {
	it.each([
		[
			'missing cause',
			[row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }), row(BELTLINE, { isOtherComponent: true })]
		],
		[
			'cause not in the payload',
			[
				row(MIDDFIELD, { selectedScrapCode: 'SA200' }),
				row(BELTLINE, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER })
			]
		],
		[
			'cause is the row itself',
			[
				row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
				row(BELTLINE, { isOtherComponent: true, otherComponentCauseGroupId: BELTLINE })
			]
		],
		[
			'cause without a selected reason',
			[
				row(MAIN_CARRIER, { isOtherComponent: true, otherComponentCauseGroupId: MIDDFIELD }),
				row(MIDDFIELD, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER }),
				row(BELTLINE, { selectedScrapCode: 'SA300' })
			]
		],
		[
			'cause without an Other component scrap code',
			[
				row(BELTLINE, { selectedScrapCode: 'SA300' }),
				row(MA_POCKET, { isOtherComponent: true, otherComponentCauseGroupId: BELTLINE })
			]
		],
		[
			'cause with another variant',
			[
				row(MAIN_CARRIER, {
					selectedScrapCode: 'SA100',
					isOtherVariant: true,
					replacementPartMaterial: 'PN-X'
				}),
				row(BELTLINE, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER })
			]
		]
	])('%s', async (_case, rows) => {
		for (const isRebuild of [false, true]) {
			const result = await saveScrap(isRebuild, rows);
			expect(result).toMatchObject({ status: 400 });
		}
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('rebuild with a cause that is not a rebuild group', async () => {
		const smallGroupWithCode = {
			id: BELTLINE,
			qadIdentity: 'QAD1',
			isRebuild: false,
			materials: [],
			scrapCodes: [code('SA300', 'Torn'), code('SA870', 'Beltline damaged', true)]
		};
		prismaMock.labelGroup.findMany.mockResolvedValue([
			{
				...dmcLabel,
				groups: [...dmcLabel.groups.filter((g) => g.id !== BELTLINE), smallGroupWithCode]
			}
		]);

		const result = await saveScrap(true, [
			row(BELTLINE, { selectedScrapCode: 'SA300' }),
			row(MA_POCKET, { isOtherComponent: true, otherComponentCauseGroupId: BELTLINE })
		]);

		expect(result).toMatchObject({ status: 400 });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});
});

describe('rebuild group that cannot be the main reason', () => {
	it('saves it as an other component of another main reason', async () => {
		const result = await saveScrap(true, [
			row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
			row(FLAGGED, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER })
		]);

		expect(result).toMatchObject({ success: true });
		expect(savedRecord(FLAGGED)).toMatchObject({ scrapCode: 'SA850', isOtherComponent: true });
	});

	it('rejects a reason on it in a rebuild', async () => {
		const result = await saveScrap(true, [row(FLAGGED, { selectedScrapCode: 'SA500' })]);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('rejects another variant on it in a rebuild', async () => {
		const result = await saveScrap(true, [
			row(FLAGGED, { isOtherVariant: true, replacementPartMaterial: 'PN1' })
		]);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('rejects it as the cause of another component', async () => {
		const result = await saveScrap(true, [
			row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
			row(MIDDFIELD, { isOtherComponent: true, otherComponentCauseGroupId: FLAGGED })
		]);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});
});

describe('part group hidden in scrap', () => {
	const HIDDEN = 15;
	const hiddenLabel = {
		...dmcLabel,
		groups: [
			...dmcLabel.groups,
			{
				id: HIDDEN,
				qadIdentity: 'QAD1',
				isRebuild: false,
				hiddenInScrap: true,
				interfaceName: 'Hidden group',
				materials: [],
				scrapCodes: [code('SA600', 'Cracked'), code('SA870', 'Hidden damaged', true)]
			}
		]
	};

	beforeEach(() => {
		prismaMock.labelGroup.findMany.mockResolvedValue([hiddenLabel]);
	});

	it('rejects a scrap payload with a hidden group row', async () => {
		const result = await saveScrap(false, [row(HIDDEN, { selectedScrapCode: 'SA600' })]);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('rejects a hidden group used as the cause of an other component row', async () => {
		const result = await saveScrap(false, [
			row(HIDDEN, { selectedScrapCode: 'SA600' }),
			row(BELTLINE, { isOtherComponent: true, otherComponentCauseGroupId: HIDDEN })
		]);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('still saves a rebuild that contains the hidden group', async () => {
		const result = await saveScrap(true, [
			row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
			row(HIDDEN, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER })
		]);

		expect(result).toMatchObject({ success: true });
	});

	it('saves a scrap payload without the hidden group', async () => {
		const result = await saveScrap(false, [row(BELTLINE, { selectedScrapCode: 'SA300' })]);

		expect(result).toMatchObject({ success: true });
	});
});

describe('part group hidden in rebuild for a side', () => {
	const SIDE_HIDDEN = 16;
	const sideLabel = {
		...dmcLabel,
		groups: [
			...dmcLabel.groups,
			{
				id: SIDE_HIDDEN,
				qadIdentity: 'QAD1',
				isRebuild: false,
				hiddenInRebuildRR: true,
				hiddenInRebuildFL: null,
				interfaceName: 'Rear right only',
				materials: [],
				scrapCodes: [code('SA700', 'Torn'), code('SA880', 'Side damaged', true)]
			}
		]
	};
	const rows = [
		row(MAIN_CARRIER, { selectedScrapCode: 'SA100' }),
		row(SIDE_HIDDEN, { isOtherComponent: true, otherComponentCauseGroupId: MAIN_CARRIER })
	];

	beforeEach(() => {
		prismaMock.labelGroup.findMany.mockResolvedValue([sideLabel]);
	});

	it('rejects a rebuild row of a part group hidden for the DMC side', async () => {
		const result = await saveScrap(true, rows, 'ABCRR123');

		expect(result).toMatchObject({
			status: 400,
			data: { success: false, error: expect.stringContaining('RR') }
		});
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('rejects a part group hidden for the side used as the cause', async () => {
		const result = await saveScrap(
			true,
			[
				row(SIDE_HIDDEN, { selectedScrapCode: 'SA700' }),
				row(MAIN_CARRIER, { isOtherComponent: true, otherComponentCauseGroupId: SIDE_HIDDEN })
			],
			'ABCrr123'
		);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});

	it('saves when the DMC has no side, another side or ambiguous sides', async () => {
		for (const dmc of ['ABC123', 'ABCFL123', 'ABCRRFL123']) {
			prismaMock.scrapRecord.createMany.mockClear();
			expect(await saveScrap(true, rows, dmc)).toMatchObject({ success: true });
		}
	});

	it('does not apply the side rule in scrap mode', async () => {
		const result = await saveScrap(
			false,
			[row(SIDE_HIDDEN, { selectedScrapCode: 'SA700' })],
			'ABCRR123'
		);

		expect(result).toMatchObject({ success: true });
	});
});

describe('part group without QAD identity', () => {
	const NO_QAD = 17;
	const noQadLabel = {
		...dmcLabel,
		groups: [
			...dmcLabel.groups,
			{
				id: NO_QAD,
				qadIdentity: '  ',
				isRebuild: false,
				interfaceName: 'No QAD',
				materials: [],
				scrapCodes: [code('SA710', 'Missing')]
			}
		]
	};

	beforeEach(() => {
		prismaMock.labelGroup.findMany.mockResolvedValue([noQadLabel]);
	});

	it.each([true, false])('rejects its row when isRebuild=%s', async (isRebuild) => {
		const result = await saveScrap(isRebuild, [row(NO_QAD, { selectedScrapCode: 'SA710' })]);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
	});
});
