import { Prisma } from '@prisma/client';
import prismaClient from '@/server/prisma';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
import type { DashboardFilters, Period } from '@/utils/dashboardFilters';
import { createTtlCache } from '@/utils/ttlCache';
import { getLocalDateTimeForDb } from '@/utils/index';
import {
	buildTrendBuckets,
	pickTrendGranularity,
	type TrendGranularity,
	type TrendRow
} from '@/utils/trendBuckets';

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

/** Bucket index per granularity: whole units since 1900-01-01 00:00 (a Monday), see `TrendRow`. */
const trendBucketSql: Record<TrendGranularity, Prisma.Sql> = {
	hour: Prisma.sql`DATEDIFF(HOUR, 0, sr.createdAt)`,
	day: Prisma.sql`DATEDIFF(DAY, 0, sr.createdAt)`,
	week: Prisma.sql`DATEDIFF(DAY, 0, sr.createdAt) / 7`
};

/**
 * DB-time bound as an ISO string without a zone, so SQL Server reads the same wall-clock time
 * that `createdAt` holds, whatever zone the driver would convert a `Date` parameter to.
 */
function toDbDateTimeLiteral(dbTime: Date) {
	return dbTime.toISOString().slice(0, 23);
}

/**
 * Parts per time bucket, split into scrap and rebuild, for the same records as `loadPartTotals`
 * (period and project), so the buckets add up to Total parts. Empty buckets hold zeros.
 */
async function loadTrend(period: Period, project: string | undefined) {
	const dbPeriod = {
		from: getLocalDateTimeForDb(period.from),
		to: getLocalDateTimeForDb(period.to)
	};
	const granularity = pickTrendGranularity(dbPeriod);
	const bucket = trendBucketSql[granularity];
	const projectJoin = project
		? Prisma.sql`INNER JOIN PartGroup pg ON pg.id = sr.partGroupId AND pg.vProject = ${project}`
		: Prisma.empty;
	// Column types as the driver may hand them back (BIT, SUM); normalized below.
	const rows = await prismaClient.$queryRaw<Record<keyof TrendRow, unknown>[]>(Prisma.sql`
		SELECT ${bucket} AS bucket, sr.isRebuild AS isRebuild, SUM(sr.quantity) AS quantity
		FROM ScrapRecord sr
		${projectJoin}
		WHERE sr.createdAt >= CAST(${toDbDateTimeLiteral(dbPeriod.from)} AS datetime2)
			AND sr.createdAt < CAST(${toDbDateTimeLiteral(dbPeriod.to)} AS datetime2)
		GROUP BY ${bucket}, sr.isRebuild`);
	const trendRows: TrendRow[] = rows.map((row) => ({
		bucket: Number(row.bucket),
		isRebuild: Boolean(row.isRebuild),
		quantity: Number(row.quantity)
	}));
	return { granularity, buckets: buildTrendBuckets(dbPeriod, granularity, trendRows) };
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
	const [projects, current, previous, trend, masterData, allTime] = await Promise.all([
		loadProjectsInPeriod(filters.period, filters.project),
		loadPartTotals(periodWhere(filters.period, filters.project)),
		loadPartTotals(periodWhere(filters.previousPeriod, filters.project)),
		loadTrend(filters.period, filters.project),
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
		trend,
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
