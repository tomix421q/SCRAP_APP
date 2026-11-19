import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const state = vi.hoisted(() => ({ session: true, role: 'ADMIN' as string | null }));

const prismaMock = vi.hoisted(() => ({
	user: { findUnique: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () =>
				state.session
					? { user: { id: 'u1', email: 'eng@yanfeng.com', name: 'Eng' }, session: { id: 's1' } }
					: null
			)
		}
	}
}));

import { requireRole } from '../src/lib/utils/serverHelp';

const event = { request: new Request('http://localhost/admin') };

beforeEach(() => {
	vi.clearAllMocks();
	state.session = true;
	state.role = 'ADMIN';
	prismaMock.user.findUnique.mockImplementation(async () =>
		state.role ? { id: 'u1', email: 'eng@yanfeng.com', name: 'Eng', role: state.role } : null
	);
});

describe('requireRole', () => {
	it('returns 401 when nobody is signed in', async () => {
		state.session = false;
		const result = await requireRole(event, ['ADMIN']);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.failure.status).toBe(401);
		expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
	});

	it('returns 401 when the session user no longer exists in the DB', async () => {
		state.role = null;
		const result = await requireRole(event, ['ADMIN']);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.failure.status).toBe(401);
	});

	it('returns 403 when the role is not allowed', async () => {
		state.role = 'USER';
		const result = await requireRole(event, ['ADMIN', 'MODERATOR', 'ENGINEER']);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.failure.status).toBe(403);
			expect(result.failure.data).toMatchObject({ success: false });
		}
	});

	it.each(['ADMIN', 'MODERATOR', 'ENGINEER'])('returns the signed-in %s user', async (role) => {
		state.role = role;
		const result = await requireRole(event, ['ADMIN', 'MODERATOR', 'ENGINEER']);

		expect(result).toEqual({
			ok: true,
			user: { id: 'u1', email: 'eng@yanfeng.com', name: 'Eng', role }
		});
	});
});
