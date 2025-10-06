import prismaClient from '@/server/prisma';
import { error, fail, type ActionFailure, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;
	try {
		const halls = await prismaClient.hall.findMany({
			skip,
			take: limit,
			orderBy: {
				id: 'desc'
			}
		});
		const hallsCount = await prismaClient.hall.count();
		const totalPages = Math.ceil(hallsCount / limit);
		return {
			halls: halls,
			hallsCount,
			totalPages
		};
	} catch (err) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {
	createHall: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const hallName = formData.get('hallName') as string;
		const hallDescription = formData.get('hallDescription') as string;

		if (hallName.length > 20) {
			return fail(400, {
				success: false,
				error: 'Name is to long,max is 20 characters',
				message: 'Validation error'
			});
		}

		try {
			await prismaClient.hall.create({
				data: {
					name: hallName,
					description: hallDescription
				}
			});
			return { success: true, message: 'Hall created successfully' };
		} catch (error: any) {
			return {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	},

	editHall: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const hallName = formData.get('hallName') as string;
		const hallDescription = formData.get('hallDescription') as string;
		const hallId = formData.get('hallId') as string;

		if (hallName.length > 20 || hallDescription.length > 200) {
			return fail(400, {
				success: false,
				error: 'Name max 20 characters,description max 200 characters.',
				message: 'Validation error'
			});
		}

		try {
			const findHall = await prismaClient.hall.findFirst({ where: { id: Number(hallId) } });
			if (!findHall) {
				return fail(404, {
					success: false,
					error: true,
					message: `Hall with ID : ${hallId} not found.`
				});
			} else {
				await prismaClient.hall.update({
					where: {
						id: findHall.id
					},
					data: {
						name: hallName,
						description: hallDescription
					}
				});
				return { success: true, message: `Hall with ID ${hallId} edited successfully.` };
			}
		} catch (error: any) {
			return {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	},

	deleteHall: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const id = formData.get('deleteId');

		if (!id) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}

		try {
			const deleteHall = await prismaClient.hall.delete({ where: { id: Number(id) } });

			return {
				success: true,
				message: `Successful deleted id: ${deleteHall.id}, hall name: ${deleteHall.name}.`,
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
};
