import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { getUserServer, writeToLogger } from '@/utils/serverHelp';
import { parseScrapRecordFilters } from './filters.server';
import { getCachedProjects } from '@/server/cacheVprojects';

const pageSize = 100;
const deleteRoles = ['ADMIN', 'MODERATOR', 'ENGINEER'];

export const load = (async (event) => {
	const requestedPage = Number(event.url.searchParams.get('page') ?? '1');
	const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const skip = (currentPage - 1) * pageSize;
	const { category, project, where, whereFor } = parseScrapRecordFilters(event.url.searchParams);
	const { user } = await getUserServer({ request: event.request });

	try {
		const [
			records,
			totalRecords,
			totalQuantityForCategory,
			rebuildCount,
			rebuildQuantity,
			scrapCount,
			scrapQuantity,
			quantityCount,
			quantitySum,
			dbUser,
			projects,
			partGroups,
			scrapCodes
		] = await Promise.all([
			prismaClient.scrapRecord.findMany({
				where,
				include: { partGroup: true },
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip,
				take: pageSize
			}),
			prismaClient.scrapRecord.count({ where }),
			prismaClient.scrapRecord.aggregate({
				where,
				_sum: { quantity: true }
			}),
			prismaClient.scrapRecord.count({ where: whereFor('rebuild') }),
			prismaClient.scrapRecord.aggregate({
				where: whereFor('rebuild'),
				_sum: { quantity: true }
			}),
			prismaClient.scrapRecord.count({ where: whereFor('scrap') }),
			prismaClient.scrapRecord.aggregate({
				where: whereFor('scrap'),
				_sum: { quantity: true }
			}),
			prismaClient.scrapRecord.count({ where: whereFor('quantity') }),
			prismaClient.scrapRecord.aggregate({
				where: whereFor('quantity'),
				_sum: { quantity: true }
			}),
			user
				? prismaClient.user.findUnique({
						where: { id: user.id },
						select: { role: true }
					})
				: Promise.resolve(null),
			getCachedProjects(),
			prismaClient.partGroup.findMany({
				where: project ? { vProject: project } : undefined,
				distinct: ['name'],
				select: { name: true },
				orderBy: { name: 'asc' }
			}),
			prismaClient.vScrapCodes.findMany({
				where: project ? { Reason_Project: project } : undefined,
				select: { Reason_Code: true, Reason_Description: true },
				orderBy: { Reason_Code: 'asc' }
			})
		]);
		// createdBy holds the card id of an operator or a registered user (scan accepts both);
		// resolve names for the listed records (tooltip). Operator name wins on a shared card.
		const cardIds = [
			...new Set(
				records
					.map((record) => Number(record.createdBy))
					.filter((cardId) => Number.isSafeInteger(cardId) && cardId > 0)
			)
		];
		const [operators, users] = cardIds.length
			? await Promise.all([
					prismaClient.operator.findMany({
						where: { cardId: { in: cardIds } },
						select: { cardId: true, fullName: true }
					}),
					prismaClient.user.findMany({
						where: { cardId: { in: cardIds } },
						select: { cardId: true, name: true }
					})
				])
			: [[], []];
		const operatorNames: Record<string, string> = Object.fromEntries([
			...users.map((user) => [String(user.cardId), user.name]),
			...operators.map((operator) => [String(operator.cardId), operator.fullName])
		]);

		const descriptionsByCode = new Map<string, Set<string>>();
		for (const item of scrapCodes) {
			const descriptions = descriptionsByCode.get(item.Reason_Code) ?? new Set<string>();
			if (item.Reason_Description) descriptions.add(item.Reason_Description);
			descriptionsByCode.set(item.Reason_Code, descriptions);
		}
		const scrapCodeOptions = [...descriptionsByCode].map(([code, descriptions]) => ({
			id: code,
			code,
			name: [...descriptions].join(' / ') || 'No description'
		}));

		return {
			records,
			operatorNames,
			totalRecords,
			totalPages: Math.ceil(totalRecords / pageSize),
			totalQuantity: totalQuantityForCategory._sum.quantity ?? 0,
			canDelete: Boolean(dbUser && deleteRoles.includes(dbUser.role)),
			category,
			projects,
			partGroups: partGroups.map((group) => group.name),
			scrapCodeOptions,
			categorySummaries: [
				{
					id: 'rebuild',
					title: 'Rebuild',
					count: rebuildCount,
					quantity: rebuildQuantity._sum.quantity ?? 0
				},
				{
					id: 'scrap',
					title: 'Scrap',
					count: scrapCount,
					quantity: scrapQuantity._sum.quantity ?? 0
				},
				{
					id: 'quantity',
					title: 'Quantity Scrap',
					count: quantityCount,
					quantity: quantitySum._sum.quantity ?? 0
				}
			]
		};
	} catch (err) {
		console.error('Failed to load scrap records:', err);
		throw error(500, { message: 'Nepodarilo sa načítať scrap records.' });
	}
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteScrapRecord: async (event) => {
		const formData = await event.request.formData();
		const rawId = formData.get('deleteId');
		const id = typeof rawId === 'string' ? Number(rawId) : Number.NaN;

		if (!Number.isSafeInteger(id) || id <= 0) {
			return fail(400, {
				success: false,
				message: 'Neplatný scrap record.',
				error: 'ID záznamu chýba alebo nie je platné.'
			});
		}

		const { user } = await getUserServer({ request: event.request });
		if (!user) {
			return fail(403, {
				success: false,
				message: 'Nemáš oprávnenie na vymazanie záznamu.'
			});
		}

		try {
			const dbUser = await prismaClient.user.findUnique({
				where: { id: user.id },
				select: { role: true }
			});
			if (!dbUser || !deleteRoles.includes(dbUser.role)) {
				return fail(403, {
					success: false,
					message: 'Mazanie scrap records je povolené len pre ADMIN, MODERATOR a ENGINEER.'
				});
			}

			const deletedRecord = await prismaClient.scrapRecord.delete({ where: { id } });
			const logResult = await writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'ScrapRecord',
				entityId: deletedRecord.id
			});
			if (logResult && !logResult.success) {
				console.error('Failed to log scrap record deletion:', logResult.error);
			}

			return {
				success: true,
				message: `Scrap record ${deletedRecord.id} was deleted.`
			};
		} catch (err) {
			console.error('Failed to delete scrap record:', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa vymazať scrap record.',
				error: 'Skús to znova alebo kontaktuj správcu.'
			});
		}
	}
};
