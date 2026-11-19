import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma is fully mocked: these tests must never touch a real database.
const prismaMock = vi.hoisted(() => ({
	labelGroup: { findMany: vi.fn(), findUnique: vi.fn() },
	operator: { findUnique: vi.fn() },
	user: { findUnique: vi.fn() },
	scrapRecord: { createMany: vi.fn(), findFirst: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));

import { getAllowedLabelIds } from '../src/lib/server/operatorLabelAccess';
import { actions } from '../src/routes/(Client)/scandmclabel/+page.server';

const dmcLabel = {
	id: 1,
	code: 'ABC*',
	vProject: 'X540',
	groups: [{ id: 10, isRebuild: false, materials: [], scrapCodes: [{ code: 'S1' }] }]
};
const quantityLabel = {
	id: 2,
	code: 'QNT-SCRAP-L1',
	vProject: null,
	groups: [{ id: 20, isRebuild: false, materials: [], scrapCodes: [] }]
};

function formRequest(action: string, fields: Record<string, string>) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	return new Request(`http://localhost/scandmclabel?/${action}`, { method: 'POST', body });
}

const scanFields = { barcode: 'ABC123', operator: '4321' };
const saveFields = {
	dmc: 'ABC123',
	isRebuild: 'false',
	operator: '4321',
	scrapPayload: JSON.stringify([{ groupId: 10, groupName: 'G', selectedScrapCode: 'S1' }])
};
const quantityFields = {
	dmc: 'QNT-SCRAP-L1',
	labelGroupId: '2',
	operator: '4321',
	scrapPayload: JSON.stringify([
		{ groupId: 20, groupName: 'G', selectedScrapCode: 'Q1', quantity: 3 }
	])
};

type Outcome = { success?: boolean; status?: number; data?: { error: string } };

const run = {
	scan: () =>
		actions.scanDmc({ request: formRequest('scanDmc', scanFields) } as never) as Promise<Outcome>,
	save: () =>
		actions.saveScrap({
			request: formRequest('saveScrap', saveFields)
		} as never) as Promise<Outcome>,
	quantity: () =>
		actions.saveQuantityScrap({
			request: formRequest('saveQuantityScrap', quantityFields)
		} as never) as Promise<Outcome>
};

/** Card 4321 belongs to an operator with the given restriction. */
function operatorHolds(restriction: boolean, allowedIds: number[]) {
	prismaMock.operator.findUnique.mockResolvedValue({
		fullName: 'Jan Novak',
		hasLabelRestriction: restriction,
		allowedLabels: allowedIds.map((id) => ({ id }))
	});
	prismaMock.user.findUnique.mockResolvedValue(null);
}

beforeEach(() => {
	vi.clearAllMocks();
	prismaMock.labelGroup.findMany.mockResolvedValue([dmcLabel]);
	prismaMock.labelGroup.findUnique.mockResolvedValue(quantityLabel);
	prismaMock.scrapRecord.findFirst.mockResolvedValue(null);
	prismaMock.scrapRecord.createMany.mockResolvedValue({ count: 1 });
});

describe('getAllowedLabelIds', () => {
	it('returns null for a user account without an operator', async () => {
		prismaMock.operator.findUnique.mockResolvedValue(null);
		expect(await getAllowedLabelIds(1)).toBeNull();
	});

	it('returns null for an unrestricted operator', async () => {
		operatorHolds(false, [5]);
		expect(await getAllowedLabelIds(1)).toBeNull();
	});

	it('returns an empty set for a restricted operator without masks', async () => {
		operatorHolds(true, []);
		expect(await getAllowedLabelIds(1)).toEqual(new Set());
	});

	it('returns the allowed IDs for a restricted operator', async () => {
		operatorHolds(true, [1, 2]);
		expect(await getAllowedLabelIds(1)).toEqual(new Set([1, 2]));
	});
});

describe('label access guard', () => {
	it('lets an unrestricted operator scan and save', async () => {
		operatorHolds(false, []);
		expect((await run.scan()).success).toBe(true);
		expect((await run.save()).success).toBe(true);
		expect((await run.quantity()).success).toBe(true);
	});

	it('lets a restricted operator use an allowed mask', async () => {
		operatorHolds(true, [1, 2]);
		expect((await run.scan()).success).toBe(true);
		expect((await run.save()).success).toBe(true);
		expect((await run.quantity()).success).toBe(true);
	});

	it.each(['scan', 'save', 'quantity'] as const)(
		'rejects a forbidden mask in %s with 403',
		async (name) => {
			operatorHolds(true, [99]);
			const result = await run[name]();
			expect(result.status).toBe(403);
			expect(result.data?.error).toContain('Operátor Jan Novak nemá povolenú masku');
			expect(prismaMock.scrapRecord.createMany).not.toHaveBeenCalled();
		}
	);

	it('names the project in the message', async () => {
		operatorHolds(true, []);
		const result = await run.scan();
		expect(result.data?.error).toBe(
			'Operátor Jan Novak nemá povolenú masku ABC* (X540). Kontaktujte správcu.'
		);
	});

	it('forbids everything for a restricted operator without masks', async () => {
		operatorHolds(true, []);
		for (const name of ['scan', 'save', 'quantity'] as const) {
			expect((await run[name]()).status).toBe(403);
		}
	});
});

describe('allowedQuantityScrapLabels', () => {
	const otherQuantityLabel = { ...quantityLabel, id: 3, code: 'QNT-SCRAP-L2' };

	async function loadLabels(operator = '4321') {
		const result = (await actions.allowedQuantityScrapLabels({
			request: formRequest('allowedQuantityScrapLabels', { operator })
		} as never)) as { labels?: { id: number }[]; status?: number };
		return result;
	}

	beforeEach(() => {
		prismaMock.labelGroup.findMany.mockResolvedValue([quantityLabel, otherQuantityLabel]);
	});

	it('returns every label for an unrestricted operator', async () => {
		operatorHolds(false, []);
		expect((await loadLabels()).labels?.map((l) => l.id)).toEqual([2, 3]);
	});

	it('returns every label for a user account', async () => {
		prismaMock.operator.findUnique.mockResolvedValue(null);
		expect((await loadLabels()).labels?.map((l) => l.id)).toEqual([2, 3]);
	});

	it('returns only the allowed labels for a restricted operator', async () => {
		operatorHolds(true, [3, 99]);
		expect((await loadLabels()).labels?.map((l) => l.id)).toEqual([3]);
	});

	it('returns nothing for a restricted operator without masks', async () => {
		operatorHolds(true, []);
		expect((await loadLabels()).labels).toEqual([]);
	});

	it('rejects an invalid card ID', async () => {
		expect((await loadLabels('1e3')).status).toBe(400);
	});
});
