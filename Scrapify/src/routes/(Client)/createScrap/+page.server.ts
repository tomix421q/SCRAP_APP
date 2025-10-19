import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import { scrapRecordSchema } from '@/utils/zod';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { writeToLogger } from '@/utils/serverHelp';

export const load: PageServerLoad = async (event) => {
	const filters = {
		processId: event.url.searchParams.get('processId')
	};
	const processId = filters.processId ? Number(filters.processId) : undefined;
	try {
		const allProcess = await prismaClient.process.findMany({
			include: { project: { include: { hall: { select: { name: true } } } } }
		});
		const allParts = await prismaClient.part.findMany({
			where: { processId: processId }
		});
		const scrapCodes = await prismaClient.scrapCode.findMany({
			where: { processId: processId }
		});
		const scrapRecords = await prismaClient.scrapRecord.findMany({
			include: { part: true, scrapCode: true },
			orderBy: { createdAt: 'desc' },
			take: 20,
			where: { part: { processId: processId } }
		});
		const totalPartsQnt = await prismaClient.scrapRecord.aggregate({
			_sum: {
				quantity: true
			}
		});
		const data = {
			processes: allProcess,
			parts: allParts,
			scrapCodes: scrapCodes,
			scrapRecords: scrapRecords,
			totalPartsQnt
		};
		return { data };
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
	createScrap: async (event) => {
		const formData = await event.request.formData();

		const formDataRaw = {
			partId: formData.get('partId'),
			scrapId: formData.get('scrapCodeId'),
			description: formData.get('description'),
			quantity: formData.get('quantity'),
			operatorId: formData.get('operatorId')
		};
		const parseZod = scrapRecordSchema.safeParse(formDataRaw);
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
				const [findPartId, findScrapId, isOperator, isUser] = await Promise.all([
					prismaClient.part.findFirst({ where: { id: parseZod.data.partId } }),
					prismaClient.scrapCode.findFirst({ where: { id: parseZod.data.scrapId } }),
					prismaClient.operator.findFirst({ where: { cardId: Number(parseZod.data.operatorId) } }),
					prismaClient.user.findFirst({ where: { cardId: Number(parseZod.data.operatorId) } })
				]);
				console.log(isOperator, isUser);
				if (!findPartId || !findScrapId) {
					return fail(404, {
						success: false,
						error: true,
						message: `Part with id ${parseZod.data.partId} or ${parseZod.data.scrapId} not found in DB.`
					});
				}
				if (!isOperator && !isUser) {
					return fail(404, {
						success: false,
						message: 'Card ID not found in DB.',
						error: `Toto card ID - ${parseZod.data.operatorId} neexistuje zadaj prosim platne card ID alebo kontaktuj procesneho inziniera.`
					});
				}
				await prismaClient.scrapRecord.create({
					data: {
						partId: findPartId.id,
						scrapCodeId: findScrapId.id,
						description: parseZod.data.description,
						quantity: parseZod.data.quantity,
						createdBy: parseZod.data.operatorId
					}
				});

				return { success: true, message: 'Scrap vytvoreny uspesne.Dakujeme.' };
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
				entityType: 'ScrapCode',
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
