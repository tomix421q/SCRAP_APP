import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import type { Role } from '@/utils/types';

export const load = (async () => {
	try {
		const allUsers = await prismaClient.user.findMany({});
		return { allUsers };
	} catch (err) {
		throw error(500, { message: `${err}` });
	}
}) satisfies PageServerLoad;

export const actions: Actions = {
	changeUserRole: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const userId = formData.get('userId') as string;
		const newRole = formData.get('userRole') as Role;

		if (!userId || !newRole) {
			return fail(400, {
				success: false,
				error: 'Problem with user id or role. Please select role.',
				message: 'Validation error.'
			});
		}

		try {
			const findUser = await prismaClient.user.findFirst({ where: { id: userId } });
			if (!findUser)
				return fail(404, {
					success: false,
					message: 'User with this id does not exist.',
					error: true
				});
			const updateUser = await prismaClient.user.update({
				where: { id: findUser.id },
				data: { role: newRole as Role }
			});
			if (!updateUser)
				return fail(404, { success: false, message: 'Problem with update user.', error: true });
			return {
				success: true,
				message: `Role for ${updateUser.name} with id: ${updateUser.id} has been changed.`
			};
		} catch (error: any) {
			return fail(500, {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			});
		}
	}
};
