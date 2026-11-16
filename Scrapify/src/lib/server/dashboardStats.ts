import type { Prisma } from '@prisma/client';
import prismaClient from '@/server/prisma';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
import type { DashboardFilters, Period } from '@/utils/dashboardFilters';
import { createTtlCache } from '@/utils/ttlCache';
import { getLocalDateTimeForDb } from '@/utils/index';

export type PartTotals = {
	/** Sum of `quantity` (parts), the main metric. */
	quantity: number;
	scrapQuantity: number;
	rebuildQuantity: number;
	/** Number of scrap records. */
	records: number;
};

/**
 * `createdAt` holds local wall-clock time read as UTC (see `getLocalDateTimeForDb`),
 * so the local period bounds are shifted the same way.
 */
function periodWhere(period: Period, project: string | undefined): Prisma.ScrapRecordWhereInput {
	const createdAt = { gte: getLocalDateTimeForDb(period.from), lt: getLocalDateTimeForDb(period.to) };
	const conditions: Prisma.ScrapRecordWhereInput[] = [{ createdAt }];
	if (project) conditions.push({ partGroup: { is: { vProject: project } } });
	return { AND: conditions };
}

/** Scrap = `isRebuild = false` (quantity scrap included), rebuild = `isRebuild = true`. */
async function loadPartTotals(where: Prisma.ScrapRecordWhereInput): Promise<PartTotals> {
	const rows = await prismaClient.scrapRecord.groupBy({
		by: ['isRebuild'],
		where,
		_sum: { quantity: true },
		_count: { _all: true }
	});
	const totals: PartTotals = { quantity: 0, scrapQuantity: 0, rebuildQuantity: 0, records: 0 };
	for (const row of rows) {
		const quantity = row._sum.quantity ?? 0;
		totals.quantity += quantity;
		totals.records += row._count._all;
		if (row.isRebuild) totals.rebuildQuantity += quantity;
		else totals.scrapQuantity += quantity;
	}
	return totals;
}

/** Change of parts in %, or `null` when the previous period has no parts to compare with. */
function changePercent(current: number, previous: number): number | null {
	if (previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

/** Distinct scanned DMC codes; quantity scrap labels stand for no physical part, so they are left out. */
async function countScannedLabels(): Promise<number> {
	// COUNT(DISTINCT) runs in SQL Server; Prisma's `distinct` would deduplicate rows in memory.
	const [row] = await prismaClient.$queryRaw<{ count: number }[]>`
		SELECT COUNT(DISTINCT dmc) AS count
		FROM ScrapRecord
		WHERE dmc NOT LIKE ${`${quantityScrapLabelPrefix}%`}`;
	return Number(row?.count ?? 0);
}

/** Counts of what the app keeps; independent of the dashboard filters. */
async function loadMasterData() {
	const [projects, partGroups, partNumbers, labels] = await Promise.all([
		// Only projects with part groups can get scrap records (QAD lists many more).
		prismaClient.partGroup.groupBy({ by: ['vProject'], where: { vProject: { not: null } } }),
		prismaClient.partGroup.count(),
		prismaClient.partGroupMaterial.count(),
		countScannedLabels()
	]);
	return {
		projects: projects.filter((group) => Boolean(group.vProject)).length,
		partGroups,
		partNumbers,
		labels
	};
}

/** All scrap records since the first one; independent of the dashboard filters. */
async function loadAllTime() {
	const result = await prismaClient.scrapRecord.aggregate({
		_sum: { quantity: true },
		_count: { _all: true },
		_min: { createdAt: true }
	});
	return {
		quantity: result._sum.quantity ?? 0,
		records: result._count._all,
		firstRecordAt: result._min.createdAt
	};
}

/** Projects with at least one scrap record in the period, plus the selected one, by name. */
async function loadProjectsInPeriod(period: Period, selected: string | undefined) {
	// A relation filter (EXISTS) instead of an `id IN (...)` list, which could exceed
	// SQL Server's 2100 parameter limit on long periods.
	const partGroups = await prismaClient.partGroup.findMany({
		where: { scrapRecords: { some: periodWhere(period, undefined) } },
		distinct: ['vProject'],
		select: { vProject: true }
	});
	const projects = new Set(
		partGroups.map((group) => group.vProject).filter((p): p is string => Boolean(p))
	);
	if (selected) projects.add(selected);
	return [...projects].sort((a, b) => a.localeCompare(b));
}

export type DashboardStats = Awaited<ReturnType<typeof queryDashboardStats>>;

async function queryDashboardStats(filters: DashboardFilters) {
	const [projects, current, previous, masterData, allTime] = await Promise.all([
		loadProjectsInPeriod(filters.period, filters.project),
		loadPartTotals(periodWhere(filters.period, filters.project)),
		loadPartTotals(periodWhere(filters.previousPeriod, filters.project)),
		loadMasterData(),
		loadAllTime()
	]);
	return {
		filters: {
			range: filters.range,
			project: filters.project,
			from: filters.customDates?.from,
			to: filters.customDates?.to
		},
		projects,
		totals: { ...current, changePercent: changePercent(current.quantity, previous.quantity) },
		masterData,
		allTime
	};
}

const statsCache = createTtlCache<DashboardStats>(60_000);

/**
 * Dashboard numbers for the filters, kept 60 s per filter combination. Rolling ranges are keyed
 * by the range name, so within that minute they may lag behind `now` by up to 60 s.
 */
export function loadDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
	const key = JSON.stringify([
		filters.range,
		filters.project ?? null,
		filters.customDates?.from ?? null,
		filters.customDates?.to ?? null
	]);
	return statsCache.get(key, () => queryDashboardStats(filters));
}
