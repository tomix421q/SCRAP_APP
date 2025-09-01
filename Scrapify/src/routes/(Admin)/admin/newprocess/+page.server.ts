import { error, fail, type Action } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';

export const load: PageServerLoad = async (event) => {
	try {
		const [allProcesses, allProjects, allHalls] = await Promise.all([
			prismaClient.process.findMany({ orderBy: { id: 'desc' } }),
			prismaClient.project.findMany(),
			prismaClient.hall.findMany()
		]);
		const data = {
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
	createProcess: async (event) => {
		const formData = await event.request.formData();
		const hallId = formData.get('hallId') as string;
		const projectId = formData.get('projectId') as string;
		const processName = formData.get('processName') as string;
		const processDescription = formData.get('processDescription') as string;

		if (!hallId || !projectId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall and project are required.Please select hall and project.'
			});
		}

		try {
			const [findHall, findProject] = await Promise.all([
				prismaClient.hall.findFirst({ where: { id: parseInt(hallId, 10) } }),
				prismaClient.project.findFirst({
					where: { id: parseInt(projectId, 10) }
				})
			]);
			if (!findHall || !findProject) {
				return fail(404, {
					success: false,
					error: true,
					message: `Hall with ID ${hallId} or project with ID ${projectId} not found.`
				});
			}

			await prismaClient.process.create({
				data: {
					projectId: findProject.id,
					name: processName,
					description: processDescription
				}
			});
			return { success: true, message: 'Process created successfully.' };
		} catch (error: any) {
			console.log(error);
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	}
} satisfies Actions;
