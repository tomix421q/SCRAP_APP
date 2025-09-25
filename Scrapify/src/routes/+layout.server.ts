import type { LayoutServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { getUserServer } from '@/utils/serverHelp';

export const load = (async (event : any) => {
	const { user, session } = await getUserServer({ request: event.request });

	let fullUser = null;
	if (user) {
		fullUser = await prismaClient.user.findUnique({ where: { id: user?.id } });
	}

	return { user: fullUser, session: session };
}) satisfies LayoutServerLoad;
