import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;
	try {
		const [allParts, allProcesses, allProjects, allHalls] = await Promise.all([
			prismaClient.part.findMany({ skip, take: limit, orderBy: { id: 'desc' } }),
			prismaClient.process.findMany(),
			prismaClient.project.findMany(),
			prismaClient.hall.findMany()
		]);
		const partsCount = await prismaClient.part.count();
		const totalPages = Math.ceil(partsCount / limit);
		const data = {
			parts: allParts,
			processes: allProcesses,
			projects: allProjects,
			halls: allHalls,
			totalPages,
			partsCount
		};

		return { data };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions = {
	createPart: async (event) => {
		const formData = await event.request.formData();
		const hallId = formData.get('hallId') as string;
		const projectId = formData.get('projectId') as string;
		const processId = formData.get('processId') as string;
		const partProdNumberId = formData.get('partNumber') as string;
		const partSide = formData.get('partSide') as string;
		console.log(formData);

		if (!hallId || !projectId || !processId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall, project and process are required.Please select hall and project.'
			});
		}
		try {
			const [findHall, findProject, findProcess] = await Promise.all([
				prismaClient.hall.findFirst({ where: { id: parseInt(hallId, 10) } }),
				prismaClient.project.findFirst({ where: { id: parseInt(projectId, 10) } }),
				prismaClient.process.findFirst({ where: { id: parseInt(processId, 10) } })
			]);
			if (!findHall || !findProject || !findProcess) {
				return fail(404, {
					success: false,
					error: true,
					message: `Hall with ID ${hallId} or project with ID ${projectId} or process with ID ${processId} not found.`
				});
			}
			await prismaClient.part.create({
				data: {
					processId: findProcess.id,
					processName: findProcess.name,
					projectName: findProject.name,
					hallName: findHall.name,
					partNumber: partProdNumberId,
					side: partSide
				}
			});
			return { success: true, message: 'Part created successfully.' };
		} catch (error: any) {
			return fail(500, {
				success: false,
				error: error.message || 'Unknown error',
				message: `Something is wrong :( Please try again later. ${error.message ? `Error ${error.message}` : error}`
			});
		}
	},
	deletePart: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');

		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteItem = await prismaClient.part.delete({ where: { id: Number(id) } });

			return {
				success: true,
				message: `Successful deleted id: ${deleteItem.partNumber}.`,
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
