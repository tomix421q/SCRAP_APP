import { getUserServer } from '@/utils/serverHelp';
import { resolveAdminRedirect } from '@/utils/adminAccess';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prismaClient from '@/server/prisma';

// Guards page loads only. Form actions must call `requireRole` themselves.
export const load: LayoutServerLoad = async (event) => {
	const { user } = await getUserServer({ request: event.request });

	if (!user) {
		throw redirect(302, `/login`);
	}
	const dbUser = await prismaClient.user.findUnique({
		where: { id: user.id },
		select: { role: true }
	});

	const target = resolveAdminRedirect(dbUser?.role ?? null, event.url.pathname);
	if (target) {
		throw redirect(302, target);
	}
};
