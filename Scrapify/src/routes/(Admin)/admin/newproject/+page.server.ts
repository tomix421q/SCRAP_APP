import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;
	try {
		const projects = await prismaClient.project.findMany({
			skip,
			take: limit,
			orderBy: { id: 'desc' }
		});
		const halls = await prismaClient.hall.findMany();
		const projectsCount = await prismaClient.project.count();
		const totalPages = Math.ceil(projectsCount / limit);

		return { data: { projects, halls, projectsCount, totalPages } };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {
	createProject: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
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
		if (projectName.length > 20 || projectDescription.length > 200) {
			return fail(400, {
				success: false,
				error: 'Name max 20 characters,description max 200 characters.',
				message: 'Validation error'
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
	},
	editProject: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const hallId = formData.get('hallId') as string;
		const projectName = formData.get('projectName') as string;
		const projectDescription = formData.get('projectDescription') as string;
		const projectId = formData.get('projectId') as string;

		if (!hallId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall is required. Please select a hall.'
			});
		}
		if (projectName.length > 20 || projectDescription.length > 200) {
			return fail(400, {
				success: false,
				error: 'Name max 20 characters,description max 200 characters.',
				message: 'Validation error'
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
			const findProject = await prismaClient.project.findFirst({
				where: { id: Number(projectId) }
			});
			if (!findProject) {
				return fail(404, {
					success: false,
					error: true,
					message: `Project with ID : ${projectId} not found.`
				});
			} else {
				await prismaClient.project.update({
					where: {
						id: findProject.id
					},
					data: {
						hallId: findHall.id,
						name: projectName,
						description: projectDescription
					}
				});
				return {
					success: true,
					message: `Project with ID ${projectId} edited successfully.`
				};
			}
		} catch (error: any) {
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	},
	deleteProject: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');
		console.log(id);

		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteItem = await prismaClient.project.delete({ where: { id: Number(id) } });

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
};
