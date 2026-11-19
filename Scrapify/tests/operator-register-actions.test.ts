import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const state = vi.hoisted(() => ({ role: 'ENGINEER' as string | null }));

const prismaMock = vi.hoisted(() => ({
	operator: {
		create: vi.fn(),
		findFirst: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	},
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
	prismaMock.operator.update.mockImplementation(async ({ where, data }) => ({ ...where, ...data }));
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

describe('updateOperator action', () => {
	const updateFields = { id: '7', fullName: '  Jane Doe Smith ', cardId: '654321' };

	it.each(['ADMIN', 'MODERATOR', 'ENGINEER'])(
		'%s updates name and card ID and the change is logged',
		async (role) => {
			state.role = role;
			const result = await actions.updateOperator(postEvent('updateOperator', updateFields));

			expect(result).toMatchObject({ success: true });
			expect(prismaMock.operator.update).toHaveBeenCalledWith({
				where: { id: 7 },
				data: { fullName: 'Jane Doe Smith', cardId: 654321 }
			});
			expect(prismaMock.activityLogs.create).toHaveBeenCalledWith({
				data: { userId: 'u1', action: 'EDIT', entityType: 'Operator', entityId: 7 }
			});
		}
	);

	it('returns 401 without sign-in', async () => {
		state.role = null;
		const result = await actions.updateOperator(postEvent('updateOperator', updateFields));

		expect(result).toMatchObject({ status: 401 });
		expect(prismaMock.operator.update).not.toHaveBeenCalled();
	});

	it('returns 403 for the USER role', async () => {
		state.role = 'USER';
		const result = await actions.updateOperator(postEvent('updateOperator', updateFields));

		expect(result).toMatchObject({ status: 403 });
		expect(prismaMock.operator.update).not.toHaveBeenCalled();
	});

	it.each([
		['a short name', { ...updateFields, fullName: 'Jo' }, 'fullName'],
		['a too long name', { ...updateFields, fullName: 'x'.repeat(256) }, 'fullName'],
		['a non-numeric card ID', { ...updateFields, cardId: '12a45' }, 'cardId'],
		['a negative card ID', { ...updateFields, cardId: '-12345' }, 'cardId'],
		['a zero card ID', { ...updateFields, cardId: '0' }, 'cardId'],
		['a card ID over the DB Int range', { ...updateFields, cardId: '2147483648' }, 'cardId'],
		['a missing id', { fullName: 'Jane Doe', cardId: '654321' }, 'id']
	])('returns 400 for %s', async (_label, fields, field) => {
		const result = await actions.updateOperator(postEvent('updateOperator', fields));

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(result).toHaveProperty(['data', 'error', field]);
		expect(prismaMock.operator.update).not.toHaveBeenCalled();
	});

	it('returns 409 with a readable message for a duplicate card ID and writes no log', async () => {
		prismaMock.operator.update.mockRejectedValue(
			Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
		);
		const result = await actions.updateOperator(postEvent('updateOperator', updateFields));

		expect(result).toMatchObject({
			status: 409,
			data: { success: false, message: 'Card ID 654321 is already used by another operator.' }
		});
		expect(prismaMock.activityLogs.create).not.toHaveBeenCalled();
	});

	it('returns 404 when the operator does not exist (P2025)', async () => {
		prismaMock.operator.update.mockRejectedValue(
			Object.assign(new Error('Record not found'), { code: 'P2025' })
		);
		const result = await actions.updateOperator(postEvent('updateOperator', updateFields));

		expect(result).toMatchObject({ status: 404 });
	});

	it('returns 500 for an unexpected DB error', async () => {
		prismaMock.operator.update.mockRejectedValue(new Error('Connection lost'));
		const result = await actions.updateOperator(postEvent('updateOperator', updateFields));

		expect(result).toMatchObject({
			status: 500,
			data: { success: false, error: 'Connection lost' }
		});
	});
});
