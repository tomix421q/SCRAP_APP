import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { partGroupSchema } from '@/utils/zod';
import type { Prisma } from '@prisma/client';
import { hasRoleServer, writeToLogger } from '@/utils/serverHelp';
import {
	removePartGroupPhoto,
	stagePartGroupPhoto,
	validatePartGroupPhoto
} from '@/server/partGroupPhoto';

export const load = (async (event) => {
	const limit = 100;
	const requestedPage = Number(event.url.searchParams.get('page') ?? '1');
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const skip = (page - 1) * limit;

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
				skip,
				take: limit,
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
				? prismaClient.vScrapCodes.findMany({
						where: { ...(filters.vProject ? { Reason_Project: filters.vProject } : {}) }
					})
				: prismaClient.vScrapCodes.findMany({ take: 0, orderBy: { Reason_Code: 'asc' } }),
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

type StagedPhoto = Awaited<ReturnType<typeof stagePartGroupPhoto>>;

/** Echoed back to the form on validation errors; files cannot be serialized, so only strings pass. */
const formValues = (formData: FormData) =>
	Object.fromEntries([...formData].filter(([, value]) => typeof value === 'string'));

/** Validates the optional `photo` field. `rejection` is a ready-made 400 response for a bad file. */
async function checkPhotoUpload(photo: FormDataEntryValue | null, formData: FormData) {
	if (!(photo instanceof File) || photo.size === 0) return { bytes: null, rejection: null };
	const check = await validatePartGroupPhoto(photo);
	if (check.ok) return { bytes: check.bytes, rejection: null };
	return {
		bytes: null,
		rejection: fail(400, {
			success: false,
			message: 'Validation failed',
			error: { photo: [check.error] },
			values: formValues(formData)
		})
	};
}

const MANAGE_ROLES = ['ADMIN', 'MODERATOR'] as const;
const forbidden = () =>
	fail(403, { success: false, message: 'Forbidden', error: 'You do not have permission.' });

export const actions = {
	createPartGroup: async (event) => {
		if (!(await hasRoleServer(event, MANAGE_ROLES))) return forbidden();
		const formData = await event.request.formData();
		const data = Object.fromEntries(formData);
		const photo = formData.get('photo');
		const result = partGroupSchema.safeParse(data);
		// console.log(result);

		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: formValues(formData)
			});
		}
		const { groupName, vProject, partNumbers, scrapCodes, isRebuild, interfaceName, qadIdentity } =
			result.data;

		// Validate the photo up front so a bad file never leaves a half-created group behind.
		const upload = await checkPhotoUpload(photo, formData);
		if (upload.rejection) return upload.rejection;
		let stagedPhoto: StagedPhoto | undefined;
		let createdGroupId: number | undefined;
		try {
			const scrapCodeRecords = await getScrapCodeRecords(vProject, scrapCodes ?? []);
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
						create: scrapCodeRecords
					}
				},
				select: {
					id: true,
					name: true
				}
			});

			createdGroupId = newGroup.id;

			// The group id names the photo file, so the file can only be staged after the insert.
			if (upload.bytes) {
				stagedPhoto = await stagePartGroupPhoto(newGroup.id, upload.bytes);
				await prismaClient.partGroup.update({
					where: { id: newGroup.id },
					data: { photoFile: stagedPhoto.fileName }
				});
				await stagedPhoto.commit();
			}

			return {
				success: true,
				message: `Group with name: "${newGroup.name}" was successfull created.`
			};
		} catch (err: any) {
			console.error('Create part group error:', err);
			await stagedPhoto?.discard();
			// Roll back the row created for this request so the user can simply retry.
			if (createdGroupId !== undefined && upload.bytes) {
				await prismaClient.partGroup
					.delete({ where: { id: createdGroupId } })
					.catch((rollbackErr) => console.error('Rollback of part group failed:', rollbackErr));
			}
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
		if (!(await hasRoleServer(event, MANAGE_ROLES))) return forbidden();
		const formData = await event.request.formData();
		const data = Object.fromEntries(formData);
		const photo = formData.get('photo');
		const removePhoto = formData.get('removePhoto') === 'true';
		const result = partGroupSchema.safeParse(data);
		// console.log(result);
		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: formValues(formData)
			});
		}

		const {
			id,
			groupName,
			vProject,
			partNumbers,
			scrapCodes,
			isRebuild,
			interfaceName,
			qadIdentity
		} = result.data;

		const upload = await checkPhotoUpload(photo, formData);
		if (upload.rejection) return upload.rejection;
		if (id === undefined && (upload.bytes || removePhoto)) {
			return fail(400, { success: false, message: 'Validation failed', error: 'Missing group id.' });
		}

		let stagedPhoto: StagedPhoto | undefined;
		try {
			// A new photo is staged first and committed only after the DB update succeeds;
			// without `photoFile` in the update data an existing photo is never touched.
			if (upload.bytes && id !== undefined) {
				stagedPhoto = await stagePartGroupPhoto(id, upload.bytes);
			}
			const photoData = stagedPhoto
				? { photoFile: stagedPhoto.fileName }
				: removePhoto
					? { photoFile: null }
					: {};
			const scrapCodeRecords = await getScrapCodeRecords(vProject, scrapCodes ?? []);
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
						deleteMany: {},
						create: scrapCodeRecords
					},
					...photoData
				},
				select: {
					id: true,
					name: true
				}
			});

			if (stagedPhoto) await stagedPhoto.commit();
			else if (removePhoto && id !== undefined) await removePartGroupPhoto(id);

			return {
				success: true,
				message: `Group with name: "${newGroup.name}" was successfull edited.`
			};
		} catch (err: any) {
			await stagedPhoto?.discard();
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
		if (!(await hasRoleServer(event, MANAGE_ROLES))) return forbidden();
		const formData = await event.request.formData();
		const id = formData.get('deleteId');
		const numId = Number(id);
		console.log(id);
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
			await removePartGroupPhoto(deleteItem.id).catch((err) =>
				console.error('Remove part group photo error:', err)
			);

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

async function getScrapCodeRecords(vProject: string, codes: string[]) {
	if (codes.length === 0) return [];

	const scrapCodes = await prismaClient.vScrapCodes.findMany({
		where: {
			Reason_Project: vProject,
			Reason_Code: { in: codes }
		},
		select: {
			Reason_Code: true,
			Reason_Description: true
		}
	});
	const descriptions = new Map(
		scrapCodes.map((scrapCode) => [scrapCode.Reason_Code, scrapCode.Reason_Description])
	);

	return codes.map((code) => ({
		code,
		description: descriptions.get(code) ?? null
	}));
}
