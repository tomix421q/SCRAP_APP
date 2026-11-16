import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { getCachedProjects } from '@/server/cacheVprojects';
import { parseDashboardFilters } from './_components/server/dashboardFilters';
import { loadDashboardStats } from './_components/server/dashboardStats.server';

export const load = (async ({ url }) => {
	const filters = parseDashboardFilters(url.searchParams, new Date());
	if (filters.project && !(await getCachedProjects()).includes(filters.project)) {
		throw error(400, { message: `Unknown project "${filters.project}".` });
	}
	return loadDashboardStats(filters);
}) satisfies PageServerLoad;
