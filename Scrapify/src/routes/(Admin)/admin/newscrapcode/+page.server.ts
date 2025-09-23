import { error, fail, type ActionFailure, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;
	try {
		const findScCodes = await prismaClient.scrapCode.findMany({
			skip,
			take: limit,
			orderBy: { id: 'desc' }
		});
		const findProcesses = await prismaClient.process.findMany();

		const scrapCodeCount = await prismaClient.scrapCode.count();
		const totalPages = Math.ceil(scrapCodeCount / limit);
		const data = {
			scrapCodes: findScCodes,
			processes: findProcesses,
			scrapCodeCount,
			totalPages
		};
		return { data };
	} catch (err) {
		throw error(500, { message: `${err}` });
	}
};

export const actions = {
	createScrap: async (event) => {
		const formData = await event.request.formData();
		const processId = formData.get('processId') as String;
		const scrapcodeNum = formData.get('scrapcodeNum') as string;
		const scrapcodeName = formData.get('scrapcodeName') as string;
		const scrapDescription = formData.get('scrapDescription') as string;

		if (!scrapcodeNum || !scrapcodeName) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Scrap code number and scrap name are required.Please complete it.'
			});
		}
		if (!processId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Process is required. Please select a process.'
			});
		}
		try {
			const createScrap = await prismaClient.scrapCode.create({
				data: {
					code: scrapcodeNum,
					processId: Number(processId),
					name: scrapcodeName,
					description: scrapDescription
				}
			});
			if (!createScrap) {
				return fail(500, { success: false, message: `Problem create in db.` });
			}
			return { success: true, message: 'Scrap code created successfully.' };
		} catch (err) {
			fail(500, { message: `${err}` });
		}
	},
	deleteScrapCode: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');
		console.log(id);
		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteItem = await prismaClient.scrapCode.delete({ where: { id: Number(id) } });

			return {
				success: true,
				message: `Successful deleted id: ${deleteItem.id}, with name ${deleteItem.name}`,
				error: false
			};
		} catch (error: any) {
			return {
				success: false,
				message: 'Something is wrong, Please try again later.',
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	}
} satisfies Actions;
