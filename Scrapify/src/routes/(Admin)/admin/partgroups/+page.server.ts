import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { partGroupSchema } from '@/utils/zod';
import type { Prisma } from '@prisma/client';
import { writeToLogger } from '@/utils/serverHelp';

export const load = (async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		processId: event.url.searchParams.get('processId'),
		projectId: event.url.searchParams.get('projectId')
	};
	// console.log(filters);
	const wherePart: Prisma.PartWhereInput = {};
	if (filters.processId) wherePart.processId = { equals: Number(filters.processId) };
	if (filters.projectId) wherePart.projectId = { equals: Number(filters.projectId) };

	const whereGroup: Prisma.PartGroupWhereInput = {};

	try {
		const [groups, allProcess, allProjects, allParts, groupsCount] =
			await prismaClient.$transaction([
				prismaClient.partGroup.findMany({
					where: whereGroup,
					orderBy: { createdAt: 'desc' },
					include: { parts: true, process: true, project: true }
				}),
				prismaClient.process.findMany(),
				prismaClient.project.findMany({
					where: { processes: { some: { processId: Number(filters.processId) } } }
				}),
				prismaClient.part.findMany({
					where: wherePart
				}),
				prismaClient.partGroup.count()
			]);
		const totalPages = Math.ceil(groupsCount / limit);
		const data = {
			groups: groups,
			groupsCount: groupsCount,
			processes: allProcess,
			projects: allProjects,
			parts: allParts,
			totalPages
		};
		return { data };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
}) satisfies PageServerLoad;

export const actions = {
	createPartGroup: async (event) => {
		// console.log(event.request.formData());
		const data = Object.fromEntries(await event.request.formData());
		const result = partGroupSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: data
			});
		}
		const { processId, projectId, groupName, partIds } = result.data;
		try {
			const newGroup = await prismaClient.partGroup.create({
				data: {
					processId,
					projectId,
					name: groupName,
					parts: {
						connect: partIds.map((id) => ({ id }))
					}
				},
				select: {
					id: true,
					name: true
				}
			});

			return {
				success: true,
				message: `Group with name: "${newGroup.name}" was successfull created.`
			};
		} catch (err: any) {
			console.error('Create part group error:', err);
			if (err.code === 'P2002') {
				return fail(500, {
					success: false,
					message: 'This group name with this process and project already exist'
				});
			}
			return fail(500, {
				success: false,
				message: `Internal server error`,
				error: err.message
			});
		}
	},
	deleteGroup: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');
		const numId = Number(id);
		if (!id || Number.isNaN(numId)) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}
		const isExist = await prismaClient.partGroup.findUnique({ where: { id: Number(id) } });
		if (!isExist) {
			return fail(404, {
				success: false,
				message: 'Not found',
				error: 'Id for this item does not exist'
			});
		}
		try {
			const deleteItem = await prismaClient.partGroup.delete({ where: { id: Number(id) } });

			writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'PartGroup',
				entityId: deleteItem.id
			});
			return {
				success: true,
				message: `Successful deleted group with name: ${deleteItem.name}`
			};
		} catch (error: any) {
			return fail(500, {
				success: false,
				message: 'Something is wrong, Please try again later.',
				error: error.message ?? 'Unknown error'
			});
		}
	}
} satisfies Actions;
