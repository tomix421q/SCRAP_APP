import { env } from '$env/dynamic/private';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const DEFAULT_PHOTO_DIR = './uploads/partgroups';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Deterministic file name derived from the group id, so replace/remove touch exactly one file. */
export const partGroupPhotoFileName = (groupId: number) => `${groupId}.webp`;

const photoPath = (groupId: number) =>
	join(resolve(env.PARTGROUP_PHOTO_DIR || DEFAULT_PHOTO_DIR), partGroupPhotoFileName(groupId));

type PhotoValidation = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

const ascii = (bytes: Uint8Array, from: number, to: number) =>
	String.fromCharCode(...bytes.subarray(from, to));

/**
 * True when the bytes are a complete RIFF/WEBP container: signature matches and the declared
 * chunk size equals the real length (detects truncated uploads). Checks content, not name/MIME.
 */
function isCompleteWebp(bytes: Uint8Array) {
	if (bytes.length < 12) return false;
	if (ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 12) !== 'WEBP') return false;
	const declaredSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
		4,
		true
	);
	return declaredSize + 8 === bytes.length;
}

/** Accepts only a real, complete webp up to 2 MB. */
export async function validatePartGroupPhoto(file: File): Promise<PhotoValidation> {
	if (file.size > MAX_PHOTO_BYTES) {
		return { ok: false, error: 'Photo is too large (max 2 MB).' };
	}
	const bytes = new Uint8Array(await file.arrayBuffer());
	if (!isCompleteWebp(bytes)) {
		return { ok: false, error: 'Photo must be a valid, complete webp image.' };
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
		commit: () => rename(tempPath, finalPath),
		discard: () => rm(tempPath, { force: true })
	};
}

/** Reads the stored photo of a group, or null when there is none. */
export async function readPartGroupPhoto(groupId: number): Promise<Buffer | null> {
	try {
		return await readFile(photoPath(groupId));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}
}

/** Deletes the photo file of a group; a missing file is not an error. */
export async function removePartGroupPhoto(groupId: number) {
	await rm(photoPath(groupId), { force: true });
}
