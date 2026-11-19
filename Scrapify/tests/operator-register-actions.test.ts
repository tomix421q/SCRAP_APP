import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const state = vi.hoisted(() => ({ role: 'ENGINEER' as string | null }));

const prismaMock = vi.hoisted(() => ({
	operator: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
	user: { findUnique: vi.fn() },
	activityLogs: { create: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () =>
				state.role
					? { user: { id: 'u1', email: 'eng@yanfeng.com', name: 'Eng' }, session: { id: 's1' } }
					: null
			)
		}
	}
}));

import { actions } from '../src/routes/(Admin)/admin/operatorregister/+page.server';

function postEvent(action: string, fields: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) formData.set(key, value);
	const request = new Request(`http://localhost/admin/operatorregister?/${action}`, {
		method: 'POST',
		body: formData
	});
	return { request } as never;
}

const createFields = { fullName: 'John Smith', cardId: '123456', createdBy: 'forged@evil.com' };

beforeEach(() => {
	vi.clearAllMocks();
	state.role = 'ENGINEER';
	prismaMock.user.findUnique.mockImplementation(async () =>
		state.role ? { id: 'u1', email: 'eng@yanfeng.com', name: 'Eng', role: state.role } : null
	);
	prismaMock.operator.create.mockImplementation(async ({ data }) => ({ id: 7, ...data }));
	prismaMock.operator.findFirst.mockResolvedValue({ id: 7, fullName: 'John Smith', cardId: 1 });
	prismaMock.operator.delete.mockResolvedValue({ id: 7 });
	prismaMock.activityLogs.create.mockResolvedValue({});
});

describe('createOperator action', () => {
	it.each(['ADMIN', 'MODERATOR', 'ENGINEER'])(
		'%s creates an operator with createdBy taken from the session',
		async (role) => {
			state.role = role;
			const result = await actions.createOperator(postEvent('createOperator', createFields));

			expect(result).toMatchObject({ success: true });
			expect(prismaMock.operator.create).toHaveBeenCalledWith({
				data: { cardId: 123456, fullName: 'John Smith', createdBy: 'eng@yanfeng.com' }
			});
			expect(prismaMock.activityLogs.create).toHaveBeenCalledWith({
				data: { userId: 'u1', action: 'CREATE', entityType: 'Operator', entityId: 7 }
			});
		}
	);

	it('returns 401 without sign-in', async () => {
		state.role = null;
		const result = await actions.createOperator(postEvent('createOperator', createFields));

		expect(result).toMatchObject({ status: 401 });
		expect(prismaMock.operator.create).not.toHaveBeenCalled();
	});

	it('returns 403 for the USER role', async () => {
		state.role = 'USER';
		const result = await actions.createOperator(postEvent('createOperator', createFields));

		expect(result).toMatchObject({ status: 403 });
		expect(prismaMock.operator.create).not.toHaveBeenCalled();
	});

	it('returns a failure when the DB rejects the create', async () => {
		prismaMock.operator.create.mockRejectedValue(
			Object.assign(new Error('Unique constraint'), { code: 'P2002' })
		);
		const result = await actions.createOperator(postEvent('createOperator', createFields));

		expect(result).toMatchObject({ success: false, error: 'Unique constraint P2002' });
	});
});

describe('deleteOperator action', () => {
	it.each(['ADMIN', 'MODERATOR', 'ENGINEER'])('%s deletes an operator', async (role) => {
		state.role = role;
		const result = await actions.deleteOperator(postEvent('deleteOperator', { deleteId: '7' }));

		expect(result).toMatchObject({ success: true });
		expect(prismaMock.operator.delete).toHaveBeenCalledWith({ where: { id: 7 } });
	});

	it('returns 401 without sign-in', async () => {
		state.role = null;
		const result = await actions.deleteOperator(postEvent('deleteOperator', { deleteId: '7' }));

		expect(result).toMatchObject({ status: 401 });
		expect(prismaMock.operator.delete).not.toHaveBeenCalled();
	});

	it('returns 403 for the USER role', async () => {
		state.role = 'USER';
		const result = await actions.deleteOperator(postEvent('deleteOperator', { deleteId: '7' }));

		expect(result).toMatchObject({ status: 403 });
		expect(prismaMock.operator.delete).not.toHaveBeenCalled();
	});
});
