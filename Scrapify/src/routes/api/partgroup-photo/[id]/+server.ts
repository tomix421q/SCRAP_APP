import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readPartGroupPhoto } from '@/server/partGroupPhoto';

export const GET: RequestHandler = async ({ params }) => {
	const groupId = Number(params.id);
	if (!Number.isInteger(groupId) || groupId <= 0) throw error(404, 'Photo not found');

	const photo = await readPartGroupPhoto(groupId);
	if (!photo) throw error(404, 'Photo not found');

	return new Response(new Uint8Array(photo.bytes), {
		headers: {
			'Content-Type': photo.contentType,
			// URLs are versioned by the group's updatedAt, so a changed photo gets a new URL.
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
