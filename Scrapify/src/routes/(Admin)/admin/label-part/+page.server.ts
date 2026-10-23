import prismaClient from '@/server/prisma';
import type { PageServerLoad } from './$types';
import { error, fail, type Actions } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';
import { labelGroupsSchema } from '@/utils/zod';
import { writeToLogger } from '@/utils/serverHelp';

export const load = (async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? 1);
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		projectId: event.url.searchParams.get('vProject')
	};
	const whereGroup: Prisma.PartGroupWhereInput = {};
	if (filters.projectId) whereGroup.vProject = filters.projectId;

	try {
		const [groups, labelGroups, labelGroupsCount] = await Promise.all([
			prismaClient.partGroup.findMany({ where: whereGroup }),
			prismaClient.labelGroup.findMany({
				skip,
				take: limit,
				orderBy: { id: 'desc' },
				include: {
					groups: { include: { materials: true } }
				}
			}),
			prismaClient.labelGroup.count()
		]);
		const totalPages = Math.ceil(labelGroupsCount / limit);

		const data = {
			groups: groups,
			labelGroups,
			labelGroupsCount,
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
	createLabel: async (event) => {
		// console.log((await event.request.formData()).get('groups'));
		const data = Object.fromEntries(await event.request.formData());
		const result = labelGroupsSchema.safeParse(data);

		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: data
			});
		}
		const { vProject, labelNumber, groups } = result.data;

		try {
			const newLabel = await prismaClient.labelGroup.create({
				data: {
					code: labelNumber,
					vProject,
					groups: {
						connect: groups.map((id) => ({ id }))
					}
				}
			});
			return {
				success: true,
				message: `Label group with mas code: "${newLabel.code}" was successfull created.`
			};
		} catch (err: any) {
			if (err.code === 'P2002') {
				return fail(400, {
					success: false,
					message: `This label group with this project already exist`
				});
			}
			return fail(500, {
				success: false,
				message: 'Internal server error',
				error: err.message
			});
		}
	},
	editLabel: async (event) => {
		const data = Object.fromEntries(await event.request.formData());
		const result = labelGroupsSchema.safeParse(data);

		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: data
			});
		}
		const { id, vProject, labelNumber, groups } = result.data;
		console.log(groups);
		try {
			const newLabel = await prismaClient.labelGroup.update({
				where: {
					id
				},
				data: {
					code: labelNumber,
					vProject,
					groups: {
						set: groups.map((id) => ({ id }))
					}
				}
			});
			return {
				success: true,
				message: `Label group with mask code: "${newLabel.code}" was successfull updated.`
			};
		} catch (err: any) {
			console.log(err);
			if (err.code === 'P2002') {
				return fail(400, {
					success: false,
					message: `This label group with this project already exist`
				});
			}
			return fail(500, {
				success: false,
				message: 'Internal server error',
				error: err.message
			});
		}
	},
	deleteLabel: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');
		const numId = Number(id);
		if (!id || Number.isNaN(numId)) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}
		const isExist = await prismaClient.labelGroup.findUnique({ where: { id: Number(id) } });
		if (!isExist) {
			return fail(404, {
				success: false,
				message: 'Not found',
				error: 'Id for this item does not exist'
			});
		}
		try {
			const deleteItem = await prismaClient.labelGroup.delete({ where: { id: Number(id) } });

			writeToLogger({
				request: event.request,
				action: 'DELETE',
				entityType: 'LabelGroup',
				entityId: deleteItem.id
			});
			return {
				success: true,
				message: `Successful deleted label with code: ${deleteItem.code}`
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
