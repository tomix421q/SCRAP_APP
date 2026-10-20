import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { partGroupSchema } from '@/utils/zod';
import type { Prisma } from '@prisma/client';
import { writeToLogger } from '@/utils/serverHelp';

export const load = (async (event) => {
	const limit = 100;

	const filters = {
		vProject: event.url.searchParams.get('vProject')
	};
	// console.log(filters);
	const whereGroup: Prisma.PartGroupWhereInput = {
		...(filters.vProject ? { vProject: filters.vProject } : {})
	};

	const wherePart: Prisma.vPartsWhereInput = {
		...(filters.vProject ? { Project: filters.vProject } : {})
	};

	try {
		const [groups, allParts, scrapCodes, groupsCount] = await prismaClient.$transaction([
			// groups
			prismaClient.partGroup.findMany({
				where: whereGroup,
				orderBy: { updatedAt: 'desc' },
				include: { scrapCodes: true, materials: true }
			}),
			// vParts
			filters.vProject
				? prismaClient.vParts.findMany({
						where: wherePart,
						orderBy: { Material: 'asc' }
					})
				: prismaClient.vParts.findMany({ take: 0 }),

			// scrap
			filters.vProject
				? prismaClient.scrapCode.findMany({
						where: { ...(filters.vProject ? { vProject: filters.vProject } : {}) }
					})
				: prismaClient.scrapCode.findMany({ take: 0 }),
			// group count
			prismaClient.partGroup.count({ where: whereGroup })
		]);

		const formattedParts = allParts.map((p) => ({
			id: p.Material,
			name: p.Description ? `${p.Material} - ${p.Description} - ${p.Side ?? ''}` : p.Material,
			Material: p.Material,
			Side: p.Side,
			Description: p.Description,
			groupIdentity: p.P_L
		}));

		const totalPages = Math.ceil(groupsCount / limit);
		const data = {
			groups: groups,
			groupsCount: groupsCount,
			parts: formattedParts,
			scrapCodes,
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
		const data = Object.fromEntries(await event.request.formData());
		const result = partGroupSchema.safeParse(data);
		// console.log(result);

		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: data
			});
		}
		const {
			groupName,
			vProject,
			partNumbers,
			scrapCodesIds,
			isRebuild,
			interfaceName,
			qadIdentity
		} = result.data;
		try {
			const newGroup = await prismaClient.partGroup.create({
				data: {
					name: groupName,
					vProject,
					materials: {
						create: (partNumbers ?? []).map((mat) => ({
							material: mat
						}))
					},
					isRebuild: isRebuild,
					interfaceName,
					qadIdentity,
					scrapCodes: {
						connect: scrapCodesIds.map((id) => ({ id }))
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
	editGroup: async (event) => {
		const data = Object.fromEntries(await event.request.formData());
		const result = partGroupSchema.safeParse(data);
		// console.log(result);
		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: data
			});
		}

		const {
			id,
			groupName,
			vProject,
			partNumbers,
			scrapCodesIds,
			isRebuild,
			interfaceName,
			qadIdentity
		} = result.data;
		try {
			const newGroup = await prismaClient.partGroup.update({
				where: {
					id
				},
				data: {
					name: groupName,
					vProject,
					materials: {
						deleteMany: {},
						create: (partNumbers ?? []).map((mat: string) => ({
							material: mat
						}))
					},
					isRebuild: isRebuild,
					interfaceName,
					qadIdentity,
					scrapCodes: {
						set: scrapCodesIds.map((id) => ({ id }))
					}
				},
				select: {
					id: true,
					name: true
				}
			});

			return {
				success: true,
				message: `Group with name: "${newGroup.name}" was successfull edited.`
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
		console.log(id)
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
