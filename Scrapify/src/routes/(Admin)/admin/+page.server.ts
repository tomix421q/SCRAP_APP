import prismaClient from '@/server/prisma';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load = (async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	try {
		const [totalUsers, totalScrapCode, totalParts, totalOperators, totalLogs] = await Promise.all([
			prismaClient.user.count(),
			prismaClient.scrapCode.count(),
			prismaClient.part.count(),
			prismaClient.operator.count(),
			prismaClient.activityLogs.count()
		]);

		const totalPagesLogs = Math.ceil(totalLogs / limit);
		const getLogsPromise = prismaClient.activityLogs.findMany({
			skip: skip,
			take: limit,
			include: { user: true, operator: true },
			orderBy: {
				timestamp: 'desc'
			}
		});
		return {
			totalUsers,
			totalScrapCode,
			totalParts,
			totalOperators,
			getLogsPromise,
			totalLogs,
			totalPagesLogs
		};
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
}) satisfies PageServerLoad;
