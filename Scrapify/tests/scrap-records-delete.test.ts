import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const state = vi.hoisted(() => ({ role: 'ENGINEER' as string | null }));

const prismaMock = vi.hoisted(() => ({
	scrapRecord: { delete: vi.fn() },
	user: { findUnique: vi.fn() },
	activityLogs: { create: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/server/cacheVprojects', () => ({ getCachedProjects: vi.fn(async () => []) }));
vi.mock('@/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () =>
				state.role ? { user: { id: 'u1' }, session: { id: 's1' } } : null
			)
		}
	}
}));

import { actions } from '../src/routes/(Client)/scrapRecords/+page.server';

function deleteEvent(id: string) {
	const formData = new FormData();
	formData.set('deleteId', id);
	const request = new Request('http://localhost/scrapRecords?/deleteScrapRecord', {
		method: 'POST',
		body: formData
	});
	return { request } as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	state.role = 'ENGINEER';
	prismaMock.user.findUnique.mockImplementation(async () =>
		state.role ? { role: state.role } : null
	);
	prismaMock.scrapRecord.delete.mockResolvedValue({ id: 5 });
	prismaMock.activityLogs.create.mockResolvedValue({});
});

describe('deleteScrapRecord action', () => {
	it.each(['ADMIN', 'MODERATOR', 'ENGINEER'])(
		'%s can delete and the delete is logged',
		async (role) => {
			state.role = role;
			const result = await actions.deleteScrapRecord(deleteEvent('5'));

			expect(result).toMatchObject({ success: true });
			expect(prismaMock.scrapRecord.delete).toHaveBeenCalledWith({ where: { id: 5 } });
			expect(prismaMock.activityLogs.create).toHaveBeenCalledWith({
				data: { userId: 'u1', action: 'DELETE', entityType: 'ScrapRecord', entityId: 5 }
			});
		}
	);

	it('USER role cannot delete', async () => {
		state.role = 'USER';
		const result = await actions.deleteScrapRecord(deleteEvent('5'));

		expect(result).toMatchObject({ status: 403 });
		expect(prismaMock.scrapRecord.delete).not.toHaveBeenCalled();
		expect(prismaMock.activityLogs.create).not.toHaveBeenCalled();
	});

	it('anonymous operator cannot delete', async () => {
		state.role = null;
		const result = await actions.deleteScrapRecord(deleteEvent('5'));

		expect(result).toMatchObject({ status: 403 });
		expect(prismaMock.scrapRecord.delete).not.toHaveBeenCalled();
	});

	it('rejects an invalid id with 400', async () => {
		const result = await actions.deleteScrapRecord(deleteEvent('abc'));
		expect(result).toMatchObject({ status: 400 });
		expect(prismaMock.scrapRecord.delete).not.toHaveBeenCalled();
	});
});
