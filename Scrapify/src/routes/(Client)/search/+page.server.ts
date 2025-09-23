import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import type { Prisma } from '@prisma/client';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		partNumber: event.url.searchParams.get('partNumber')?.trim(),
		partId: Number(event.url.searchParams.get('partId')),
		scrapCode: event.url.searchParams.get('scrapCode')?.trim(),
		processName: Number(event.url.searchParams.get('processName')),
		dateFrom: event.url.searchParams.get('dateFrom')?.trim(),
		dateTo: event.url.searchParams.get('dateTo')?.trim()
	};

	const where: Prisma.ScrapRecordWhereInput = {};
	const partWhere: Prisma.PartWhereInput = {};
	if (filters.partNumber) {
		if (!where.part) where.part = {};
		partWhere.partNumber = { contains: filters.partNumber };
	}
	if (filters.partId) {
		partWhere.id = filters.partId;
	}

	if (filters.processName) {
		partWhere.process = { id: { equals: filters.processName } };
	}
	if (Object.keys(partWhere).length > 0) {
		where.part = partWhere;
	}
	if (filters.scrapCode) {
		where.scrapCode = { code: { contains: filters.scrapCode } };
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

export const actions: Actions = {
	deleteScrapRecord: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');

		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteScrapRecord = await prismaClient.scrapRecord.delete({
				where: { id: Number(id) }
			});

			return {
				success: true,
				message: `Successful deleted id: ${deleteScrapRecord.id}.`,
				error: false
			};
		} catch (error: any) {
			console.log(error);
			return {
				success: false,
				message: 'Something is wrong, Please try again later.',
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	}
};
