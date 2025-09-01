import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';

export const load: PageServerLoad = async (event) => {
	try {
		const findScCodes = await prismaClient.scrapCode.findMany({ orderBy: { id: 'desc' } });

		const data = {
			scrapCodes: findScCodes
		};
		return { data };
	} catch (err) {
		throw error(500, { message: `${err}` });
	}
};

export const actions = {
	createScrap: async (event) => {
		const formData = await event.request.formData();
		const scrapcodeNum = formData.get('scrapcodeNum') as string;
		const scrapcodeName = formData.get('scrapcodeName') as string;
		const scrapDescription = formData.get('scrapDescription') as string;

		if (!scrapcodeNum || !scrapcodeName) {
			return fail(400, {
				success: false,
				error: true,
				message: 'Scrap code number and scrap name are required.Please complete it.'
			});
		}
		try {
			const createScrap = await prismaClient.scrapCode.create({
				data: {
					code: scrapcodeNum,
					name: scrapcodeName,
					description: scrapDescription
				}
			});
			if (!createScrap) {
				return fail(500, { success: false, message: `Problem create in db.` });
			}
			return { success: true, message: 'Scrap code created successfully.' };
		} catch (err) {
			fail(500, { message: `${err}` });
		}
	}
} satisfies Actions;
