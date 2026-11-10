import { env } from '$env/dynamic/private';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const DEFAULT_PHOTO_DIR = './uploads/partgroups';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Deterministic file name derived from the group id, so replace/remove touch exactly one file. */
export const partGroupPhotoFileName = (groupId: number) => `${groupId}.jpg`;

// Photos uploaded before the switch to JPEG are still stored as webp; they stay readable.
const legacyWebpFileName = (groupId: number) => `${groupId}.webp`;

const photoDir = () => resolve(env.PARTGROUP_PHOTO_DIR || DEFAULT_PHOTO_DIR);
const photoPath = (groupId: number) => join(photoDir(), partGroupPhotoFileName(groupId));
const legacyWebpPath = (groupId: number) => join(photoDir(), legacyWebpFileName(groupId));

type PhotoValidation = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

/**
 * True when the bytes are a complete JPEG: starts with the SOI marker (FF D8 FF) and ends with
 * the EOI marker (FF D9), which detects truncated uploads. Checks content, not name/MIME.
 */
function isCompleteJpeg(bytes: Uint8Array) {
	if (bytes.length < 5) return false;
	const hasSoi = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	const hasEoi = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
	return hasSoi && hasEoi;
}

/** Accepts only a real, complete JPEG up to 2 MB. */
export async function validatePartGroupPhoto(file: File): Promise<PhotoValidation> {
	if (file.size > MAX_PHOTO_BYTES) {
		return { ok: false, error: 'Photo is too large (max 2 MB).' };
	}
	const bytes = new Uint8Array(await file.arrayBuffer());
	if (!isCompleteJpeg(bytes)) {
		return { ok: false, error: 'Photo must be a valid, complete JPEG image.' };
	}
	return { ok: true, bytes };
}

/**
 * Writes the photo under a temporary name next to its final location, so the current photo stays
 * intact until the caller confirms the database update with `commit()` (or aborts with `discard()`).
 */
export async function stagePartGroupPhoto(groupId: number, bytes: Uint8Array) {
	const finalPath = photoPath(groupId);
	const tempPath = `${finalPath}.tmp`;
	await mkdir(dirname(finalPath), { recursive: true });
	await writeFile(tempPath, bytes);
	return {
		fileName: partGroupPhotoFileName(groupId),
		commit: async () => {
			await rename(tempPath, finalPath);
			// The new JPEG supersedes a legacy webp photo of the same group.
			await rm(legacyWebpPath(groupId), { force: true });
		},
		discard: () => rm(tempPath, { force: true })
	};
}

export type StoredPhoto = { bytes: Buffer; contentType: 'image/jpeg' | 'image/webp' };

async function readIfExists(path: string) {
	try {
		return await readFile(path);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}
}

/** Reads the stored photo of a group (JPEG, or a legacy webp), or null when there is none. */
export async function readPartGroupPhoto(groupId: number): Promise<StoredPhoto | null> {
	const jpeg = await readIfExists(photoPath(groupId));
	if (jpeg) return { bytes: jpeg, contentType: 'image/jpeg' };
	const webp = await readIfExists(legacyWebpPath(groupId));
	return webp ? { bytes: webp, contentType: 'image/webp' } : null;
}

/** Deletes the photo file(s) of a group; a missing file is not an error. */
export async function removePartGroupPhoto(groupId: number) {
	await Promise.all([
		rm(photoPath(groupId), { force: true }),
		rm(legacyWebpPath(groupId), { force: true })
	]);
}
