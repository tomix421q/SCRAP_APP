import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;
	try {
		const [allProcesses, allProjects] = await Promise.all([
			prismaClient.process.findMany({
				skip,
				take: limit,
				orderBy: { id: 'desc' },
				include: { project: true, parts: true }
			}),
			prismaClient.project.findMany(),
			prismaClient.hall.findMany()
		]);
		const processCount = await prismaClient.process.count();
		const totalPages = Math.ceil(processCount / limit);
		const data = {
			processes: allProcesses,
			projects: allProjects,
			processCount,
			totalPages
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
		const projectId = formData.get('projectId') as string;
		const processName = formData.get('processName') as string;
		const processDescription = formData.get('processDescription') as string;

		if (!projectId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall and project are required.Please select hall and project.'
			});
		}

		try {
			const [findProject] = await Promise.all([
				prismaClient.project.findFirst({
					where: { id: parseInt(projectId, 10) }
				})
			]);
			if (!findProject) {
				return fail(404, {
					success: false,
					error: true,
					message: `Project with ID ${projectId} not found.`
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
	},
	deleteProcess: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');

		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteItem = await prismaClient.process.delete({ where: { id: Number(id) } });

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
