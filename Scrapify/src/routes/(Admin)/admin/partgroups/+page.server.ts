import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { partGroupSchema } from '@/utils/zod';
import type { Prisma } from '@prisma/client';

export const load = (async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		processId: event.url.searchParams.get('processId'),
		projectId: event.url.searchParams.get('projectId')
	};
	// console.log(filters);
	const where: Prisma.PartWhereInput = {};
	if (filters.processId) where.processId = { equals: Number(filters.processId) };
	if (filters.projectId) where.projectId = { equals: Number(filters.projectId) };

	try {
		const [allProcess, allProjects, allParts] = await prismaClient.$transaction([
			prismaClient.process.findMany(),
			prismaClient.project.findMany(),
			prismaClient.part.findMany({
				where
			})
		]);
		const data = {
			processes: allProcess,
			projects: allProjects,
			parts: allParts
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
		const { groupName, partIds } = result.data;
		try {
			const newGroup = await prismaClient.partGroup.create({
				data: {
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
				message: `Skupina "${newGroup.name}" bola úspešne vytvorená.`
			};
		} catch (err: any) {
			console.error('Create part group error:', err);

			return fail(500, {
				success: false,
				message: 'Internal server error',
				error: err.message
			});
		}
	}
} satisfies Actions;
