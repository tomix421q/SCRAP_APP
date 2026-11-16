import { error } from '@sveltejs/kit';

export const dashboardRanges = ['1d', '7d', '30d', 'custom'] as const;
export type DashboardRange = (typeof dashboardRanges)[number];
export const defaultDashboardRange: DashboardRange = '7d';

/** Button label and period description of each range. */
export const dashboardRangeLabels: Record<DashboardRange, { button: string; period: string }> = {
	'1d': { button: '1 day', period: 'Last 24 hours' },
	'7d': { button: '7 days', period: 'Last 7 days' },
	'30d': { button: '30 days', period: 'Last 30 days' },
	custom: { button: 'Custom', period: 'Custom range' }
};

/** Half-open time window `[from, to)`. */
export type Period = { from: Date; to: Date };

export type DashboardFilters = {
	range: DashboardRange;
	project: string | undefined;
	/** Inclusive `YYYY-MM-DD` dates of a custom range, as given in the URL. */
	customDates: { from: string; to: string } | undefined;
	period: Period;
	/** Equally long period right before `period`, for the change in %. */
	previousPeriod: Period;
};

const rollingDays: Record<Exclude<DashboardRange, 'custom'>, number> = {
	'1d': 1,
	'7d': 7,
	'30d': 30
};

const dayMs = 24 * 60 * 60 * 1000;
const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function addDays(date: Date, days: number) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function isDashboardRange(value: string): value is DashboardRange {
	return (dashboardRanges as readonly string[]).includes(value);
}

/** Parses a `YYYY-MM-DD` date as local midnight; rejects impossible days like 2026-02-30. */
function parseLocalDate(value: string | null, field: string): Date {
	const match = value ? isoDatePattern.exec(value) : null;
	if (match) {
		const [year, month, day] = match.slice(1).map(Number);
		const date = new Date(year, month - 1, day);
		if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
			return date;
		}
	}
	throw error(400, { message: `Invalid ${field} date. Use the format YYYY-MM-DD.` });
}

function parseCustomPeriod(params: URLSearchParams): { period: Period; days: number } {
	const from = parseLocalDate(params.get('from'), 'from');
	const to = addDays(parseLocalDate(params.get('to'), 'to'), 1);
	if (to <= from) {
		throw error(400, { message: 'The start date must not be after the end date.' });
	}
	const oneYearLater = new Date(from);
	oneYearLater.setFullYear(from.getFullYear() + 1);
	if (to > oneYearLater) {
		throw error(400, { message: 'A custom range can be at most one year long.' });
	}
	// Rounded: a DST change makes one day 23 or 25 hours long.
	return { period: { from, to }, days: Math.round((to.getTime() - from.getTime()) / dayMs) };
}

/**
 * Parses the home dashboard query string (`range`, `from`, `to`, `project`) into the current
 * and previous period. Throws a 400 error for invalid values.
 */
export function parseDashboardFilters(params: URLSearchParams, now: Date): DashboardFilters {
	const range = params.get('range') ?? defaultDashboardRange;
	if (!isDashboardRange(range)) {
		throw error(400, { message: 'Invalid dashboard range.' });
	}
	const project = params.get('project')?.trim() || undefined;

	const { period, days } =
		range === 'custom'
			? parseCustomPeriod(params)
			: { period: { from: addDays(now, -rollingDays[range]), to: now }, days: rollingDays[range] };
	// Shifted by calendar days (not milliseconds) so a DST change keeps the same wall-clock times.
	const previousPeriod = { from: addDays(period.from, -days), to: period.from };
	const customDates =
		range === 'custom' ? { from: params.get('from')!, to: params.get('to')! } : undefined;

	return { range, project, customDates, period, previousPeriod };
}

/** Local date and time as `YYYY-MM-DDTHH:mm`, the value format of `<input type="datetime-local">`. */
function toDateTimeLocal(date: Date) {
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Query string for `/scrapRecords` showing the dashboard's period and project
 * (`dateFrom`, `dateTo`, `project`, as read by `parseScrapRecordFilters`).
 * Scrap records treat `dateTo` as inclusive to the minute, so the end is the last minute
 * before the exclusive end of the period.
 */
export function toScrapRecordsQuery(filters: Pick<DashboardFilters, 'period' | 'project'>) {
	const params = new URLSearchParams({
		dateFrom: toDateTimeLocal(filters.period.from),
		dateTo: toDateTimeLocal(new Date(filters.period.to.getTime() - 60_000))
	});
	if (filters.project) params.set('project', filters.project);
	return params.toString();
}
