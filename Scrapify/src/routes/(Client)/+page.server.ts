import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseDashboardFilters } from '@/utils/dashboardFilters';
import { loadDashboardStats } from '@/server/dashboardStats';
import { getCachedProjects } from '@/server/cacheVprojects';

export const load = (async ({ url }) => {
	const filters = parseDashboardFilters(url.searchParams, new Date());
	if (filters.project && !(await getCachedProjects()).includes(filters.project)) {
		throw error(400, { message: `Unknown project "${filters.project}".` });
	}
	return loadDashboardStats(filters);
}) satisfies PageServerLoad;
