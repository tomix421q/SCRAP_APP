import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import type { Prisma } from '@prisma/client';
import { getUserServer, writeToLogger } from '@/utils/serverHelp';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
import { getCachedProjects } from '@/server/cacheVprojects';

const pageSize = 100;
const deleteRoles = ['ADMIN', 'MODERATOR', 'ENGINEER'];

function parseDate(value: string | null, field: string) {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw error(400, { message: `Invalid ${field} date filter.` });
	}
	return date;
}

function parseBooleanFilter(value: string | null, field: string) {
	if (!value) return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;
	throw error(400, { message: `Invalid ${field} filter.` });
}

function parseCategory(value: string | null): 'all' | 'rebuild' | 'scrap' | 'quantity' {
	const category = value ?? 'all';
	switch (category) {
		case 'all':
		case 'rebuild':
		case 'scrap':
		case 'quantity':
			return category;
		default:
			throw error(400, { message: 'Invalid scrap record category.' });
	}
}

export const load = (async (event) => {
	const requestedPage = Number(event.url.searchParams.get('page') ?? '1');
	const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const skip = (currentPage - 1) * pageSize;
	const params = event.url.searchParams;

	const commonConditions: Prisma.ScrapRecordWhereInput[] = [];
	const dmc = params.get('dmc')?.trim();
	const scrapCode = params.get('scrapCode')?.trim();
	const partGroup = params.get('partGroup')?.trim();
	const project = params.get('project')?.trim();
	const createdBy = params.get('createdBy')?.trim();
	const dateFrom = parseDate(params.get('dateFrom'), 'from');
	const dateTo = parseDate(params.get('dateTo'), 'to');
	const dateToExclusive = dateTo ? new Date(dateTo.getTime() + 60_000) : undefined;
	const isOtherComponent = parseBooleanFilter(params.get('otherComponent'), 'other component');
	const exported = parseBooleanFilter(params.get('exported'), 'exported');
	const category = parseCategory(params.get('category'));

	if (dateFrom && dateTo && dateFrom > dateTo) {
		throw error(400, { message: 'The start date must be before the end date.' });
	}
	if (dmc) commonConditions.push({ dmc: { contains: dmc } });
	if (scrapCode) commonConditions.push({ scrapCode: { contains: scrapCode } });
	if (partGroup) {
		commonConditions.push({ partGroup: { is: { name: { contains: partGroup } } } });
	}
	if (project) commonConditions.push({ partGroup: { is: { vProject: project } } });
	if (createdBy) commonConditions.push({ createdBy: { contains: createdBy } });
	if (dateFrom || dateTo) {
		commonConditions.push({
			createdAt: {
				...(dateFrom ? { gte: dateFrom } : {}),
				...(dateToExclusive ? { lt: dateToExclusive } : {})
			}
		});
	}
	if (isOtherComponent !== undefined) commonConditions.push({ isOtherComponent });
	if (exported === true) commonConditions.push({ QADExported: true });
	if (exported === false) {
		commonConditions.push({ OR: [{ QADExported: false }, { QADExported: null }] });
	}

	const whereFor = (category: 'rebuild' | 'scrap' | 'quantity'): Prisma.ScrapRecordWhereInput => {
		const categoryConditions: Prisma.ScrapRecordWhereInput[] = [...commonConditions];
		if (category === 'quantity') {
			categoryConditions.push({ dmc: { startsWith: quantityScrapLabelPrefix } });
		} else {
			categoryConditions.push({
				NOT: { dmc: { startsWith: quantityScrapLabelPrefix } }
			});
			categoryConditions.push({ isRebuild: category === 'rebuild' });
		}
		return { AND: categoryConditions };
	};

	const where =
		category === 'all'
			? ({ AND: commonConditions } satisfies Prisma.ScrapRecordWhereInput)
			: whereFor(category);
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
