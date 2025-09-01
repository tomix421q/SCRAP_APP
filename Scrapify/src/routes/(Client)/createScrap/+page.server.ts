import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { scrapRecordSchema } from '@/utils/zod';

export const load: PageServerLoad = async (event) => {
	try {
		const allParts = await prismaClient.part.findMany();
		const scrapCodes = await prismaClient.scrapCode.findMany();
		const scrapRecords = await prismaClient.scrapRecord.findMany({
			include: { part: true, scrapCode: true },
			orderBy: { createdBy: 'desc' },
			take: 20
		});

		const data = {
			parts: allParts,
			scrapCodes: scrapCodes,
			scrapRecords: scrapRecords
		};
		return { data };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {
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
				const [findPartId, findScrapId] = await Promise.all([
					prismaClient.part.findFirst({ where: { id: parseZod.data?.partId } }),
					prismaClient.scrapCode.findFirst({ where: { id: parseZod.data.scrapId } })
				]);
				if (!findPartId || !findScrapId) {
					return fail(404, {
						success: false,
						error: true,
						message: `Part with id ${parseZod.data.partId} or ${parseZod.data.scrapId} not found in DB.`
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

				return { success: true, message: 'Scrap vytvoreny uspesne.Dakujeme :).' };
			}
		} catch (error: any) {
			return fail(500, {
				success: false,
				error: error.message || 'Unknown error',
				message: `Something is wrong :( Please try again later. ${error.message ? `Error ${error.message}` : error}`
			});
		}
	}
};
