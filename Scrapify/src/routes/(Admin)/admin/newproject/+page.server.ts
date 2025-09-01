import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	try {
		const projects = await prismaClient.project.findMany({
			orderBy: {
				id: 'desc'
			}
		});
		const halls = await prismaClient.hall.findMany();

		return { data: { projects, halls } };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {
	createProject: async (event) => {
		const formData = await event.request.formData();
		const hallId = formData.get('hallId') as string;
		const projectName = formData.get('projectName') as string;
		const projectDescription = formData.get('projectDescription') as string;

		if (!hallId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall is required. Please select a hall.'
			});
		}
		try {
			const findHall = await prismaClient.hall.findFirst({
				where: {
					id: parseInt(hallId, 10)
				}
			});
			if (!findHall) {
				return fail(404, {
					success: false,
					message: 'Hall with this ID does not exist.',
					error: true
				});
			}
			await prismaClient.project.create({
				data: {
					hallId: findHall.id,
					name: projectName,
					description: projectDescription
				}
			});
			return {
				success: true,
				message: 'Project created successfully'
			};
		} catch (error: any) {
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	}
};
