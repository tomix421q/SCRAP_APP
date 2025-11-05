import prismaClient from '@/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import type { Role } from '@/utils/types';
import { getUserServer, writeToLogger } from '@/utils/serverHelp';

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
	},
	deleteUser: async (event) => {
		const formData = await event.request.formData();
		const userIdToDelete = formData.get('deleteId') as string;

		if (!userIdToDelete) {
			return fail(400, {
				success: false,
				error: 'Please select user id.',
				message: 'Validation error.'
			});
		}

		// CHECK ADMIN PERMISION ON BACKEND SIDE
		let user = await getUserServer({ request: event.request });
		const dbUser = await prismaClient.user.findUnique({ where: { id: user.user?.id } });
		if (dbUser?.role !== 'ADMIN') {
			return fail(400, {
				success: false,
				error: 'You are not ADMIN, sorry :)',
				message: 'Authorization error.'
			});
		}

		try {
			const deleteUser = await prismaClient.user.delete({ where: { id: userIdToDelete } });
			if (!deleteUser) {
				fail(404, {
					success: false,
					error: `Not found user -  ${userIdToDelete}`
				});
			} else {
				writeToLogger({
					request: event.request,
					action: 'DELETE',
					entityType: 'User',
					entityId: deleteUser.cardId
				});
				return {
					success: true,
					message: `Successful deleted user with id: ${userIdToDelete}.`
				};
			}
		} catch (error: any) {
			return {
				success: false,
				message: 'Something is wrong, Please try again later.',
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	}
};
