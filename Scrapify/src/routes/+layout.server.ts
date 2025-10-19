import type { LayoutServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { getUserServer } from '@/utils/serverHelp';
import { error } from '@sveltejs/kit';

export const load = (async (event: any) => {
	const now = new Date();
	let fullUser = null;

	const startDate30day: Date = new Date();
	startDate30day.setDate(now.getDate() - 30);
	const startDate7day: Date = new Date();
	startDate7day.setDate(now.getDate() - 7);
	const startDate1Day: Date = new Date();
	startDate1Day.setDate(now.getDate() - 1);

	try {
		const { user, session } = await getUserServer({ request: event.request });
		if (user) {
			fullUser = await prismaClient.user.findUnique({ where: { id: user?.id } });
		}

		// statistic landing ... LAZY LOAD
		const totalScrapRecordsLast30DaysPromise = prismaClient.scrapRecord
			.aggregate({
				_sum: {
					quantity: true
				},
				where: {
					createdAt: {
						gte: startDate30day,
						lt: now
					}
				}
			})
			.then((res) => res._sum.quantity || 0);
		const totalScrapRecordsLast7DaysPromise = prismaClient.scrapRecord
			.aggregate({
				_sum: {
					quantity: true
				},
				where: {
					createdAt: {
						gte: startDate7day,
						lt: now
					}
				}
			})
			.then((res) => res._sum.quantity || 0);
		const totalScrapRecordsLast1DaysPromise = prismaClient.scrapRecord
			.aggregate({
				_sum: {
					quantity: true
				},
				where: {
					createdAt: {
						gte: startDate1Day,
						lt: now
					}
				}
			})
			.then((res) => res._sum.quantity || 0);

		return {
			user: fullUser,
			session: session,
			stats: {
				totalScrapPartsLast30Days: totalScrapRecordsLast30DaysPromise,
				totalScrapPartsLastWeek: totalScrapRecordsLast7DaysPromise,
				totalScrapPartsLast1Day: totalScrapRecordsLast1DaysPromise
			}
		};
	} catch (err: any) {
		console.error('error in /layout.server.ts', err);
		throw error(500, {
			message: `${err.message || 'Something is wrong try again later.'}`
		});
	}
}) satisfies LayoutServerLoad;
