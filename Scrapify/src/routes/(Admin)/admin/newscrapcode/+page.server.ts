import { error, fail, type ActionFailure, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { writeToLogger } from '@/utils/serverHelp';
import type { Prisma } from '../../../../../prisma/generated/client/client';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;

	const filters = {
		scrapCode: event.url.searchParams.get('scrapCode')?.trim(),
		processName: Number(event.url.searchParams.get('processName'))
	};

	const where: Prisma.ScrapCodeWhereInput = {};
	if (filters.scrapCode) {
		where.code = { equals: filters.scrapCode };
	}
	if (filters.processName) {
		where.processId = { equals: filters.processName };
	}

	try {
		const findScCodes = await prismaClient.scrapCode.findMany({
			where,
			skip,
			take: limit,
			orderBy: { id: 'desc' }
		});
		const findProcesses = await prismaClient.process.findMany();

		const scrapCodeCount = await prismaClient.scrapCode.count({ where });
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
	createScrap: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const processId = formData.get('processId') as String;
		const scrapcodeNum = formData.get('scrapcodeNum') as string;
		const scrapcodeName = formData.get('scrapcodeName') as string;
		const scrapDescription = formData.get('scrapDescription') as string;

		if (!scrapcodeNum || !scrapcodeName) {
			return fail(400, {
				success: false,
				error: 'Scrap code number and scrap name are required.Please complete it.',
				message: 'Validation error'
			});
		}
		if (!processId) {
			return fail(400, {
				success: false,
				error: 'Process is required. Please select a process.',
				message: 'Validation error'
			});
		}
		if (scrapcodeNum.length > 100 || scrapcodeName.length > 100 || scrapDescription.length > 200) {
			return fail(400, {
				success: false,
				error:
					'Scrap code max 100 characters,Scrap name max 100 characters,Description max 200 characters',
				message: 'Validation error'
			});
		}

		try {
			const [findProcess, createScrap] = await Promise.all([
				prismaClient.process.findFirst({ where: { id: Number(processId) } }),
				prismaClient.scrapCode.create({
					data: {
						code: scrapcodeNum,
						processId: Number(processId),
						name: scrapcodeName,
						description: scrapDescription
					}
				})
			]);

			if (!findProcess) {
				return fail(500, {
					success: false,
					error: true,
					message: `Problem with find process ${processId},please select any process.`
				});
			}
			if (!createScrap) {
				return fail(500, { success: false, error: true, message: `Problem with create in db.` });
			}

			writeToLogger({
				request: event.request,
				action: 'CREATE',
				entityType: 'ScrapCode',
				entityId: createScrap.id
			});
			return { success: true, error: true, message: 'Scrap code created successfully.' };
		} catch (error: any) {
			console.log(error);
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	},
	editScrap: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const scrapCodeId = formData.get('scrapCodeId') as String;
		const processId = formData.get('processId') as String;
		const scrapcodeNum = formData.get('scrapcodeNum') as string;
		const scrapcodeName = formData.get('scrapcodeName') as string;
		const scrapDescription = formData.get('scrapDescription') as string;

		if (!scrapcodeNum || !scrapcodeName) {
			return fail(400, {
				success: false,
				error: 'Scrap code number and scrap name are required.Please complete it.',
				message: 'Validation error'
			});
		}
		if (!processId) {
			return fail(400, {
				success: false,
				error: 'Process is required. Please select a process.',
				message: 'Validation error'
			});
		}
		if (scrapcodeNum.length > 100 || scrapcodeName.length > 100 || scrapDescription.length > 200) {
			return fail(400, {
				success: false,
				error:
					'Scrap code max 100 characters,Scrap name max 100 characters,Description max 200 characters',
				message: 'Validation error'
			});
		}

		try {
			const [findScrapCode, findProcess] = await Promise.all([
				prismaClient.scrapCode.findFirst({ where: { id: Number(scrapCodeId) } }),
				prismaClient.process.findFirst({ where: { id: Number(processId) } })
			]);

			if (!findScrapCode || !findProcess) {
				return fail(500, {
					success: false,
					error: true,
					message: `Scrap code with id ${scrapCodeId} or process with id ${processId} not found.`
				});
			} else {
				const editSc = await prismaClient.scrapCode.update({
					where: {
						id: Number(findScrapCode.id)
					},
					data: {
						code: scrapcodeNum,
						processId: Number(processId),
						name: scrapcodeName,
						description: scrapDescription
					}
				});

				writeToLogger({
					request: event.request,
					action: 'EDIT',
					entityType: 'ScrapCode',
					entityId: editSc.id
				});
				return {
					success: true,
					error: true,
					message: `Scrap code with ID ${scrapCodeId} edited successfully.`
				};
			}
		} catch (error: any) {
			console.log(error);
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	},

	deleteScrapCode: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');

		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteItem = await prismaClient.scrapCode.delete({ where: { id: Number(id) } });

			writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'ScrapCode',
				entityId: deleteItem.id
			});
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
