import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const state = vi.hoisted(() => ({
	photoDir: '',
	role: 'MODERATOR' as string | null
}));

const prismaMock = vi.hoisted(() => ({
	partGroup: {
		create: vi.fn(),
		update: vi.fn(),
		findUnique: vi.fn(),
		delete: vi.fn()
	},
	vScrapCodes: { findMany: vi.fn() },
	user: { findUnique: vi.fn() },
	activityLogs: { create: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () =>
				state.role ? { user: { id: 'u1' }, session: { id: 's1' } } : null
			)
		}
	}
}));
vi.mock('$env/dynamic/private', () => ({
	env: {
		get PARTGROUP_PHOTO_DIR() {
			return state.photoDir;
		}
	}
}));

import { actions } from '../src/routes/(Admin)/admin/partgroups/+page.server';
import { GET } from '../src/routes/api/partgroup-photo/[id]/+server';

// Smallest buffer that carries a real WebP signature (RIFF....WEBP).
const webpBytes = (extra = 16) =>
	Buffer.concat([
		Buffer.from('RIFF'),
		Buffer.from([extra + 4, 0, 0, 0]),
		Buffer.from('WEBP'),
		Buffer.alloc(extra, 1)
	]);

const baseFields = {
	groupName: 'Bumper',
	vProject: 'PRJ1',
	interfaceName: 'IFACE',
	isRebuild: 'false',
	partNumbers: '[]',
	scrapCodes: '[]'
};

function eventWith(fields: Record<string, string>, photo?: Buffer, type = 'image/webp') {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) formData.set(key, value);
	if (photo) formData.set('photo', new File([new Uint8Array(photo)], 'photo.webp', { type }));
	const request = new Request('http://localhost/admin/partgroups', {
		method: 'POST',
		body: formData
	});
	return { request } as never;
}

const exists = (path: string) =>
	access(path).then(
		() => true,
		() => false
	);

beforeEach(async () => {
	state.photoDir = await mkdtemp(join(tmpdir(), 'partgroup-photo-'));
	state.role = 'MODERATOR';
	vi.clearAllMocks();
	prismaMock.user.findUnique.mockImplementation(async () => ({ role: state.role }));
	prismaMock.partGroup.create.mockResolvedValue({ id: 7, name: 'Bumper' });
	prismaMock.partGroup.update.mockResolvedValue({ id: 7, name: 'Bumper' });
	prismaMock.vScrapCodes.findMany.mockResolvedValue([]);
});

afterEach(async () => {
	await rm(state.photoDir, { recursive: true, force: true });
});

describe('createPartGroup photo', () => {
	it('stores a valid webp photo under the new group id and records it on the group', async () => {
		const photo = webpBytes();

		const result = await actions.createPartGroup(eventWith(baseFields, photo));

		expect(result).toMatchObject({ success: true });
		expect(await readFile(join(state.photoDir, '7.webp'))).toEqual(photo);
		expect(prismaMock.partGroup.update).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 7 }, data: { photoFile: '7.webp' } })
		);
	});

	it('creates the group without touching the disk when no photo is sent', async () => {
		const result = await actions.createPartGroup(eventWith(baseFields));

		expect(result).toMatchObject({ success: true });
		expect(prismaMock.partGroup.update).not.toHaveBeenCalled();
		expect(await exists(join(state.photoDir, '7.webp'))).toBe(false);
	});

	it('rejects a file that only claims to be webp and does not create the group', async () => {
		const pngBytes = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(32, 1)]);

		const result = await actions.createPartGroup(eventWith(baseFields, pngBytes, 'image/webp'));

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.partGroup.create).not.toHaveBeenCalled();
		expect(await exists(join(state.photoDir, '7.webp'))).toBe(false);
	});

	it('rejects a photo larger than 2 MB and does not create the group', async () => {
		const tooBig = webpBytes(2 * 1024 * 1024);

		const result = await actions.createPartGroup(eventWith(baseFields, tooBig));

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.partGroup.create).not.toHaveBeenCalled();
	});
});

describe('editGroup photo', () => {
	const editFields = { ...baseFields, id: '7' };
	const oldPhoto = webpBytes(8);

	beforeEach(async () => {
		await writeFile(join(state.photoDir, '7.webp'), oldPhoto);
	});

	it('keeps the existing photo and never writes photoFile when no photo change is sent', async () => {
		const result = await actions.editGroup(eventWith(editFields));

		expect(result).toMatchObject({ success: true });
		const data = prismaMock.partGroup.update.mock.calls[0][0].data;
		expect(data).not.toHaveProperty('photoFile');
		expect(await readFile(join(state.photoDir, '7.webp'))).toEqual(oldPhoto);
	});

	it('replaces the photo with a newly uploaded one', async () => {
		const newPhoto = webpBytes(24);

		const result = await actions.editGroup(eventWith(editFields, newPhoto));

		expect(result).toMatchObject({ success: true });
		expect(prismaMock.partGroup.update).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ photoFile: '7.webp' }) })
		);
		expect(await readFile(join(state.photoDir, '7.webp'))).toEqual(newPhoto);
	});

	it('removes the photo when removePhoto is requested', async () => {
		const result = await actions.editGroup(eventWith({ ...editFields, removePhoto: 'true' }));

		expect(result).toMatchObject({ success: true });
		expect(prismaMock.partGroup.update).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ photoFile: null }) })
		);
		expect(await exists(join(state.photoDir, '7.webp'))).toBe(false);
	});

	it('keeps the old photo when the new one is invalid', async () => {
		const result = await actions.editGroup(eventWith(editFields, Buffer.alloc(40, 1)));

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.partGroup.update).not.toHaveBeenCalled();
		expect(await readFile(join(state.photoDir, '7.webp'))).toEqual(oldPhoto);
	});

	it('keeps the old photo intact when the database update fails', async () => {
		prismaMock.partGroup.update.mockRejectedValueOnce(new Error('db down'));

		const result = await actions.editGroup(eventWith(editFields, webpBytes(24)));

		expect(result).toMatchObject({ status: 500, data: { success: false } });
		expect(await readFile(join(state.photoDir, '7.webp'))).toEqual(oldPhoto);
		expect(await readdir(state.photoDir)).toEqual(['7.webp']);
	});
});

describe('deleteGroup photo', () => {
	const deleteEvent = () => eventWith({ deleteId: '7' });

	beforeEach(() => {
		prismaMock.partGroup.findUnique.mockResolvedValue({ id: 7 });
		prismaMock.partGroup.delete.mockResolvedValue({ id: 7, name: 'Bumper' });
	});

	it('removes the photo file together with the group', async () => {
		await writeFile(join(state.photoDir, '7.webp'), webpBytes());

		const result = await actions.deleteGroup(deleteEvent());

		expect(result).toMatchObject({ success: true });
		expect(await exists(join(state.photoDir, '7.webp'))).toBe(false);
	});

	it('still deletes the group when the photo file is already missing', async () => {
		const result = await actions.deleteGroup(deleteEvent());

		expect(result).toMatchObject({ success: true });
	});
});

describe('permissions', () => {
	const attempts = {
		createPartGroup: () => actions.createPartGroup(eventWith(baseFields, webpBytes())),
		editGroup: () => actions.editGroup(eventWith({ ...baseFields, id: '7' }, webpBytes())),
		deleteGroup: () => actions.deleteGroup(eventWith({ deleteId: '7' }))
	};

	for (const [name, attempt] of Object.entries(attempts)) {
		it(`${name} is rejected for a plain user and touches neither db nor disk`, async () => {
			state.role = 'USER';

			const result = await attempt();

			expect(result).toMatchObject({ status: 403 });
			expect(prismaMock.partGroup.create).not.toHaveBeenCalled();
			expect(prismaMock.partGroup.update).not.toHaveBeenCalled();
			expect(prismaMock.partGroup.delete).not.toHaveBeenCalled();
			expect(await readdir(state.photoDir)).toEqual([]);
		});

		it(`${name} is rejected without a session`, async () => {
			state.role = null;

			expect(await attempt()).toMatchObject({ status: 403 });
		});
	}

	it('allows an admin to upload a photo', async () => {
		state.role = 'ADMIN';

		const result = await actions.createPartGroup(eventWith(baseFields, webpBytes()));

		expect(result).toMatchObject({ success: true });
	});
});

describe('photo endpoint', () => {
	const request = (id: string) => GET({ params: { id } } as never);

	it('serves the stored photo as a long-lived cacheable webp', async () => {
		const photo = webpBytes();
		await writeFile(join(state.photoDir, '7.webp'), photo);

		const response = (await request('7')) as Response;

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/webp');
		expect(response.headers.get('cache-control')).toContain('max-age=');
		expect(Buffer.from(await response.arrayBuffer())).toEqual(photo);
	});

	it('answers 404 when the group has no photo', async () => {
		await expect(request('7')).rejects.toMatchObject({ status: 404 });
	});

	it('answers 404 for a non-numeric id instead of reading arbitrary paths', async () => {
		await expect(request('../secret')).rejects.toMatchObject({ status: 404 });
	});
});

describe('failure handling', () => {
	it('rejects a truncated webp whose header promises more bytes than were sent', async () => {
		const truncated = webpBytes(64).subarray(0, 40);

		const result = await actions.createPartGroup(eventWith(baseFields, truncated));

		expect(result).toMatchObject({ status: 400, data: { success: false } });
		expect(prismaMock.partGroup.create).not.toHaveBeenCalled();
	});

	it('rolls back the new group and leaves no file when saving the photo reference fails', async () => {
		prismaMock.partGroup.update.mockRejectedValueOnce(new Error('db down'));

		const result = await actions.createPartGroup(eventWith(baseFields, webpBytes()));

		expect(result).toMatchObject({ status: 500, data: { success: false } });
		expect(prismaMock.partGroup.delete).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 7 } })
		);
		expect(await readdir(state.photoDir)).toEqual([]);
	});

	it('answers with a failure instead of throwing when the photo folder is not writable', async () => {
		const original = state.photoDir;
		await writeFile(join(original, 'blocker'), 'not a folder');
		state.photoDir = join(original, 'blocker', 'photos');
		try {
			const result = await actions.editGroup(
				eventWith({ ...baseFields, id: '7' }, webpBytes())
			);

			expect(result).toMatchObject({ status: 500, data: { success: false } });
			expect(prismaMock.partGroup.update).not.toHaveBeenCalled();
		} finally {
			state.photoDir = original;
		}
	});
});

describe('form errors', () => {
	it('never echoes the uploaded file back to the form (files cannot be serialized)', async () => {
		const result = (await actions.createPartGroup(
			eventWith({ ...baseFields, groupName: '' }, webpBytes())
		)) as unknown as { status: number; data: { values: Record<string, unknown> } };

		expect(result.status).toBe(400);
		expect(result.data.values).not.toHaveProperty('photo');
		expect(result.data.values).toMatchObject({ vProject: 'PRJ1' });
	});
});
