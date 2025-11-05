import { writeToLogger } from '@/utils/serverHelp';
import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import type { Prisma } from '@prisma/client';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { scrapRecordSchema } from '@/utils/zod';

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
		const [findRecords, totalRecords, allProcesses, totalPartQnt] = await Promise.all([
			prismaClient.scrapRecord.findMany({
				where,
				include: { part: { include: { process: true } }, scrapCode: true },
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' }
			}),
			prismaClient.scrapRecord.count({ where }),
			prismaClient.process.findMany({ select: { name: true, id: true }, orderBy: { id: 'asc' } }),
			prismaClient.scrapRecord.aggregate({
				where,
				_sum: {
					quantity: true
				}
			})
		]);

		const totalPages = Math.ceil(totalRecords / limit);

		// Lazy load
		const allPartsPromise = (async () => {
			return prismaClient.part.findMany();
		})();

		const scrapCodesPromise = (async () => {
			return prismaClient.scrapCode.findMany();
		})();

		// console.log(totalPartQnt);
		return {
			findRecords,
			totalRecords,
			totalPages,
			allProcesses,
			totalPartQnt,
			allPartsPromise,
			scrapCodesPromise
		};
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {
	editSearchScrapRecord: async (event) => {
		const formData = await event.request.formData();

		const formDataRaw = {
			scrapRecordId: formData.get('scrapRecordId'),
			partId: formData.get('partId'),
			scrapId: formData.get('scrapCodeId'),
			description: formData.get('description'),
			quantity: formData.get('quantity'),
			operatorId: formData.get('operatorId')
		};
		const parseZod = scrapRecordSchema.safeParse(formDataRaw);
		if (!formDataRaw.scrapRecordId) {
			return fail(400, {
				success: false,
				message: 'Validation error',
				error: `Scrap record id:${formDataRaw.scrapRecordId} not found.`
			});
		}
		if (!parseZod.success) {
			const fieldErrors = parseZod.error.flatten().fieldErrors;
			return fail(400, {
				success: false,
				message: 'Validation error',
				error: fieldErrors
			});
		}

		try {
			if (parseZod.success) {
				const [findScrapRecord, findPartId, findScrapId] = await Promise.all([
					prismaClient.scrapRecord.findFirst({
						where: { id: Number(parseZod.data.scrapRecordId) }
					}),
					prismaClient.part.findFirst({ where: { id: parseZod.data.partId } }),
					prismaClient.scrapCode.findFirst({ where: { id: parseZod.data.scrapId } })
				]);

				if (!findScrapId) {
					return fail(404, {
						success: false,
						error: true,
						message: `Scrap record with id ${parseZod.data.scrapRecordId} not found in DB.`
					});
				}
				if (!findPartId || !findScrapId) {
					return fail(404, {
						success: false,
						error: true,
						message: `Part with id ${parseZod.data.partId} or ${parseZod.data.scrapId} not found in DB.`
					});
				}

				if (findScrapRecord && findPartId && findScrapId) {
					const editSc = await prismaClient.scrapRecord.update({
						where: {
							id: findScrapRecord.id
						},
						data: {
							partId: findPartId.id,
							scrapCodeId: findScrapId.id,
							description: parseZod.data.description,
							quantity: parseZod.data.quantity,
							createdBy: parseZod.data.operatorId
						}
					});

					writeToLogger({
						request: event.request,
						action: 'EDIT',
						entityType: 'ScrapRecord',
						entityId: editSc.id
					});
					return {
						success: true,
						message: `Scrap record with id ${findScrapRecord.id} updated successfully.`
					};
				}
			} else {
			}
		} catch (error: any) {
			return fail(500, {
				success: false,
				error: error.message || 'Unknown error',
				message: `Something is wrong :( Please try again later. ${error.message ? `Error ${error.message}` : error}`
			});
		}
	},
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

			writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'ScrapRecord',
				entityId: deleteScrapRecord.id
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
