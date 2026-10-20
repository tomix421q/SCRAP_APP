import { error, fail, type ActionFailure, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { toFuzzyPattern, writeToLogger } from '@/utils/serverHelp';
import type { Prisma } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		scrapCode: event.url.searchParams.get('scrapCode'),
		vProjectName: event.url.searchParams.get('vProject'),
		description: event.url.searchParams.get('description') as string,
		scrapName: event.url.searchParams.get('scrapName') as string
	};
	// console.log(filters);
	const where: Prisma.ScrapCodeWhereInput = {};
	if (filters.scrapCode) {
		where.code = { contains: toFuzzyPattern(filters.scrapCode) };
	}
	if (filters.vProjectName) {
		where.vProject = { contains: toFuzzyPattern(filters.vProjectName) };
	}
	if (filters.description) {
		where.description = { contains: toFuzzyPattern(filters.description) };
	}
	if (filters.scrapName) {
		where.name = { contains: toFuzzyPattern(filters.scrapName) };
	}

	try {
		const findScCodes = await prismaClient.scrapCode.findMany({
			where,
			skip,
			take: limit,
			orderBy: { id: 'desc' }
		});
		const scrapCodeCount = await prismaClient.scrapCode.count({ where });
		const totalPages = Math.ceil(scrapCodeCount / limit);
		const data = {
			scrapCodes: findScCodes,
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
		const vProject = formData.get('vProject') as string;
		const scrapcodeNum = (formData.get('scrapcodeNum') ?? '') as string;
		const scrapcodeName = (formData.get('scrapcodeName') ?? '') as string;
		const scrapDescription = (formData.get('scrapDescription') ?? '') as string;

		if (!scrapcodeNum || !scrapcodeName) {
			return fail(400, {
				success: false,
				error: 'Scrap code number and scrap name are required.Please complete it.',
				message: 'Validation error'
			});
		}
		if (!vProject) {
			return fail(400, {
				success: false,
				error: 'Project is required. Please select project.',
				message: 'Validation error'
			});
		}
		if (scrapcodeNum.length > 100 || scrapcodeName.length > 100 || scrapDescription.length > 100) {
			return fail(400, {
				success: false,
				error:
					'Scrap code max 100 characters,Scrap name max 100 characters,Description max 100 characters',
				message: 'Validation error'
			});
		}

		try {
			const createScrap = await prismaClient.scrapCode.create({
				data: {
					code: scrapcodeNum,
					vProject,
					name: scrapcodeName,
					description: scrapDescription
				}
			});

			if (!createScrap) {
				return fail(500, {
					success: false,
					error: true,
					message: `Problem with create scrap in db.`
				});
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
			if (error.code === 'P2002') {
				return fail(500, {
					success: false,
					message: 'This scrapcode with this code and project already exist'
				});
			}
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
		const vProject = formData.get('vProject') as string;
		const scrapcodeNum = (formData.get('scrapcodeNum') ?? '') as string;
		const scrapcodeName = (formData.get('scrapcodeName') ?? '') as string;
		const scrapDescription = (formData.get('scrapDescription') ?? '') as string;

		if (!scrapcodeNum || !scrapcodeName) {
			return fail(400, {
				success: false,
				error: 'Scrap code number and scrap name are required.Please complete it.',
				message: 'Validation error'
			});
		}
		if (!vProject) {
			return fail(400, {
				success: false,
				error: 'Project is required. Please select a project.',
				message: 'Validation error'
			});
		}
		if (scrapcodeNum.length > 100 || scrapcodeName.length > 100 || scrapDescription.length > 100) {
			return fail(400, {
				success: false,
				error:
					'Scrap code max 100 characters,Scrap name max 100 characters,Description max 100 characters',
				message: 'Validation error'
			});
		}

		try {
			const findScrapcode = await prismaClient.scrapCode.findFirst({
				where: { id: Number(scrapCodeId) }
			});

			if (!findScrapcode) {
				return fail(500, {
					success: false,
					error: true,
					message: `Scrap code with id ${scrapCodeId}`
				});
			} else {
				const editSc = await prismaClient.scrapCode.update({
					where: {
						id: Number(findScrapcode.id)
					},
					data: {
						code: scrapcodeNum,
						vProject: vProject,
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
			if (error.code === 'P2002') {
				return fail(500, {
					success: false,
					message: 'This scrapcode with this code and project already exist'
				});
			}
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
