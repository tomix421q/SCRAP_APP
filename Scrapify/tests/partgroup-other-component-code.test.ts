import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const prismaMock = vi.hoisted(() => ({
	partGroup: { create: vi.fn(), update: vi.fn() },
	vScrapCodes: { findMany: vi.fn() },
	user: { findUnique: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/auth/auth', () => ({
	auth: { api: { getSession: vi.fn(async () => ({ user: { id: 'u1' }, session: { id: 's1' } })) } }
}));
vi.mock('$env/dynamic/private', () => ({ env: { PARTGROUP_PHOTO_DIR: '' } }));

import { actions } from '../src/routes/(Admin)/admin/partgroups/+page.server';

type ScrapCodeField = { code: string; isOtherComponent: boolean };

function fields(scrapCodes: ScrapCodeField[], extra: Record<string, string> = {}) {
	return {
		groupName: 'Main carrier',
		vProject: 'PRJ1',
		interfaceName: 'Carrier',
		isRebuild: 'false',
		partNumbers: '[]',
		scrapCodes: JSON.stringify(scrapCodes),
		...extra
	};
}

function eventWith(values: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(values)) formData.set(key, value);
	return {
		request: new Request('http://localhost/admin/partgroups', { method: 'POST', body: formData })
	} as never;
}

/** Scrap code rows written by the n-th create/update call. */
function savedScrapCodes(mock: typeof prismaMock.partGroup.create) {
	return mock.mock.calls[0][0].data.scrapCodes.create;
}

beforeEach(() => {
	vi.clearAllMocks();
	prismaMock.user.findUnique.mockResolvedValue({ role: 'MODERATOR' });
	prismaMock.partGroup.create.mockResolvedValue({ id: 7, name: 'Main carrier' });
	prismaMock.partGroup.update.mockResolvedValue({ id: 7, name: 'Main carrier' });
	prismaMock.vScrapCodes.findMany.mockResolvedValue([
		{ Reason_Code: 'SA100', Reason_Description: 'Scratch' },
		{ Reason_Code: 'SA850', Reason_Description: 'Damaged by other component' }
	]);
});

const twoCodes = (flagged: string | null): ScrapCodeField[] => [
	{ code: 'SA100', isOtherComponent: flagged === 'SA100' },
	{ code: 'SA850', isOtherComponent: flagged === 'SA850' }
];

describe('other component scrap code on a part group', () => {
	it('stores the flag with the code and its description when creating a group', async () => {
		const result = await actions.createPartGroup(eventWith(fields(twoCodes('SA850'))));

		expect(result).toMatchObject({ success: true });
		expect(savedScrapCodes(prismaMock.partGroup.create)).toEqual([
			{ code: 'SA100', description: 'Scratch', isOtherComponent: false },
			{ code: 'SA850', description: 'Damaged by other component', isOtherComponent: true }
		]);
	});

	it('keeps the flag when an edit recreates the scrap codes', async () => {
		const result = await actions.editGroup(
			eventWith(fields(twoCodes('SA850'), { id: '7', groupName: 'Main carrier renamed' }))
		);

		expect(result).toMatchObject({ success: true });
		const { scrapCodes } = prismaMock.partGroup.update.mock.calls[0][0].data;
		expect(scrapCodes.deleteMany).toEqual({});
		expect(scrapCodes.create).toContainEqual({
			code: 'SA850',
			description: 'Damaged by other component',
			isOtherComponent: true
		});
	});

	it('rejects more than one flagged code', async () => {
		const both = twoCodes(null).map((sc) => ({ ...sc, isOtherComponent: true }));

		const result = await actions.createPartGroup(eventWith(fields(both)));

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.partGroup.create).not.toHaveBeenCalled();
	});

	it('rejects a rebuild group without a flagged code', async () => {
		const result = await actions.editGroup(
			eventWith(fields(twoCodes(null), { id: '7', isRebuild: 'true' }))
		);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(JSON.stringify(result)).toContain('Other component scrap code');
		expect(prismaMock.partGroup.update).not.toHaveBeenCalled();
	});

	it('saves a rebuild group that has a flagged code', async () => {
		const result = await actions.createPartGroup(
			eventWith(fields(twoCodes('SA850'), { isRebuild: 'true' }))
		);

		expect(result).toMatchObject({ success: true });
	});

	it('saves a non-rebuild group without a flagged code', async () => {
		const result = await actions.createPartGroup(eventWith(fields(twoCodes(null))));

		expect(result).toMatchObject({ success: true });
		expect(savedScrapCodes(prismaMock.partGroup.create)).toEqual([
			{ code: 'SA100', description: 'Scratch', isOtherComponent: false },
			{ code: 'SA850', description: 'Damaged by other component', isOtherComponent: false }
		]);
	});
});

describe('cannot be main reason flag on a part group', () => {
	it('saves a flagged rebuild group without an Other component scrap code', async () => {
		const result = await actions.createPartGroup(
			eventWith(fields(twoCodes(null), { isRebuild: 'true', cannotBeMainReason: 'true' }))
		);

		expect(result).toMatchObject({ success: true });
		expect(prismaMock.partGroup.create.mock.calls[0][0].data.cannotBeMainReason).toBe(true);
	});

	it('keeps the flag when editing', async () => {
		await actions.editGroup(
			eventWith(fields(twoCodes(null), { id: '7', isRebuild: 'true', cannotBeMainReason: 'true' }))
		);

		expect(prismaMock.partGroup.update.mock.calls[0][0].data.cannotBeMainReason).toBe(true);
	});

	it('stores false for a non-rebuild group even if the flag is sent', async () => {
		const result = await actions.createPartGroup(
			eventWith(fields(twoCodes(null), { isRebuild: 'false', cannotBeMainReason: 'true' }))
		);

		expect(result).toMatchObject({ success: true });
		expect(prismaMock.partGroup.create.mock.calls[0][0].data.cannotBeMainReason).toBe(false);
	});

	it('still requires the code for an unflagged rebuild group', async () => {
		const result = await actions.createPartGroup(
			eventWith(fields(twoCodes(null), { isRebuild: 'true', cannotBeMainReason: 'false' }))
		);

		expect(result).toMatchObject({ status: 400, data: { success: false } });
	});
});

