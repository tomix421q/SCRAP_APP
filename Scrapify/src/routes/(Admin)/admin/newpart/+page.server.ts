import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import { toFuzzyPattern, writeToLogger } from '@/utils/serverHelp';
import type { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

// Pomocná funkcia: rozdelí reťazec (napr. "j o j") na tokeny a spojí ich cez '%'
// Ak hľadáte "j o j", vygeneruje "j%o%j", čo v Prisma `contains` vytvorí LIKE '%j%o%j%'


export const load: PageServerLoad = async (event) => {
	const description = event.url.searchParams.get('description')?.trim() ?? '';
	const vProject = event.url.searchParams.get('vProject')?.trim() ?? '';
	const vHall = event.url.searchParams.get('vHall')?.trim() ?? '';
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		partNumber: event.url.searchParams.get('partNumber')?.trim(),
		vProject: vProject,
		vHall: vHall,
		description: description
	};

	const where: Prisma.vPartsWhereInput = {};

	if (filters.partNumber) {
		where.Material = {
			contains: toFuzzyPattern(filters.partNumber)
		};
	}
	if (filters.vProject) {
		where.Project = {
			contains: toFuzzyPattern(filters.vProject)
		};
	}
	if (filters.vHall) {
		where.Hall = {
			contains: toFuzzyPattern(filters.vHall)
		};
	}
	if (filters.description) {
		where.Description = {
			contains: toFuzzyPattern(filters.description)
		};
	}

	const wherePartGroup: Prisma.PartGroupWhereInput = {};

	try {
		const [allParts, allProcesses] = await Promise.all([
			prismaClient.vParts.findMany({
				where,
				skip,
				take: limit,
				orderBy: { Material: 'desc' }
			}),

			prismaClient.partGroup.findMany({ where: wherePartGroup })
		]);
		const partsCount = await prismaClient.vParts.count({ where });
		const totalPages = Math.ceil(partsCount / limit);

		const data = {
			parts: allParts,
			processes: allProcesses,
	
			totalPages,
			partsCount,
	
		};

		return { data };
	} catch (err: any) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions = {
	// createPart: async (event: any) => {
	// 	const formData = await event.request.formData();
	// 	const partProdNumberId = formData.get('partNumber') as string;
	// 	// const partSide = formData.get('partSide') as string;
	// 	const description = String(formData.get('description') || '').trim();
	// 	const groupId = Number(formData.get('groupId')) || null;
	// 	if (description.length > 128) {
	// 		return fail(400, {
	// 			success: false,
	// 			error: true,
	// 			message: 'Max character length for description is 64'
	// 		});
	// 	}
	// 	if (partProdNumberId.length > 100) {
	// 		return fail(400, {
	// 			success: false,
	// 			error: 'Max 100 characters for part number.',
	// 			message: 'Validation error'
	// 		});
	// 	}
	// 	try {
	// 		const createPart = await prismaClient.part.create({
	// 			data: {
	// 				description: description || null,
	// 				partNumber: partProdNumberId,
	// 				...(groupId
	// 					? {
	// 							groups: {
	// 								connect: { id: groupId }
	// 							}
	// 						}
	// 					: {})
	// 			}
	// 		});
	// 		writeToLogger({
	// 			request: event.request,
	// 			action: 'CREATE',
	// 			entityType: 'Part',
	// 			entityId: createPart.id
	// 		});
	// 		return { success: true, message: 'Part created successfully.' };
	// 	} catch (error: any) {
	// 		return fail(500, {
	// 			success: false,
	// 			error: error.message || 'Unknown error',
	// 			message: `Something is wrong :( Please try again later. ${error.message ? `Error ${error.message}` : error}`
	// 		});
	// 	}
	// },
	// editPart: async (event) => {
	// 	const formData = await event.request.formData();
	// 	const partId = formData.get('partId') as string;
	// 	const partProdNumberId = formData.get('partNumber') as string;
	// 	const description = formData.get('description') as string;
	// 	if (partProdNumberId.length > 100) {
	// 		return fail(400, {
	// 			success: false,
	// 			error: 'Max 100 characters for part number.',
	// 			message: 'Validation error'
	// 		});
	// 	}
	// 	try {
	// 		const [findPart] = await Promise.all([
	// 			prismaClient.part.findFirst({ where: { id: Number(partId) } })
	// 		]);
	// 		if (!findPart) {
	// 			return fail(404, {
	// 				success: false,
	// 				error: true,
	// 				message: `Part with ID ${partId} not found.`
	// 			});
	// 		}
	// 		const updatePart = await prismaClient.part.update({
	// 			where: {
	// 				id: findPart.id
	// 			},
	// 			data: {
	// 				partNumber: partProdNumberId,
	// 				description
	// 			}
	// 		});
	// 		writeToLogger({
	// 			request: event.request,
	// 			action: 'EDIT',
	// 			entityType: 'Part',
	// 			entityId: updatePart.id
	// 		});
	// 		return {
	// 			success: true,
	// 			message: `Part with ID ${partId}-${findPart.partNumber} edited successfully.`
	// 		};
	// 	} catch (error: any) {
	// 		return fail(500, {
	// 			success: false,
	// 			error: error.message || 'Unknown error',
	// 			message: `Something is wrong :( Please try again later. ${error.message ? `Error ${error.message}` : error}`
	// 		});
	// 	}
	// },
	// deletePart: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
	// 	const formData = await event.request.formData();
	// 	const id = formData.get('deleteId');
	// 	if (!id) {
	// 		return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
	// 	}
	// 	try {
	// 		const deleteItem = await prismaClient.part.delete({ where: { id: Number(id) } });
	// 		writeToLogger({
	// 			request: event.request,
	// 			action: 'DELETE',
	// 			entityType: 'Part',
	// 			entityId: deleteItem.id
	// 		});
	// 		return {
	// 			success: true,
	// 			message: `Successful deleted id: ${deleteItem.partNumber}.`,
	// 			error: false
	// 		};
	// 	} catch (error: any) {
	// 		return {
	// 			success: false,
	// 			message: 'Something is wrong, Please try again later.',
	// 			error: error.message + ' ' + error.code || 'Unknown error'
	// 		};
	// 	}
	// },
	// importExcel: async (event) => {
	// 	const formData = await event.request.formData();
	// 	const file = formData.get('excelFile') as File;
	// 	if (!file || file.size === 0) {
	// 		return fail(400, {
	// 			success: false,
	// 			message: 'Validation error',
	// 			error: 'Please select valid excel file'
	// 		});
	// 	}
	// 	try {
	// 		// convert file to buffer
	// 		const arrayBuffer = await file.arrayBuffer();
	// 		const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
	// 		// load first sheet
	// 		const firstSheetName = workbook.SheetNames[0];
	// 		const worksheet = workbook.Sheets[firstSheetName];
	// 		// convert to json
	// 		const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
	// 		if (rawRows.length === 0) {
	// 			return fail(400, { success: false, message: 'Validation error', error: 'File is empty' });
	// 		}
	// 		// map items
	// 		const partsToInsert = rawRows
	// 			.map((row) => {
	// 				const partNumberKey =
	// 					Object.keys(row).find((k) =>
	// 						k
	// 							.toLowerCase()
	// 							.replace(/[\s_-]/g, '')
	// 							.includes('partnumber')
	// 					) ??
	// 					Object.keys(row)[0] ??
	// 					'';
	// 				const descriptionKey =
	// 					Object.keys(row).find((k) =>
	// 						k
	// 							.toLowerCase()
	// 							.replace(/[\s_-]/g, '')
	// 							.includes('desc')
	// 					) ??
	// 					Object.keys(row)[1] ??
	// 					'';
	// 				const partNumber = String(row[partNumberKey] ?? '').trim();
	// 				const description = String(row[descriptionKey] ?? '').trim();
	// 				return { partNumber, description };
	// 			})
	// 			.filter((part) => Boolean(part.partNumber));
	// 		if (partsToInsert.length === 0) {
	// 			return fail(400, {
	// 				success: false,
	// 				message: 'Validation error',
	// 				error: 'Records not found'
	// 			});
	// 		}
	// 		const uniqueFromExcel = Array.from(
	// 			new Map(partsToInsert.map((item) => [item.partNumber, item])).values()
	// 		);
	// 		const result = await prismaClient.$transaction(
	// 			uniqueFromExcel.map((item) =>
	// 				prismaClient.part.upsert({
	// 					where: { partNumber: item.partNumber },
	// 					update: { description: item.description },
	// 					create: {
	// 						partNumber: item.partNumber,
	// 						description: item.description
	// 					}
	// 				})
	// 			)
	// 		);
	// 		return {
	// 			success: true,
	// 			message: `Succesfully recorded parts,total:${partsToInsert.length}`
	// 		};
	// 	} catch (err: any) {
	// 		console.error('Chyba pri importe:', err);
	// 		return fail(500, { success: false, message: 'Server error', error: 'Import file fail!' });
	// 	}
	// }
} satisfies Actions;
