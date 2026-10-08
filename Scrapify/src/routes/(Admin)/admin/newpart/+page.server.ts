import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { writeToLogger } from '@/utils/serverHelp';
import type { Prisma } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
	const description = event.url.searchParams.get('description') as string;
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		partNumber: event.url.searchParams.get('partNumber')?.trim(),
		partId: Number(event.url.searchParams.get('partId')),
		// processName: Number(event.url.searchParams.get('processName')),
		// projectName: Number(event.url.searchParams.get('projectName')),
		description: description
	};

	const where: Prisma.PartWhereInput = {};
	if (filters.partNumber) {
		where.partNumber = { contains: filters.partNumber };
	}
	if (filters.partId) {
		where.id = filters.partId;
	}
	if (filters.description) {
		where.description = { contains: filters.description };
	}
	// if (processId && !Number.isNaN(processId)) wherePartGroup.processId = processId;
	// if (projectId && !Number.isNaN(projectId)) wherePartGroup.projectId = projectId;
	const wherePartGroup: Prisma.PartGroupWhereInput = {};

	try {
		const [allParts, allProcesses, allProjects, allHalls, availablePartGroups] = await Promise.all([
			prismaClient.part.findMany({
				where,
				skip,
				take: limit,
				orderBy: { id: 'desc' }
			}),
			prismaClient.process.findMany(),

			prismaClient.project.findMany(),
			prismaClient.hall.findMany(),
			prismaClient.partGroup.findMany({ where: wherePartGroup })
		]);
		const partsCount = await prismaClient.part.count({ where });
		const totalPages = Math.ceil(partsCount / limit);
		const data = {
			parts: allParts,
			processes: allProcesses,
			projects: allProjects,
			halls: allHalls,
			totalPages,
			partsCount,
			groups: availablePartGroups
		};

		return { data };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions = {
	createPart: async (event: any) => {
		const formData = await event.request.formData();
		const partProdNumberId = formData.get('partNumber') as string;
		const partSide = formData.get('partSide') as string;
		const description = String(formData.get('description') || '').trim();
		const groupId = Number(formData.get('groupId')) || null;

		if (description.length > 64) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Max character length for description is 64'
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
			const createPart = await prismaClient.part.create({
				data: {
					description: description || null,
					partNumber: partProdNumberId,
					side: partSide,
					...(groupId
						? {
								groups: {
									connect: { id: groupId }
								}
							}
						: {})
				}
			});

			writeToLogger({
				request: event.request,
				action: 'CREATE',
				entityType: 'Part',
				entityId: createPart.id
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
