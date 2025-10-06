import prismaClient from '@/server/prisma';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load = (async () => {
	try {
		const [totalUsers, totalScrapCode, totalParts] = await Promise.all([
			prismaClient.user.count(),
			prismaClient.scrapCode.count(),
			prismaClient.part.count()
		]);

		return { totalUsers, totalScrapCode, totalParts };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
}) satisfies PageServerLoad;
