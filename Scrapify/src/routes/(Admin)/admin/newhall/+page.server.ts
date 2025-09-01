import prismaClient from '@/server/prisma';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const halls = await prismaClient.hall.findMany({
			orderBy: {
				id: 'desc'
			}
		});
		return {
			halls: halls
		};
	} catch (err) {
		throw error(500, {
			message: `${err}`
		});
	}
};

export const actions: Actions = {
	createHall: async (event) => {
		const formData = await event.request.formData();
		const hallName = formData.get('hallName') as string;
		const hallDescription = formData.get('hallDescription') as string;

		try {
			await prismaClient.hall.create({
				data: {
					name: hallName,
					description: hallDescription
				}
			});
			return { success: true, message: 'Hall created successfully', hallName, hallDescription };
		} catch (error: any) {
			return {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	}
};
