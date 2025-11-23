import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { writeToLogger } from '@/utils/serverHelp';
import type { Prisma } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
	const processId = event.url.searchParams.get('processId');
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		partNumber: event.url.searchParams.get('partNumber')?.trim(),
		partId: Number(event.url.searchParams.get('partId')),
		processName: Number(event.url.searchParams.get('processName')),
		projectName: Number(event.url.searchParams.get('projectName'))
	};

	const where: Prisma.PartWhereInput = {};
	if (filters.partNumber) {
		where.partNumber = { contains: filters.partNumber };
	}
	if (filters.partId) {
		where.id = filters.partId;
	}
	if (filters.processName) {
		where.processId = { equals: filters.processName };
	}
	if (filters.projectName) {
		where.project = { id: { equals: filters.projectName } };
	}

	try {
		const [allParts, allProcesses, allProjectsForProcess, allProjects, allHalls] =
			await Promise.all([
				prismaClient.part.findMany({
					where,
					skip,
					take: limit,
					orderBy: { id: 'desc' },
					include: { process: { include: { hall: true } }, project: true }
				}),
				prismaClient.process.findMany(),
				prismaClient.project.findMany({
					include: { processes: true },
					where: { processes: { some: { processId: Number(processId) } } }
				}),
				prismaClient.project.findMany(),
				prismaClient.hall.findMany()
			]);
		const partsCount = await prismaClient.part.count({ where });
		const totalPages = Math.ceil(partsCount / limit);
		const data = {
			parts: allParts,
			processes: allProcesses,
			projectsForProcess: allProjectsForProcess,
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
		const processId = formData.get('processId') as string;
		const partProdNumberId = formData.get('partNumber') as string;
		const partSide = formData.get('partSide') as string;
		const projectId = formData.get('projectId') as string;

		if (!processId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Process is required.Please select process.'
			});
		}
		if (!projectId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Project is required.Please select project.'
			});
		}
		if (partProdNumberId.length > 100) {
			return fail(400, {
				success: false,
				error: 'Max 100 characters for part number.',
				message: 'Validation error'
			});
		}
		try {
			const [findProcess, findSpecificProject] = await Promise.all([
				prismaClient.process.findFirst({
					where: { id: parseInt(processId, 10) },
					include: {
						project: { select: { project: { select: { id: true, name: true } } } }
					}
				}),
				prismaClient.project.findFirst({
					where: { id: Number(projectId) }
				})
			]);

			if (!findProcess || !findSpecificProject) {
				return fail(404, {
					success: false,
					error: true,
					message: `Process with ID ${processId} not found or project with ID ${projectId} not found.`
				});
			} else {
				const createPart = await prismaClient.part.create({
					data: {
						processId: findProcess.id,
						projectId: findSpecificProject.id,
						partNumber: partProdNumberId,
						side: partSide
					}
				});
				writeToLogger({
					request: event.request,
					action: 'CREATE',
					entityType: 'Part',
					entityId: createPart.id
				});
				return { success: true, message: 'Part created successfully.' };
			}
		} catch (error: any) {
			return fail(500, {
				success: false,
				error: error.message || 'Unknown error',
				message: `Something is wrong :( Please try again later. ${error.message ? `Error ${error.message}` : error}`
			});
		}
	},
	editPart: async (event) => {
		const formData = await event.request.formData();
		const partId = formData.get('partId') as string;
		const processId = formData.get('processId') as string;
		const partProdNumberId = formData.get('partNumber') as string;
		const partSide = formData.get('partSide') as string;
		const projectId = formData.get('projectId') as string;
		// console.log(projectName);

		if (!processId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Process is required.Please select process.'
			});
		}
		if (!projectId) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Project is required.Please select project.'
			});
		}
		if (partProdNumberId.length > 100) {
			return fail(400, {
				success: false,
				error: 'Max 100 characters for part number.',
				message: 'Validation error'
			});
		}
		try {
			const [findPart, findProcess, findSpecificProject] = await Promise.all([
				prismaClient.part.findFirst({ where: { id: Number(partId) } }),
				prismaClient.process.findFirst({
					where: { id: Number(processId) },
					include: { project: true }
				}),
				prismaClient.project.findFirst({
					where: { id: Number(projectId) }
				})
			]);
			if (!findPart) {
				return fail(404, {
					success: false,
					error: true,
					message: `Part with ID ${partId} not found.`
				});
			}
			if (!findProcess || !findSpecificProject) {
				return fail(404, {
					success: false,
					error: true,
					message: `Process with ID ${processId} not found or project with ID ${projectId} not found.`
				});
			}

			const updatePart = await prismaClient.part.update({
				where: {
					id: findPart.id
				},
				data: {
					processId: findProcess.id,
					projectId: findSpecificProject.id,
					partNumber: partProdNumberId,
					side: partSide
				}
			});
			writeToLogger({
				request: event.request,
				action: 'EDIT',
				entityType: 'Part',
				entityId: updatePart.id
			});
			return {
				success: true,
				message: `Part with ID ${partId}-${findPart.partNumber} edited successfully.`
			};
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

			writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'Part',
				entityId: deleteItem.id
			});
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
