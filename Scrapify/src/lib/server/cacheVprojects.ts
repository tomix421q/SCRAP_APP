import prismaClient from '@/server/prisma';

let cachedProjects: string[] = [];
let cacheExpiresAt = 0;

export async function getCachedProjects(): Promise<string[]> {
	const now = Date.now();

	if (cachedProjects.length > 0 && now < cacheExpiresAt) {
		return cachedProjects;
	}

	const raw = await prismaClient.vParts.findMany({
		where: { Project: { not: null } },
		distinct: ['Project'],
		select: { Project: true },
		orderBy: { Project: 'asc' }
	});

	cachedProjects = raw.map((item) => item.Project).filter((p): p is string => Boolean(p));

	cacheExpiresAt = now + 1000 * 60 * 60 * 24 * 30; // 30days
	return cachedProjects;
}
