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

function eventWith(extra: Record<string, string> = {}) {
	const values: Record<string, string> = {
		groupName: 'Main carrier',
		vProject: 'PRJ1',
		interfaceName: 'Carrier',
		isRebuild: 'false',
		partNumbers: '[]',
		scrapCodes: JSON.stringify([{ code: 'SA100', isOtherComponent: false }]),
		...extra
	};
	const formData = new FormData();
	for (const [key, value] of Object.entries(values)) formData.set(key, value);
	return {
		request: new Request('http://localhost/admin/partgroups', { method: 'POST', body: formData })
	} as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	prismaMock.user.findUnique.mockResolvedValue({ role: 'MODERATOR' });
	prismaMock.partGroup.create.mockResolvedValue({ id: 7, name: 'Main carrier' });
	prismaMock.partGroup.update.mockResolvedValue({ id: 7, name: 'Main carrier' });
	prismaMock.vScrapCodes.findMany.mockResolvedValue([
		{ Reason_Code: 'SA100', Reason_Description: 'Scratch' }
	]);
});

describe('hidden in scrap flag on a part group', () => {
	it('defaults to false when the checkbox is not sent', async () => {
		await actions.createPartGroup(eventWith());
		expect(prismaMock.partGroup.create.mock.calls[0][0].data.hiddenInScrap).toBe(false);
	});

	it('is stored on create', async () => {
		await actions.createPartGroup(eventWith({ hiddenInScrap: 'true' }));
		expect(prismaMock.partGroup.create.mock.calls[0][0].data.hiddenInScrap).toBe(true);
	});

	it('is stored on update', async () => {
		await actions.editGroup(eventWith({ id: '7', hiddenInScrap: 'true' }));
		expect(prismaMock.partGroup.update.mock.calls[0][0].data.hiddenInScrap).toBe(true);
	});

	it('is independent from the rebuild flag', async () => {
		const flagged = JSON.stringify([{ code: 'SA100', isOtherComponent: true }]);
		await actions.createPartGroup(
			eventWith({ isRebuild: 'true', hiddenInScrap: 'true', scrapCodes: flagged })
		);
		const data = prismaMock.partGroup.create.mock.calls[0][0].data;
		expect(data.isRebuild).toBe(true);
		expect(data.hiddenInScrap).toBe(true);
	});
});
