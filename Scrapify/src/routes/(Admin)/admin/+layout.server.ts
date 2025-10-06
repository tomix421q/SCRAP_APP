import { getUserServer } from '@/utils/serverHelp';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prismaClient from '@/server/prisma';
import type { Role } from '@/utils/types';

export const load: LayoutServerLoad = async (event) => {
	const { user, session } = await getUserServer({ request: event.request });

	if (!user) {
		throw redirect(302, `/login`);
	}

	const dbUser = await prismaClient.user.findUnique({ where: { id: user?.id } });
	if (dbUser?.role !== 'ADMIN' && dbUser?.role !== ('MODERATOR' as Role)) {
		throw redirect(302, `/`);
		// throw error(403, { message: 'Nemáte oprávnenie pre prístup do tejto sekcie.' });
	}
};
