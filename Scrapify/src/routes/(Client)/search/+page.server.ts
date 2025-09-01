import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import type { Prisma } from '@prisma/client';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 5;
	const skip = (page - 1) * limit;

	const filters = {
		partNumber: event.url.searchParams.get('partNumber'),
		partId: Number(event.url.searchParams.get('partId')),
		scrapCode: event.url.searchParams.get('scrapCode'),
		processName: event.url.searchParams.get('processName'),
		dateFrom: event.url.searchParams.get('dateFrom'),
		dateTo: event.url.searchParams.get('dateTo')
	};

	const where: Prisma.ScrapRecordWhereInput = {};
	const partWhere: Prisma.PartWhereInput = {};
	if (filters.partNumber) {
		if (!where.part) where.part = {};
		partWhere.partNumber = { contains: filters.partNumber, mode: 'insensitive' };
	}
	if (filters.partId) {
		partWhere.id = filters.partId;
	}

	if (filters.processName) {
		partWhere.process = { name: { contains: filters.processName, mode: 'insensitive' } };
	}
	if (Object.keys(partWhere).length > 0) {
		where.part = partWhere;
	}
	if (filters.scrapCode) {
		where.scrapCode = { code: { contains: filters.scrapCode, mode: 'insensitive' } };
	}
	// Date filter
	const createdAtFilter: Prisma.DateTimeFilter = {};
	if (filters.dateFrom) {
		createdAtFilter.gte = `${filters.dateFrom}T00:00:00.000Z`;
	}

	if (filters.dateTo) {
		createdAtFilter.lte = `${filters.dateTo}T23:59:59.999Z`;
	}
	if (Object.keys(createdAtFilter).length > 0) {
		where.createdAt = createdAtFilter;
	}

	try {
		const [findRecords, totalRecords, allProcesses] = await Promise.all([
			prismaClient.scrapRecord.findMany({
				where,
				include: { part: true, scrapCode: true },
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' }
			}),

			prismaClient.scrapRecord.count({ where }),
			prismaClient.process.findMany({ select: { name: true, id: true }, orderBy: { id: 'asc' } })
		]);

		const totalPages = Math.ceil(totalRecords / limit);
		// console.log(findRecords);
		return { findRecords, totalRecords, totalPages, allProcesses };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {};

//  id: 2,
//     partId: 3,
//     scrapCodeId: 3,
//     description: 'dasd',
//     quantity: 3,
//     createdBy: '106374',
//     createdAt: 2025-08-21T21:36:31.840Z,
//     part: {
//       id: 3,
//       processId: 12,
//       processName: 'Proc 2',
//       partNumber: '123111111111',
//       side: '',
//       color: 'black'
//     },
//     scrapCode: {
//       id: 3,
//       code: '1235',
//       name: 'scrap3',
//       description: '',
//       active: true
