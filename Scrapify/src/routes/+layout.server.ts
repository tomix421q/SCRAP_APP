import { getCachedProjects } from '@/server/cacheVprojects';
import type { LayoutServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { getUserServer } from '@/utils/serverHelp';
import { error } from '@sveltejs/kit';

export const load = (async (event) => {
	let fullUser = null;

	try {
		const { user, session } = await getUserServer({ request: event.request });
		const vProjects = await getCachedProjects();

		if (user) {
			fullUser = await prismaClient.user.findUnique({ where: { id: user?.id } });
		}

		return {
			vProjects,
			user: fullUser,
			session: session
		};
	} catch (err: any) {
		console.error('error in /layout.server.ts', err);
		throw error(500, {
			message: `${err.message || 'Something is wrong try again later.'}`
		});
	}
}) satisfies LayoutServerLoad;
