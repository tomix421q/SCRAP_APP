import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	try {
		const [allParts, allProcesses, allProjects, allHalls] = await Promise.all([
			prismaClient.part.findMany({ orderBy: { id: 'desc' } }),
			prismaClient.process.findMany(),
			prismaClient.project.findMany(),
			prismaClient.hall.findMany()
		]);
		const data = {
			parts: allParts,
			processes: allProcesses,
			projects: allProjects,
			halls: allHalls
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
		const partColor = formData.get('partColor') as string;
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
					side: partSide,
					color: partColor
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
	editPart: async (event) => {}
} satisfies Actions;
