import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { writeToLogger } from '@/utils/serverHelp';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;
	try {
		const [allProcesses, allProjects, allHalls] = await Promise.all([
			prismaClient.process.findMany({
				skip,
				take: limit,
				orderBy: { id: 'desc' },
				include: {
					project: { include: { project: true } },
					parts: { include: { process: true } },
					hall: true
				}
			}),
			prismaClient.project.findMany(),
			prismaClient.hall.findMany()
		]);
		const processCount = await prismaClient.process.count();
		const totalPages = Math.ceil(processCount / limit);
		const data = {
			processes: allProcesses,
			projects: allProjects,
			halls: allHalls,
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
	createProcess: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const projectIdsString = formData.getAll('projectId') as string[];
		const processName = formData.get('processName') as string;
		const processDescription = formData.get('processDescription') as string;
		const hallId = formData.get('hallId') as string;

		const projectIds = projectIdsString.map((id) => Number(id));
		if (projectIds.some(isNaN)) {
			return fail(400, {
				error: 'Not valid project ID.',
				success: false,
				message: 'Validation error'
			});
		}

		if (!hallId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall is required.Please select hall.'
			});
		}

		if (projectIdsString.length === 0) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Project is required.Please select project.'
			});
		}
		if (processName.length > 30 || processDescription.length > 200) {
			return fail(400, {
				success: false,
				error: 'Name max 20 characters,description max 200 characters.',
				message: 'Validation error'
			});
		}

		try {
			const [findProject] = await Promise.all([
				prismaClient.project.findMany({
					where: { id: { in: projectIds } },
					select: { id: true }
				})
			]);
			if (!findProject || findProject.length !== projectIds.length) {
				return fail(404, {
					success: false,
					error: true,
					message: `Some project with IDs: ${projectIds} not found in db.`
				});
			}

			const createProcess = await prismaClient.process.create({
				data: {
					name: processName,
					description: processDescription,
					hallId: Number(hallId),
					project: {
						create: projectIds.map((id) => ({ project: { connect: { id: id } } }))
					}
				}
			});
			writeToLogger({
				request: event.request,
				action: 'CREATE',
				entityType: 'Process',
				entityId: createProcess.id
			});
			return { success: true, message: `Process ${processName} created successfully.` };
		} catch (error: any) {
			console.log(error);
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	},
	editProcess: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const projectIdsString = formData.getAll('projectId') as string[];
		const processId = formData.get('processId') as string;
		const processName = formData.get('processName') as string;
		const processDescription = formData.get('processDescription') as string;
		const hallId = formData.get('hallId') as string;
		const projectIds = projectIdsString.map((id) => Number(id));

		if (!hallId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Hall is required.Please select hall.'
			});
		}
		if (projectIds.some(isNaN)) {
			return fail(400, {
				error: 'Not valid project ID.',
				success: false,
				message: 'Validation error'
			});
		}

		if (projectIdsString.length === 0) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Project is required.Please select project.'
			});
		}
		if (processName.length > 30 || processDescription.length > 200) {
			return fail(400, {
				success: false,
				error: 'Name max 30 characters,description max 200 characters.',
				message: 'Validation error'
			});
		}

		try {
			const findProject = await prismaClient.project.findMany({
				where: { id: { in: projectIds } },
				select: { id: true }
			});
			const findProcess = await prismaClient.process.findFirst({
				where: { id: Number(processId) }
			});
			if (!findProject || !findProcess) {
				return fail(404, {
					success: false,
					error: true,
					message: `Project with id ${projectIdsString} or process with id ${processId} not found.`
				});
			} else {
				const updateProcess = await prismaClient.process.update({
					where: {
						id: findProcess.id
					},
					data: {
						name: processName,
						hallId: Number(hallId),
						description: processDescription,
						project: {
							deleteMany: {},
							create: projectIds.map((projectId) => ({ project: { connect: { id: projectId } } }))
						}
					}
				});
				writeToLogger({
					request: event.request,
					action: 'EDIT',
					entityType: 'Process',
					entityId: updateProcess.id
				});
				return {
					success: true,
					message: `Process with ID ${processId}-${findProcess.name} edited successfully.`
				};
			}
		} catch (error: any) {
			return {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			};
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

			writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'Process',
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
