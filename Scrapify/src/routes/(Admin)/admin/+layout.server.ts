import { auth } from '@/auth/auth';
import type { PageServerLoad } from './newhall/$types';
import { getUserServer } from '@/utils/serverHelp';
import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import prismaClient from '@/server/prisma';

export const load: LayoutServerLoad = async (event) => {
	const { user, session } = await getUserServer({ request: event.request });

	if (!user) {
		throw redirect(302, `/login`);
	}

	const dbUser = await prismaClient.user.findUnique({ where: { id: user?.id } });
	if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'MODERATOR') {
		throw redirect(302, `/`);
		// throw error(403, { message: 'Nemáte oprávnenie pre prístup do tejto sekcie.' });
	}
};
